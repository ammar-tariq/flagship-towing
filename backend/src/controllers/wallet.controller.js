const User = require('../models/user.model');
const { toPublicUploadUrl, ensureUploadDir } = require('../helpers/uploads');
const { generateAppleWalletPass, generateGoogleWalletPass } = require('../helpers/wallet');
const { getUserPaymentLogs } = require('../helpers/stripe');

/**
 * Resolve membership from DB/Stripe for the authenticated user.
 * Never trust client-supplied membership fields for pass contents.
 */
const resolveOwnedSubscription = async (userId, subscriptionId) => {
    if (!subscriptionId) {
        throw new Error('Subscription id is required');
    }

    const logs = await getUserPaymentLogs(userId);
    const all = [
        ...(logs.active_subscriptions || []),
        ...(logs.inactive_subscriptions || []),
    ];
    const found = all.find((s) => String(s.id) === String(subscriptionId));
    if (!found) {
        throw new Error('Membership not found for this account');
    }
    return found;
};

const resolveMembershipExpiry = (subscription) => {
    const vessel = subscription?.vessel;
    const raw =
        (subscription?.source === 'offline' || subscription?.source === 'admin') &&
        vessel?.offline_membership_expires_at
            ? vessel.offline_membership_expires_at
            : subscription?.current_period_end;
    if (raw == null || raw === '') return null;
    const end = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(end.getTime()) ? null : end;
};

/** Active Stripe/trialing/offline term that has not passed its expiry. */
const assertMembershipActiveForWallet = (subscription) => {
    const status = String(subscription?.status || '').toLowerCase();
    if (status !== 'active' && status !== 'trialing') {
        throw new Error('Only active memberships can be added to Wallet');
    }
    const end = resolveMembershipExpiry(subscription);
    if (end && end.getTime() < Date.now()) {
        throw new Error('Expired memberships cannot be added to Wallet');
    }
};

/**
 * Generate Apple Wallet Pass (.pkpass) for iOS
 * @route POST /wallet/apple
 * @param {Object} req.body.subscription - Must include `id` of owned membership
 * @param {Boolean} req.body.force - Force regeneration (optional, default: false)
 */
const generateApplePass = async (req, res) => {
    try {
        const { decoded, body } = req;

        const user = await User.findById(decoded.id);
        if (!user) {
            throw new Error("User not found");
        }

        const subscriptionId = body?.subscription?.id || body?.subscriptionId;
        const subscription = await resolveOwnedSubscription(decoded.id, subscriptionId);
        assertMembershipActiveForWallet(subscription);

        // Always regenerate so vessel/member updates are not stuck behind a stale .pkpass cache.
        const fs = require('fs');
        const path = require('path');

        const passesDir = ensureUploadDir('passes');

        const sanitizedId = String(subscription.id).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `membership-${sanitizedId}.pkpass`;
        const filePath = path.join(passesDir, filename);

        const passUrl = toPublicUploadUrl(path.join('uploads', 'passes', filename));
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        const passData = await generateAppleWalletPass(subscription, user);
        
        if (passData.configured && passData.passBuffer) {
            fs.writeFileSync(filePath, passData.passBuffer);
            
            return res.status(200).json({
                success: true,
                message: "Apple Wallet pass generated successfully",
                data: {
                    configured: true,
                    passUrl: passUrl,
                    filename: filename,
                    fileSize: passData.passBuffer.length,
                    cached: false
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Apple Wallet pass structure generated",
            data: passData,
            note: passData?.message || "Apple Developer certificates not configured"
        });

    } catch (e) {
        console.error("Error generating Apple Wallet pass:", e.message);
        return res.status(400).json({
            success: false,
            message: e.message
        });
    }
};

/**
 * Generate Google Wallet Pass for Android
 * @route POST /wallet/google
 * @param {Object} req.body.subscription - Must include `id` of owned membership
 */
const generateGooglePass = async (req, res) => {
    try {
        const { decoded, body } = req;

        const user = await User.findById(decoded.id);
        if (!user) {
            throw new Error("User not found");
        }

        const subscriptionId = body?.subscription?.id || body?.subscriptionId;
        const subscription = await resolveOwnedSubscription(decoded.id, subscriptionId);
        assertMembershipActiveForWallet(subscription);

        const passData = await generateGoogleWalletPass(subscription, user);

        return res.status(200).json({
            success: true,
            message: "Google Wallet pass generated successfully",
            data: passData
        });

    } catch (e) {
        console.error("Error generating Google Wallet pass:", e.message);
        return res.status(400).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = {
    generateApplePass,
    generateGooglePass
};
