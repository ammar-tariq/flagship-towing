/**
 * Shared request-hardening helpers (field allowlists, Stripe price checks).
 */

const pickFields = (source, allowedKeys) => {
    const out = {}
    if (!source || typeof source !== 'object') return out
    for (const key of allowedKeys) {
        if (source[key] !== undefined) {
            out[key] = source[key]
        }
    }
    return out
}

const USER_SELF_UPDATE_FIELDS = ['first_name', 'last_name', 'phone', 'picture']

const FAMILY_USER_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'relation']

const VESSEL_MEMBER_FIELDS = [
    'first_name',
    'last_name',
    'mailing_address',
    'primary_phone',
    'secondary_phone',
    'email',
    'make',
    'boat_model',
    'year',
    'registration',
    'hin_number',
    'length',
    'hull_color',
    'primary_boating_location',
    'engine_make',
    'horse_power',
    'no_of_engines',
    'advName',
    'captainName',
    'owner_agreement',
    'marina_agreement',
    'images',
]

const FEEDBACK_CREATE_FIELDS = ['name', 'email', 'subject', 'message']

const SERVICE_FIELDS = ['title', 'description', 'short_description', 'image']

const INCIDENT_FIELDS = ['user', 'service', 'date', 'service_id']

const PROMO_FIELDS = ['name', 'discount', 'expiry_date', 'active']

const MESSAGE_CREATE_FIELDS = ['conversation', 'message']

/**
 * Ensure a Stripe price id is an active recurring price on an active product.
 * Prevents checkout against arbitrary/orphaned prices on the Stripe account.
 */
const assertActiveStripePrice = async (getStripe, priceId, user = null) => {
    if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
        throw new Error('Invalid membership plan selected')
    }

    const stripe = await getStripe({ user })
    let price
    try {
        price = await stripe.prices.retrieve(priceId)
    } catch {
        throw new Error('Selected membership plan is not available')
    }

    if (!price?.active) {
        throw new Error('Selected membership plan is not available')
    }

    if (!price.recurring) {
        throw new Error('Selected membership plan is not available')
    }

    const productId = typeof price.product === 'string' ? price.product : price.product?.id
    if (productId) {
        const product = await stripe.products.retrieve(productId)
        if (!product?.active) {
            throw new Error('Selected membership plan is not available')
        }
    }

    return price
}

module.exports = {
    pickFields,
    USER_SELF_UPDATE_FIELDS,
    FAMILY_USER_FIELDS,
    VESSEL_MEMBER_FIELDS,
    FEEDBACK_CREATE_FIELDS,
    SERVICE_FIELDS,
    INCIDENT_FIELDS,
    PROMO_FIELDS,
    MESSAGE_CREATE_FIELDS,
    assertActiveStripePrice,
}
