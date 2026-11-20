import AppWrapper from '@Components/Wrapper/AppWrapper';
import WhiteWrapper from '@Components/Wrapper/WhiteWrapper';
import {font, heightPixel} from '@Utils/helpers';
import React, {useMemo} from 'react';
import {useWindowDimensions, View} from 'react-native';
import {styles} from './styles';
import AppText from '@Components/AppText';
import useServiceDetail from '@Hooks/useServiceDetail';
import {Loader} from '@Components/Loader';
import RenderHTML from 'react-native-render-html';
import {fonts} from '@Assets/Fonts';
import {colors} from '@Utils/color';
import CachedImage from '@Components/CachedImage';

const HTML_RENDERERS = {
  p: (props: any) => {
    const {TDefaultRenderer, tnode, style} = props;
    const inlineStyle = tnode?.domNode?.attribs?.style || '';
    let textColor = colors.black;
    if (inlineStyle) {
      const colorMatch = inlineStyle.match(/color\s*:\s*([^;]+)/i);
      if (colorMatch?.[1]) {
        textColor = colorMatch[1].trim();
      }
    }
    return (
      <TDefaultRenderer
        {...props}
        style={[
          style,
          {
            fontFamily: fonts.Hellix.regular,
            fontSize: font(12),
            color: textColor,
            marginHorizontal: 0,
            paddingHorizontal: 0,
          },
        ]}
      />
    );
  },
};

const HTML_TAGS_STYLES = {
  body: {
    fontFamily: fonts.Hellix.regular,
    color: colors.black,
  },
  p: {
    fontFamily: fonts.Hellix.regular,
    fontSize: font(12),
    color: colors.black,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  em: {
    fontFamily: fonts.Hellix.medium,
  },
};

const HTML_BASE_STYLE = {
  fontFamily: fonts.Hellix.regular,
  fontSize: font(12),
  color: colors.black,
};

const HTML_SYSTEM_FONTS = [
  fonts.Hellix.regular,
  fonts.Hellix.medium,
  fonts.Hellix.semibold,
  fonts.Hellix.bold,
];

const ServiceDetailScreen = () => {
  const {values} = useServiceDetail();
  const {width} = useWindowDimensions();

  const htmlSource = useMemo(
    () => ({html: values?.data?.description ?? ''}),
    [values?.data?.description],
  );

  if (values?.isLoading) {
    return <Loader />;
  }

  return (
    <AppWrapper scroll style={{paddingTop: heightPixel(15)}}>
      <WhiteWrapper>
        <CachedImage source={values?.data?.image} style={styles.image_style} />
        <AppText weight="semibold" style={[styles.header_text, {fontSize: font(20)}]}>
          {values?.data?.title}
        </AppText>
        <View style={styles.htmlContainer}>
          <RenderHTML
            contentWidth={width}
            source={htmlSource}
            renderers={HTML_RENDERERS}
            tagsStyles={HTML_TAGS_STYLES}
            baseStyle={HTML_BASE_STYLE}
            systemFonts={HTML_SYSTEM_FONTS}
            defaultTextProps={{
              style: {
                fontFamily: fonts.Hellix.regular,
                fontSize: font(14),
                lineHeight: font(20),
              },
            }}
            enableExperimentalMarginCollapsing
            enableCSSInlineProcessing
            allowedStyles={[
              'color',
              'backgroundColor',
              'fontSize',
              'fontWeight',
              'textAlign',
            ]}
          />
        </View>
      </WhiteWrapper>
    </AppWrapper>
  );
};

export default ServiceDetailScreen;
