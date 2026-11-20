const path = require('path');
const ejs = require('ejs');
const {
    handleCheckoutSessionCancel,
    buildCheckoutResultView,
} = require('../helpers/stripe');

const viewsPath = path.resolve(__dirname, '../../views');
const APP_SCHEME = 'flagshiptowing';

/**
 * Membership portal origin for post-checkout CTAs.
 * Prefer env; fall back to known staging/live hosts so web signup is never stuck
 * with only an app deep-link.
 */
const getPortalUrl = () => {
    const raw =
        process.env.MEMBERSHIP_PORTAL_URL ||
        process.env.PUBLIC_MEMBERSHIP_URL ||
        '';
    const trimmed = String(raw).trim().replace(/\/+$/, '');
    if (trimmed) return trimmed;

    const appName = String(process.env.APP_NAME || '');
    if (appName.includes('staging')) {
        return 'https://flagship-towing-member.projectstagingzone.com/staging';
    }
    return 'https://membership.flagshiptowingadmin.us';
};

const buildAppDeepLink = (outcome, view) => {
    const deepPath =
        outcome === 'cancel' ? 'payment/cancel' : 'payment/success';
    const params = new URLSearchParams();
    if (view.session_id) params.set('session_id', view.session_id);
    if (view.vessel_id) params.set('vessel_id', view.vessel_id);
    const qs = params.toString();
    return `${APP_SCHEME}://${deepPath}${qs ? `?${qs}` : ''}`;
};

const withPageLinks = (view, outcome) => {
    const portalBase = getPortalUrl();
    const isWeb = view.source === 'web' || view.source === 'admin';
    const paymentQuery =
        outcome === 'cancel' ? 'payment=cancelled' : 'payment=success';
    const signinParams = new URLSearchParams();
    if (outcome === 'success') signinParams.set('from', 'checkout');
    if (view.customer_email) signinParams.set('email', view.customer_email);
    const signinQs = signinParams.toString();
    const signinUrl = `${portalBase}/signin.html${signinQs ? `?${signinQs}` : ''}`;
    const portalUserUrl = `${portalBase}/user.html?${paymentQuery}`;
    const signupUrl = `${portalBase}/index.html`;
    const addVesselUrl = `${portalBase}/add-vessel.html`;
    const appDeepLink = buildAppDeepLink(outcome, view);

    let primary_cta_url;
    let primary_cta_label;
    let secondary_cta_url = null;
    let secondary_cta_label = null;
    let lead;
    let hint;

    if (outcome === 'success') {
        if (isWeb) {
            primary_cta_url = signinUrl;
            primary_cta_label = 'Sign in to member portal';
            secondary_cta_url = appDeepLink;
            secondary_cta_label = 'Back to the app';
            lead = view.verified
                ? 'Thank you. Your membership payment completed successfully. Sign in to the member portal to view your account, or open the app if you already have it installed.'
                : 'We are confirming your payment. Once it clears, sign in to the member portal to view your membership.';
            hint =
                'Use the email from checkout to sign in. New accounts receive a welcome email with a temporary password.';
        } else {
            primary_cta_url = appDeepLink;
            primary_cta_label = 'Back to the app';
            secondary_cta_url = portalUserUrl;
            secondary_cta_label = 'Go to member portal';
            lead = view.verified
                ? 'Thank you. Your membership payment completed successfully. Return to the app to see your updated membership status.'
                : 'We are confirming your payment with our processor. If you completed checkout, your membership will activate shortly — then return to the app.';
            hint = 'Returning to the app refreshes your latest membership and vessel status.';
        }
    } else {
        // cancel
        if (isWeb) {
            primary_cta_url =
                view.source === 'admin' ? addVesselUrl : signupUrl;
            primary_cta_label = 'Try again';
            secondary_cta_url = signinUrl;
            secondary_cta_label = 'Sign in';
            lead =
                'No charge was made. You can try checkout again or sign in if you already have an account.';
            hint =
                'If you closed checkout by mistake, start membership again from the website when you are ready.';
        } else {
            primary_cta_url = appDeepLink;
            primary_cta_label = 'Back to the app';
            secondary_cta_url = addVesselUrl;
            secondary_cta_label = 'Try again on the website';
            lead =
                'No charge was made. Return to the app or try again on the website when you are ready to activate membership.';
            hint =
                'If you closed checkout by mistake, open the app or website and start membership again.';
        }
    }

    return {
        ...view,
        is_web_checkout: isWeb,
        app_deep_link: appDeepLink,
        portal_url: portalUserUrl,
        signin_url: signinUrl,
        try_again_url: isWeb ? (view.source === 'admin' ? addVesselUrl : signupUrl) : addVesselUrl,
        primary_cta_url,
        primary_cta_label,
        secondary_cta_url,
        secondary_cta_label,
        lead,
        hint,
        show_portal_cta: isWeb,
    };
};

/**
 * GET /redirect/success
 * Stripe Checkout success → HTML with payment summary + context-aware CTAs.
 */
const success = async (req, res) => {
    try {
        const sessionId = req.query.session_id || null;
        const view = withPageLinks(
            await buildCheckoutResultView(sessionId, { outcome: 'success' }),
            'success',
        );

        const html = await ejs.renderFile(
            path.join(viewsPath, 'checkout-success.ejs'),
            view,
        );
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (err) {
        console.error('Error rendering checkout success page:', err);
        res.status(500).send('Unable to load success page.');
    }
};

/**
 * GET /redirect/cancel
 * Stripe Checkout cancel → HTML + context-aware CTAs.
 */
const cancel = async (req, res) => {
    try {
        const sessionId = req.query.session_id || null;

        if (sessionId) {
            try {
                await handleCheckoutSessionCancel(sessionId);
            } catch (err) {
                console.error('Error handling checkout cancel:', err.message);
            }
        }

        const view = withPageLinks(
            await buildCheckoutResultView(sessionId, { outcome: 'cancel' }),
            'cancel',
        );

        const html = await ejs.renderFile(
            path.join(viewsPath, 'checkout-cancel.ejs'),
            view,
        );
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (err) {
        console.error('Error rendering checkout cancel page:', err);
        res.status(500).send('Unable to load cancel page.');
    }
};

module.exports = {
    success,
    cancel,
};
