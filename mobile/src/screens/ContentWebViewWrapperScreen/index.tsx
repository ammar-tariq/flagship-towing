import { Loader } from '@Components/Loader';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { useGetContentQuery } from '@Api/user';
import { rebaseContentHtml } from '@Utils/imageUrl';
import { GeneralScreenProps } from '@Types/navigation';

export type ContentWebViewContentKey =
  | 'about_us'
  | 'privacy_policy'
  | 'terms_and_conditions'
  | 'member_agreement';

const ROUTE_NAME_TO_CONTENT_KEY: Record<string, ContentWebViewContentKey> = {
  AboutUs: 'about_us',
  PrivacyPolicy: 'privacy_policy',
  TermsAndConditions: 'terms_and_conditions',
  MemberAgreement: 'member_agreement',
};

type ContentWebViewRouteName =
  | 'AboutUs'
  | 'PrivacyPolicy'
  | 'TermsAndConditions'
  | 'MemberAgreement';

const withQueryParam = (url: string, key: string, value: string) => {
  const next = new URL(url);
  next.searchParams.set(key, value);
  return next.toString();
};

/** Injected HTML has no document URL, so honor hideHeading from the request URL. */
const applyHeadingQuery = (html: string, url: string) => {
  let hide = false;
  try {
    hide = new URL(url).searchParams.get('hideHeading') === '1';
  } catch {
    hide = false;
  }
  if (!hide) {
    return html;
  }
  return html.replace('<head>', '<head><script>window.__HIDE_PAGE_HEADING__=true</script>');
};

const ContentWebViewWrapperScreen = (
  props: GeneralScreenProps<
    'AboutUs' | 'PrivacyPolicy' | 'TermsAndConditions' | 'MemberAgreement'
  >,
) => {
  const { route } = props;
  const contentKey =
    (route.params as {contentKey?: ContentWebViewContentKey} | undefined)
      ?.contentKey ??
    ROUTE_NAME_TO_CONTENT_KEY[route.name as ContentWebViewRouteName];

  const { data, isLoading } = useGetContentQuery();
  const uri = contentKey ? data?.data?.[contentKey] : undefined;
  const pageUrl = (() => {
    if (typeof uri !== 'string') {
      return undefined;
    }
    try {
      return withQueryParam(uri, 'hideHeading', '1');
    } catch {
      return uri;
    }
  })();
  const [html, setHtml] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Android WebView downloads a response with Content-Disposition: attachment
  // instead of rendering it. Fetch the body and load it as HTML so the page shows.
  useEffect(() => {
    if (!pageUrl) {
      setHtml(null);
      setLoadFailed(false);
      return;
    }

    let cancelled = false;
    setHtml(null);
    setLoadFailed(false);

    fetch(pageUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Content request failed (${response.status})`);
        }
        return response.text();
      })
      .then(text => {
        if (!cancelled) {
          setHtml(rebaseContentHtml(applyHeadingQuery(text, pageUrl)));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pageUrl]);

  if (isLoading || (pageUrl && !html && !loadFailed)) {
    return <Loader />;
  }

  if (!pageUrl || !html) {
    return null;
  }

  const baseUrl = pageUrl.slice(0, pageUrl.lastIndexOf('/') + 1);

  return (
    <WebView
      originWhitelist={['*']}
      source={{html, baseUrl}}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
    />
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});

export default ContentWebViewWrapperScreen;
