const dotenv = require('dotenv')
const User = require("../models/user.model")
const Vessel = require("../models/vessel.model")
const Package = require("../models/package.model")
const AppSettings = require("../models/appSettings.model")
const { getApiBaseUrl } = require('../configs/serverUrl')
const { sendNotification } = require('./notification')
const { sendMail } = require('./email')
const { INTERVALS } = require('../utils')
const { assertActiveStripePrice } = require('./security')
const { recordActivity, personFrom } = require('./activityLog')
const { rewriteStoredUploadUrl } = require('./uploads')

dotenv.config()

/** Membership channel for admin/logs: app | web | admin */
const normalizeMembershipSource = (raw) => {
    const s = String(raw || '').toLowerCase()
    if (s === 'app' || s === 'web' || s === 'admin') return s
    if (s === 'offline') return 'admin'
    return null
}

const createStripe = (secretKey) => require('stripe')(secretKey)

/**
 * Which Stripe env keys to use:
 * - AppSettings `stripe_dev` true → dev keys (global)
 * - User `dev` true → dev keys for that user's API calls and catalog
 * Webhook: verifies with STRIPE_WEBHOOK_SECRET_DEV first, then STRIPE_WEBHOOK_KEY, so both test- and live-mode endpoints can hit the same URL.
 * All Stripe SDK calls must go through getStripe({ user }) or getStripe({ useDevKeys }) so routing stays consistent.
 */
let cachedStripeDev = null
let cachedStripeDevAt = 0
const CACHE_TTL_MS = 3000

/** Reuse one Stripe instance per resolved secret key; cleared when app settings change. */
let cachedStripeClient = null
let cachedStripeClientForKey = null

async function readStripeDevFlag() {
    const now = Date.now()
    if (cachedStripeDev !== null && now - cachedStripeDevAt < CACHE_TTL_MS) {
        return cachedStripeDev
    }
    const doc = await AppSettings.findById('singleton').lean()
    cachedStripeDev = !!(doc && doc.stripe_dev)
    cachedStripeDevAt = now
    return cachedStripeDev
}

async function shouldUseDevStripeKeys(user) {
    if (await readStripeDevFlag()) return true
    if (user && user.dev === true) return true
    return false
}

/** Live vs test customer fields — Stripe IDs are not shared across modes. */
const stripeCustomerField = (useDev) =>
    useDev ? 'stripe_customer_id_dev' : 'stripe_customer_id'

const findUserByStripeCustomerId = (customerId) => {
    if (!customerId) return null
    return User.findOne({
        $or: [
            { stripe_customer_id: customerId },
            { stripe_customer_id_dev: customerId },
        ],
    })
}

/**
 * Returns the customer id for the Stripe mode the user is currently on.
 * Creates one if missing, or if the stored id belongs to the other mode
 * ("No such customer").
 */
const ensureStripeCustomer = async (user) => {
    if (!user?._id) {
        throw new Error('User not found')
    }

    const useDev = await shouldUseDevStripeKeys(user)
    const field = stripeCustomerField(useDev)
    let customerId = user[field] || null
    const stripe = await getStripe({ user })

    if (customerId) {
        try {
            const existing = await stripe.customers.retrieve(customerId)
            if (!existing?.deleted) {
                return customerId
            }
        } catch (error) {
            const missing =
                error?.code === 'resource_missing' ||
                /no such customer/i.test(String(error?.message || ''))
            if (!missing) {
                throw error
            }
            // Stale id from the other Stripe mode (or deleted) — create a fresh one.
            customerId = null
        }
    }

    customerId = await createCustomer(user.email, displayName(user), user)
    user[field] = customerId
    await user.save()
    return customerId
}

const getStoredStripeCustomerId = async (user) => {
    if (!user) return null
    const useDev = await shouldUseDevStripeKeys(user)
    return user[stripeCustomerField(useDev)] || null
}

/**
 * Read-only customer lookup for membership logs / current subs.
 * Checkout uses the current Stripe mode (test vs live). Members who paid
 * in the other mode still have that customer id, so fall back to it with
 * matching API keys instead of skipping Stripe entirely.
 */
const resolveStripeCustomerForRead = async (user) => {
    if (!user) return { customerId: null, useDevKeys: false }
    const preferredDev = await shouldUseDevStripeKeys(user)
    const preferredId = user[stripeCustomerField(preferredDev)] || null
    if (preferredId) {
        return { customerId: preferredId, useDevKeys: preferredDev }
    }
    const fallbackDev = !preferredDev
    const fallbackId = user[stripeCustomerField(fallbackDev)] || null
    if (fallbackId) {
        return { customerId: fallbackId, useDevKeys: fallbackDev }
    }
    return { customerId: null, useDevKeys: preferredDev }
}

function invalidateStripeSettingsCache() {
    cachedStripeDev = null
    cachedStripeDevAt = 0
    cachedStripeClient = null
    cachedStripeClientForKey = null
}

async function resolveStripeSecretKey({ user, useDevKeys } = {}) {
    let dev = false
    if (typeof useDevKeys === 'boolean') {
        dev = useDevKeys
    } else {
        dev = await shouldUseDevStripeKeys(user)
    }
    if (dev) {
        const k = process.env.STRIPE_SECRET_KEY_DEV || process.env.STRIPE_SECRET_KEY
        if (!k) throw new Error('STRIPE_SECRET_KEY_DEV or STRIPE_SECRET_KEY must be set when Stripe dev mode is on')
        return k
    }
    const k = process.env.STRIPE_SECRET_KEY
    if (!k) throw new Error('STRIPE_SECRET_KEY is not configured')
    return k
}

async function getStripe(opts = {}) {
    const key = await resolveStripeSecretKey(opts)
    if (cachedStripeClient && cachedStripeClientForKey === key) {
        return cachedStripeClient
    }
    cachedStripeClientForKey = key
    cachedStripeClient = createStripe(key)
    return cachedStripeClient
}

/** Any Stripe instance can verify webhooks; signing uses only the secret. */
function constructWebhookEvent(body, sig, secret) {
    const key =
        process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_DEV
    if (!key) {
        throw new Error(
            'STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_DEV must be set for webhook verification',
        )
    }
    const stripe = createStripe(key)
    return stripe.webhooks.constructEvent(body, sig, secret)
}

const webhook = async (req, res) => {
    let event
    let webhookUsedDevKeys = false

    try {
        const sig = req.headers["stripe-signature"]
        const devSecret = process.env.STRIPE_WEBHOOK_SECRET_DEV
        const prodSecret = process.env.STRIPE_WEBHOOK_KEY
        const attempts = []
        if (devSecret) attempts.push({ secret: devSecret, useDevKeys: true })
        if (prodSecret) attempts.push({ secret: prodSecret, useDevKeys: false })

        const seen = new Set()
        const uniqueAttempts = attempts.filter((a) => {
            if (!a.secret || seen.has(a.secret)) return false
            seen.add(a.secret)
            return true
        })

        if (!uniqueAttempts.length) {
            throw new Error('No Stripe webhook signing secrets configured (STRIPE_WEBHOOK_SECRET_DEV and/or STRIPE_WEBHOOK_KEY)')
        }

        let lastErr = null
        for (const { secret, useDevKeys } of uniqueAttempts) {
            try {
                event = constructWebhookEvent(req.body, sig, secret)
                webhookUsedDevKeys = useDevKeys
                break
            } catch (err) {
                lastErr = err
            }
        }
        if (!event) {
            throw lastErr || new Error('Webhook signature verification failed')
        }
    } catch (err) {
        console.error("⚠️ Webhook signature verification failed.", err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    const stripe = await getStripe({ useDevKeys: webhookUsedDevKeys })

    if (event.type === "checkout.session.completed") {

        const session = event.data.object
        const vessel_id = session?.metadata?.vessel_id
        const user_id = session?.metadata?.user_id

        const isPaid =
            session.payment_status === 'paid' ||
            session.status === 'complete'

        if (!isPaid) {
            console.warn(
                'checkout.session.completed: session not paid, skipping activation',
                session.id,
                session.payment_status,
                session.status,
            )
            recordActivity({
                action: 'membership.activated',
                outcome: 'failure',
                message: 'Checkout completed but payment was not collected',
                actor: { id: user_id },
                metadata: {
                    session_id: session.id,
                    vessel_id,
                    payment_status: session.payment_status,
                },
            })
            return res.json({ received: true })
        }

        if (!vessel_id) {
            console.warn('checkout.session.completed: missing vessel_id in metadata', session.id)
            recordActivity({
                action: 'membership.activated',
                outcome: 'failure',
                message: 'Checkout completed without a vessel',
                actor: { id: user_id },
                metadata: { session_id: session.id },
            })
            return res.json({ received: true })
        }

        // findByIdAndUpdate returns the PRE-update doc: if this exact session
        // already activated the vessel, this is a Stripe redelivery (retry or
        // duplicate endpoint) — ack it without repeating notifications/logs.
        const previousVessel = await Vessel.findByIdAndUpdate(vessel_id, {
            $set: { active: true, last_checkout_session_id: session.id },
        })
        const alreadyProcessed =
            previousVessel?.active &&
            previousVessel?.last_checkout_session_id === session.id

        if (alreadyProcessed) {
            console.log(
                'checkout.session.completed: duplicate delivery ignored',
                session.id,
                vessel_id,
            )
            return res.json({ received: true })
        }

        let user = await findUserByStripeCustomerId(session?.customer)

        if (!user && user_id) {
            user = await User.findById(user_id)
        }

        if (user_id) {
            await User.findByIdAndUpdate(user_id, { $set: { website_signup_pending: false } })
        } else if (user?._id) {
            await User.findByIdAndUpdate(user._id, { $set: { website_signup_pending: false } })
        }

        try {
            await stripe.subscriptions.update(session?.subscription, {
                metadata: {
                    vessel_id,
                    source: session?.metadata?.source || 'app',
                },
            })
        } catch (err) {
            // Metadata tagging is non-critical — never leave the webhook
            // unanswered over it (an unanswered webhook makes Stripe retry
            // the event for days, re-triggering notifications).
            console.warn(
                'checkout.session.completed: could not tag subscription metadata',
                err.message,
            )
        }

        sendNotification(
            {
                title: "Subscription Success",
                body: `Membership activated for vessel ${vessel_id}`,
                data: { type: "subscription_success", vessel_id: vessel_id },
            },
            user?._id,
            false
        )

        recordActivity({
            action: 'membership.activated',
            message: 'Membership activated',
            actor: personFrom(user) || { id: user_id },
            metadata: {
                session_id: session.id,
                subscription_id: session.subscription,
                vessel_id,
                amount_cents: session.amount_total,
                currency: session.currency,
                source: session.metadata?.source || 'app',
                livemode: session.livemode,
            },
        })

    } else if (event.type === 'checkout.session.async_payment_failed') {

        const session = event.data.object
        const vessel_id = session?.metadata?.vessel_id

        if (vessel_id) {
            await Vessel.findByIdAndDelete(vessel_id)
            console.log(`Deleted vessel ${vessel_id} due to async payment failure.`)
        }

        recordActivity({
            action: 'membership.payment_failed',
            outcome: 'failure',
            message: 'Checkout payment failed',
            actor: { id: session?.metadata?.user_id },
            metadata: {
                session_id: session.id,
                vessel_id,
            },
        })

    } else if (event.type === "checkout.session.expired") {

        const session = event.data.object;
        const vessel_id = session?.metadata?.vessel_id;
        const user_id = session?.metadata?.user_id;

        if (vessel_id) {
            await Vessel.findByIdAndDelete(vessel_id);
            console.log(`Deleted vessel ${vessel_id} due to expired checkout session.`);
        }

        if (user_id) {
            const pendingUser = await User.findById(user_id).lean()
            if (pendingUser?.website_signup_pending) {
                const remainingVessels = await Vessel.countDocuments({ user: user_id })
                if (remainingVessels === 0) {
                    await User.findByIdAndDelete(user_id);
                    console.log(`Deleted user ${user_id} due to expired checkout session (website signup pending).`);
                    recordActivity({
                        action: 'user.account_deleted',
                        message: 'Pending website signup removed after checkout expired',
                        actor: personFrom(pendingUser),
                        metadata: { reason: 'checkout_expired', session_id: session.id },
                    })
                }
            }
        }

        recordActivity({
            action: 'membership.checkout_expired',
            outcome: 'failure',
            message: 'Checkout expired before payment',
            actor: { id: user_id },
            metadata: { session_id: session.id, vessel_id },
        })

    }

    if (event.type === 'invoice.paid') {
        const invoice = event.data.object
        if (invoice.status !== 'paid') {
            console.warn('invoice.paid: invoice status is not paid, skipping', invoice.id, invoice.status)
        } else {
            const toEmail = invoice.customer_email || null
            let user = null
            if (invoice.customer) {
                user = await User.findOne({
                    $or: [
                        { stripe_customer_id: invoice.customer },
                        { stripe_customer_id_dev: invoice.customer },
                    ],
                }).lean()
            }
            const email = toEmail || user?.email
            const firstName = user?.first_name || ''
            const membershipName = (invoice.lines?.data?.[0]?.description) || (invoice.lines?.data?.[0]?.plan?.nickname) || 'Membership'
            recordActivity({
                action: 'membership.invoice_paid',
                message: 'Invoice paid',
                actor: personFrom(user) || { email },
                metadata: {
                    invoice_id: invoice.id,
                    amount_cents: invoice.amount_paid,
                    currency: invoice.currency,
                    membership_name: membershipName,
                    livemode: invoice.livemode,
                },
            })

            let receiptOrInvoiceUrl = null
            if (invoice.charge) {
                try {
                    const charge = await stripe.charges.retrieve(invoice.charge)
                    if (charge.receipt_url) {
                        receiptOrInvoiceUrl = charge.receipt_url
                    }
                } catch (err) {
                    console.warn('invoice.paid: could not retrieve charge for receipt_url', err.message)
                }
            }
            if (!receiptOrInvoiceUrl) {
                receiptOrInvoiceUrl = invoice.hosted_invoice_url || null
            }
            if (!receiptOrInvoiceUrl) {
                console.warn('invoice.paid: no receipt_url or hosted_invoice_url, skipping invoice email')
            } else if (email) {
                sendMail(
                    'noreply@flagshiptowing.com',
                    email,
                    `Your Flagship Towing receipt - payment successful`,
                    null,
                    'invoice-success',
                    {
                        name: firstName ? `${firstName} ${user?.last_name || ''}`.trim() : undefined,
                        membership_name: membershipName,
                        invoice_url: receiptOrInvoiceUrl,
                    }
                )
            } else {
                console.warn('invoice.paid: no customer email or user found, skipping invoice email for invoice', invoice.id)
            }
        }
    }

    res.json({ received: true })
}

const createProduct = async (name, description, amount, images = [], interval = 'year') => {
    try {
        const stripe = await getStripe()
        const product = await stripe.products.create({ name, description, images })
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(amount * 100),
            currency: 'usd',
            recurring: { interval },
        })
        return { product, price }
    } catch (error) {
        throw error
    }
}

const displayName = (user) =>
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || undefined

const createCustomer = async (email, name, user = null) => {
    try {
        const stripe = await getStripe({ user })
        const customer = await stripe.customers.create({
            email,
            ...(name ? { name } : {}),
        })
        return customer.id
    } catch (error) {
        throw error
    }
}

const createSubscription = async (id, price_id, vessel_id, membershipSource = 'app', redirectBase = null) => {
    try {

        const user = await User.findById(id)

        if (!user) {
            throw new Error("User not found")
        }

        await assertActiveStripePrice(getStripe, price_id, user)

        const customer_id = await ensureStripeCustomer(user)

        const stripe = await getStripe({ user })
        const existing_subscriptions = await stripe.subscriptions.list({
            customer: customer_id,
            status: "active",
        })

        const already_subscribed = existing_subscriptions.data.some(
            (item) => item.metadata?.vessel_id === vessel_id
        )

        if (already_subscribed) {
            throw new Error("Membership for this vessel is already active")
        }

        const expires_at = Math.floor(Date.now() / 1000) + 35 * 60;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: price_id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            metadata: {
                user_id: user?._id?.toString(),
                user_name: displayName(user) || '',
                vessel_id: vessel_id,
                source: membershipSource,
            },
            customer: customer_id,
            allow_promotion_codes: true,
            success_url: `${redirectBase || getApiBaseUrl()}/redirect/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${redirectBase || getApiBaseUrl()}/redirect/cancel?session_id={CHECKOUT_SESSION_ID}`,
            expires_at
        })

        // Remember the session so /vessel/payment-status can verify payment
        // against Stripe directly (no webhook dependency).
        if (vessel_id) {
            await Vessel.findByIdAndUpdate(vessel_id, {
                $set: { pending_checkout_session_id: session.id },
            })
        }

        return session.url

    } catch (error) {
        throw error
    }
}

const getCurrentSubscriptions = async (id) => {
    try {

        let user = await User.findById(id)
        const { customerId, useDevKeys } = await resolveStripeCustomerForRead(user)

        if (user && customerId) {
            const stripe = await getStripe({ useDevKeys })
            const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active' })
            return subscriptions.data || null
        }

        return null

    } catch (error) {
        throw error
    }
}

const getAllPaymentLogs = async () => {
    try {
        const stripe = await getStripe()
        return (await stripe.subscriptions.list()).data
    } catch (error) {
        throw error
    }
}

const unixToDate = (unix) => {
    if (unix == null || unix === '') return null
    const n = Number(unix)
    if (!Number.isFinite(n)) return null
    return new Date(n < 1e12 ? n * 1000 : n)
}

const centsToUsd = (cents) => {
    if (cents == null || cents === '') return null
    const n = Number(cents)
    if (!Number.isFinite(n)) return null
    return n / 100
}

const amountUsdFromPrice = (price) => {
    if (!price || typeof price === 'string') return null
    if (typeof price.unit_amount === 'number') return centsToUsd(price.unit_amount)
    if (price.unit_amount_decimal != null) return centsToUsd(price.unit_amount_decimal)
    return null
}

const primaryRecurringPrice = (prices) => {
    if (!Array.isArray(prices) || !prices.length) return null
    const recurring = prices.filter(
        (p) => p && p.active !== false && (p.type === 'recurring' || p.recurring)
    )
    const pool = recurring.length ? recurring : prices.filter((p) => p && p.active !== false)
    return pool.find((p) => p.recurring?.interval === 'year') || pool[0] || null
}

const matchPlanRecord = (planName, records, nameOf) => {
    const needle = String(planName || '').trim().toLowerCase()
    if (!needle || !Array.isArray(records) || !records.length) return null
    const exact = records.find((r) => nameOf(r) === needle)
    if (exact) return exact
    if (needle === 'membership') return null
    return records.find((r) => {
        const n = nameOf(r)
        return n && (n.includes(needle) || needle.includes(n))
    }) || null
}

const amountUsdFromCatalog = (planName, products) => {
    const product = matchPlanRecord(planName, products, (p) =>
        String(p.name || '').trim().toLowerCase()
    )
    if (!product) return null
    return amountUsdFromPrice(primaryRecurringPrice(product.prices || []))
}

const amountUsdFromMongoPackages = (planName, packages) => {
    const pkg = matchPlanRecord(planName, packages, (p) =>
        String(p.name || '').trim().toLowerCase()
    )
    const n = Number(pkg?.amount)
    return Number.isFinite(n) && n > 0 ? n : null
}

const preferPositiveAmount = (...candidates) => {
    for (const v of candidates) {
        const n = Number(v)
        if (Number.isFinite(n) && n > 0) return n
    }
    return null
}

const stripePeriodBounds = (sub, item) => ({
    current_period_start: unixToDate(
        item?.current_period_start ?? sub?.current_period_start ?? sub?.start_date
    ),
    current_period_end: unixToDate(item?.current_period_end ?? sub?.current_period_end),
})

const getUserPaymentLogs = async (id) => {
    try {
        let user = await User.findById(id)

        let stripeActive = []
        let stripeInactive = []

        let catalogProducts = []
        try {
            catalogProducts = await getAllProductsWithPrices({}, id)
        } catch (e) {
            console.warn('getUserPaymentLogs catalog', String(e?.message || e))
        }

        let mongoPackages = []
        try {
            mongoPackages = await Package.find({}).lean()
        } catch (e) {
            console.warn('getUserPaymentLogs packages', String(e?.message || e))
        }

        const amountForPlanName = (planName) =>
            preferPositiveAmount(
                amountUsdFromCatalog(planName, catalogProducts),
                amountUsdFromMongoPackages(planName, mongoPackages),
            )

        const { customerId, useDevKeys } = await resolveStripeCustomerForRead(user)

        if (user && customerId) {
            const stripe = await getStripe({ useDevKeys })
            const listed = await stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                expand: ['data.items.data.price'],
                limit: 100,
            })
            const subscriptions = (listed.data || []).filter(
                (sub) => sub.status !== 'incomplete' && sub.status !== 'incomplete_expired',
            )

            const formatted = await Promise.all(
                subscriptions.map(async (sub) => {
                    if (!sub.items?.data?.length) return null

                    const item = sub.items.data[0]
                    let price = item.price

                    if (typeof price === 'string') {
                        try {
                            price = await stripe.prices.retrieve(price)
                        } catch (e) {
                            price = null
                        }
                    } else if (price && amountUsdFromPrice(price) == null && price.id) {
                        try {
                            price = await stripe.prices.retrieve(price.id)
                        } catch (e) {
                            // keep original price object
                        }
                    }

                    let vessel = null

                    if (sub.metadata?.vessel_id) {
                        vessel = await Vessel.findById(sub.metadata.vessel_id).lean()
                    }

                    let product_name = ''
                    const productRef = price?.product
                    if (productRef && typeof productRef === 'object') {
                        product_name = productRef.name || ''
                    } else if (productRef) {
                        try {
                            const product = await stripe.products.retrieve(productRef)
                            product_name = product?.name || ''
                        } catch (e) {
                            product_name = ''
                        }
                    }

                    const source =
                        normalizeMembershipSource(sub.metadata?.source) || 'app'

                    const { current_period_start, current_period_end } =
                        stripePeriodBounds(sub, item)

                    return {
                        id: sub.id,
                        source,
                        vessel,
                        status: sub.status,
                        name: product_name,
                        amount: preferPositiveAmount(
                            amountUsdFromPrice(price),
                            centsToUsd(item?.plan?.amount),
                            centsToUsd(sub?.plan?.amount),
                            amountForPlanName(product_name),
                        ),
                        currency: price?.currency || 'usd',
                        interval: INTERVALS[price?.recurring?.interval] || '',
                        current_period_start,
                        current_period_end,
                        cancel_at_period_end: sub.cancel_at_period_end,
                        created_at: unixToDate(sub.created)
                    }
                })
            )

            const valid = formatted.filter(Boolean)
            stripeActive = valid.filter(
                (sub) => sub.status === 'active' || sub.status === 'trialing',
            )
            stripeInactive = valid.filter(
                (sub) => sub.status !== 'active' && sub.status !== 'trialing',
            )
        }

        /** Sheet-imported / offline term (no Stripe subscription on this vessel) */
        const offlineVessels = await Vessel.find({
            user: id,
            offline_membership_expires_at: { $exists: true, $ne: null },
        }).lean()

        const now = new Date()
        const offlineFormatted = offlineVessels.map((v) => {
            const end = v.offline_membership_expires_at ? new Date(v.offline_membership_expires_at) : null
            const active = end && end >= now
            const start = v.offline_membership_starts_at ? new Date(v.offline_membership_starts_at) : null
            const planName = v.offline_membership_type || 'Membership'
            const periodStart = start || (v.createdAt ? new Date(v.createdAt) : now)
            return {
                id: `offline_${v._id}`,
                source: 'admin',
                vessel: v,
                status: active ? 'active' : 'inactive',
                name: planName,
                amount: amountForPlanName(planName),
                currency: 'usd',
                interval: '',
                current_period_start: periodStart,
                current_period_end: end || now,
                cancel_at_period_end: false,
                created_at: periodStart,
            }
        })

        const offlineActive = offlineFormatted.filter((s) => s.status === 'active')
        const offlineInactive = offlineFormatted.filter((s) => s.status !== 'active')

        // Any vessel already represented by a Stripe or offline/admin membership must
        // not also appear as a synthetic "vesselActive" card (that forced status:active
        // even when the Stripe subscription was canceled/expired).
        const coveredVesselIds = new Set(
            [
                ...stripeActive,
                ...stripeInactive,
                ...offlineActive,
                ...offlineInactive,
            ]
                .map((s) => s.vessel?._id && String(s.vessel._id))
                .filter(Boolean),
        )

        const paidVessels = await Vessel.find({
            user: id,
            active: true,
        }).lean()

        // Last-resort fallback when Stripe list is empty/out of sync but checkout
        // already marked the vessel paid. Do not invent a future expiry from updatedAt.
        const vesselActive = paidVessels
            .filter((v) => !coveredVesselIds.has(String(v._id)))
            .map((v) => {
                const planName = v.offline_membership_type || 'Membership'
                const periodStart = v.createdAt ? new Date(v.createdAt) : now
                return {
                    id: `vessel_${v._id}`,
                    source: 'app',
                    vessel: v,
                    status: 'active',
                    name: planName === 'Membership' ? 'Membership' : planName,
                    amount: amountForPlanName(planName),
                    currency: 'usd',
                    interval: '',
                    current_period_start: periodStart,
                    current_period_end: null,
                    cancel_at_period_end: false,
                    created_at: periodStart,
                }
            })

        return {
            active_subscriptions: [...stripeActive, ...offlineActive, ...vesselActive],
            inactive_subscriptions: [...stripeInactive, ...offlineInactive],
        }
    } catch (error) {
        throw error
    }
}

const getAllProductsWithPrices = async (filters = {}, userId = null) => {
    try {

        const user = userId ? await User.findById(userId).select('dev').lean() : null
        const stripe = await getStripe({ user })
        const products = await stripe.products.list(filters)
        const prices = await stripe.prices.list()

        const sorted_products = products.data.sort((a, b) =>
            b.name.localeCompare(a.name)
        )

        return sorted_products.map(product => ({
            ...product,
            images: Array.isArray(product.images)
                ? product.images.map(rewriteStoredUploadUrl)
                : product.images,
            prices: prices.data.filter(price => price.product === product.id),
        }))

    } catch (error) {
        throw error
    }
}

const getProductWithPrices = async (id, userId = null) => {
    try {

        const user = userId ? await User.findById(userId).select('dev').lean() : null
        const stripe = await getStripe({ user })
        const product = await stripe.products.retrieve(id)
        const prices = await stripe.prices.list({ product: id })
        return {
            ...product,
            images: Array.isArray(product.images)
                ? product.images.map(rewriteStoredUploadUrl)
                : product.images,
            prices: prices.data,
        }

    } catch (error) {
        throw error
    }
}

const updateProduct = async (id, payload) => {
    try {

        const stripe = await getStripe()
        let product = await stripe.products.update(id, payload)

        return product

    } catch (error) {
        throw error
    }
}

/**
 * Stripe Prices are immutable; to "change" price we deactivate the old recurring price(s)
 * for this interval and create a new active price on the same product.
 */
const replaceRecurringPriceForProduct = async (productId, amountUsd, interval = 'year') => {
    const n = Number(amountUsd)
    if (Number.isNaN(n) || n <= 0) {
        throw new Error('Invalid amount')
    }
    const unit_amount = Math.round(n * 100)
    if (unit_amount < 50) {
        throw new Error('Amount must be at least $0.50')
    }

    const stripe = await getStripe()
    const list = await stripe.prices.list({ product: productId, limit: 100 })
    for (const price of list.data) {
        if (
            price.type === 'recurring' &&
            price.active &&
            price.recurring?.interval === interval
        ) {
            await stripe.prices.update(price.id, { active: false })
        }
    }

    await stripe.prices.create({
        product: productId,
        unit_amount,
        currency: 'usd',
        recurring: { interval },
    })
}

const dropSubscription = async (subscriptionId, userId = null) => {
    try {

        const user = userId ? await User.findById(userId).select('dev').lean() : null
        const stripe = await getStripe({ user })
        const subscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
        return subscription

    } catch (error) {
        throw error
    }
}

/**
 * Sets membership_status ('active' | 'expired' | 'none') and active_subscription
 * (active list or null) on a user object. Includes Stripe and offline terms.
 */
const attachMembershipFields = async (user) => {
    if (!user?._id) {
        user.membership_status = 'none'
        user.active_subscription = null
        return user
    }

    const { active_subscriptions, inactive_subscriptions } = await getUserPaymentLogs(user._id)
    const active = active_subscriptions || []
    const inactive = inactive_subscriptions || []

    user.membership_status =
        active.length > 0 ? 'active' : inactive.length > 0 ? 'expired' : 'none'
    user.active_subscription = active.length > 0 ? active : null
    return user
}

const CANCELABLE_SUB_STATUSES = new Set([
    'active',
    'trialing',
    'past_due',
    'unpaid',
    'paused',
    'incomplete',
])

const cancelSubscriptionsForCustomer = async (customerId, useDevKeys, user) => {
    const cancelled = []
    const errors = []
    const stripe = await getStripe({ useDevKeys })

    try {
        await stripe.customers.update(customerId, {
            email: user.email,
            name: displayName(user),
        })
    } catch (e) {
        console.warn('cancelSubscriptionsForCustomer customer update', customerId, e.message)
    }

    const listed = []
    for await (const sub of stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 100,
    })) {
        listed.push(sub)
    }

    for (const sub of listed) {
        if (!sub?.id || !CANCELABLE_SUB_STATUSES.has(sub.status)) {
            continue
        }
        try {
            try {
                await stripe.subscriptions.update(sub.id, {
                    metadata: {
                        ...(sub.metadata || {}),
                        canceled_reason: 'account_deleted',
                    },
                })
            } catch (metaErr) {
                console.warn(
                    'cancelSubscriptionsForCustomer metadata',
                    sub.id,
                    metaErr.message,
                )
            }
            const canceled = await stripe.subscriptions.cancel(sub.id, {
                prorate: false,
                invoice_now: false,
            })
            cancelled.push({
                id: canceled.id,
                status: canceled.status,
                livemode: Boolean(canceled.livemode),
            })
        } catch (e) {
            errors.push(`${sub.id}: ${e.message}`)
            console.warn('cancelSubscriptionsForCustomer', sub.id, e.message)
        }
    }

    return { cancelled, errors }
}

/**
 * Immediately cancel billable Stripe subscriptions on both live and test
 * customer ids. Returns what was cancelled so account-deletion logs can store it.
 * Stripe will email the customer if Dashboard → Customer emails →
 * "Subscription canceled" is enabled.
 */
const cancelAllActiveSubscriptionsForUser = async (userId) => {
    const user = await User.findById(userId)
    if (!user) {
        return { cancelled: [], errors: ['User not found'] }
    }

    const pairs = [
        { customerId: user.stripe_customer_id, useDevKeys: false },
        { customerId: user.stripe_customer_id_dev, useDevKeys: true },
    ]
    const seen = new Set()
    const cancelled = []
    const errors = []

    for (const pair of pairs) {
        if (!pair.customerId || seen.has(pair.customerId)) {
            continue
        }
        seen.add(pair.customerId)
        try {
            const result = await cancelSubscriptionsForCustomer(
                pair.customerId,
                pair.useDevKeys,
                user,
            )
            cancelled.push(...result.cancelled)
            errors.push(...result.errors)
        } catch (e) {
            errors.push(`${pair.customerId}: ${e.message}`)
            console.warn('cancelAllActiveSubscriptionsForUser', pair.customerId, e.message)
        }
    }

    return { cancelled, errors }
}

/**
 * Retrieve checkout session and clean up unpaid vessel when user cancels checkout.
 */
const handleCheckoutSessionCancel = async (sessionId) => {
    if (!sessionId) return { cleaned: false, reason: 'missing_session_id' }

    const stripe = await getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const vessel_id = session?.metadata?.vessel_id

    const isPaid =
        session.payment_status === 'paid' ||
        session.status === 'complete'

    if (isPaid || !vessel_id) {
        return { cleaned: false, session }
    }

    await Vessel.findByIdAndDelete(vessel_id)
    return { cleaned: true, session }
}

/**
 * Verify whether a checkout session completed successfully.
 * Pass `user` to resolve the same dev/live keys the session was created with;
 * falls back across key modes when the session isn't found (mode toggled).
 */
const verifyCheckoutSessionPaid = async (sessionId, { user } = {}) => {
    if (!sessionId) return { paid: false, reason: 'missing_session_id' }

    const attempts = user
        ? [{ user }, { useDevKeys: true }, { useDevKeys: false }]
        : [{}, { useDevKeys: true }]

    let session = null
    let lastErr = null
    for (const opts of attempts) {
        try {
            const stripe = await getStripe(opts)
            session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['line_items.data.price.product'],
            })
            break
        } catch (err) {
            lastErr = err
            // Wrong key mode (or missing dev keys) — try the next candidate.
            const retryable =
                err?.code === 'resource_missing' ||
                err?.statusCode === 404 ||
                /no such checkout\.session/i.test(err?.message || '') ||
                /api key/i.test(err?.message || '')
            if (!retryable) break
        }
    }

    if (!session) {
        throw lastErr || new Error('Checkout session not found')
    }

    const paid =
        session.payment_status === 'paid' ||
        session.status === 'complete'

    return { paid, session }
}

const formatMoney = (amountTotal, currency) => {
    if (amountTotal == null || !Number.isFinite(Number(amountTotal))) return null
    const value = Number(amountTotal) / 100
    const code = (currency || 'usd').toUpperCase()
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: code,
        }).format(value)
    } catch {
        return `${value.toFixed(2)} ${code}`
    }
}

/**
 * Build a safe view-model for checkout success/cancel HTML pages.
 */
const buildCheckoutResultView = async (sessionId, { outcome } = {}) => {
    const empty = {
        verified: false,
        status: outcome === 'cancel' ? 'cancelled' : 'processing',
        session_id: sessionId || null,
        vessel_id: null,
        vessel_label: null,
        customer_email: null,
        amount_formatted: null,
        plan_name: null,
        interval_label: null,
        payment_status: null,
        source: 'app',
        year: new Date().getFullYear(),
    }

    if (!sessionId) return empty

    try {
        const stripe = await getStripe()
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items.data.price.product'],
        })

        const paid =
            session.payment_status === 'paid' || session.status === 'complete'
        const vessel_id = session?.metadata?.vessel_id || null
        const source = (session?.metadata?.source || 'app').toString().toLowerCase()

        let plan_name = null
        let interval_label = null
        const line = session?.line_items?.data?.[0]
        if (line) {
            const product = line.price?.product
            plan_name =
                (typeof product === 'object' && product?.name) ||
                line.description ||
                null
            const interval = line.price?.recurring?.interval
            if (interval) {
                interval_label = INTERVALS[interval] || interval
            }
        }

        let vessel_label = null
        if (vessel_id) {
            try {
                const vessel = await Vessel.findById(vessel_id)
                    .select('registration make boat_model')
                    .lean()
                if (vessel) {
                    const bits = [
                        vessel.registration,
                        [vessel.make, vessel.boat_model].filter(Boolean).join(' '),
                    ].filter(Boolean)
                    vessel_label = bits.join(' · ') || null
                }
            } catch {
                // ignore vessel lookup failures on the public page
            }
        }

        let status = 'processing'
        if (outcome === 'cancel' && !paid) status = 'cancelled'
        else if (paid) status = 'paid'
        else status = 'processing'

        return {
            verified: paid,
            status,
            session_id: sessionId,
            vessel_id,
            vessel_label,
            customer_email:
                session.customer_details?.email ||
                session.customer_email ||
                null,
            amount_formatted: formatMoney(session.amount_total, session.currency),
            plan_name,
            interval_label,
            payment_status: session.payment_status || null,
            source: ['app', 'web', 'admin'].includes(source) ? source : 'app',
            year: new Date().getFullYear(),
        }
    } catch (err) {
        console.error('buildCheckoutResultView:', err.message)
        return empty
    }
}

module.exports = {
    webhook,
    createProduct,
    createCustomer,
    createSubscription,
    getCurrentSubscriptions,
    getAllPaymentLogs,
    getUserPaymentLogs,
    getAllProductsWithPrices,
    getProductWithPrices,
    updateProduct,
    dropSubscription,
    cancelAllActiveSubscriptionsForUser,
    attachMembershipFields,
    replaceRecurringPriceForProduct,
    invalidateStripeSettingsCache,
    handleCheckoutSessionCancel,
    verifyCheckoutSessionPaid,
    buildCheckoutResultView,
    getStripe,
    getStoredStripeCustomerId,
    ensureStripeCustomer,
}
