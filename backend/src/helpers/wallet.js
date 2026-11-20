const { PKPass } = require('passkit-generator');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { getPublicOrigin } = require('../configs/serverUrl');

dotenv.config()

/** Prefer vessel Mongo id for future scanners; fall back to membership/subscription id. */
function qrScanPayload(membershipData) {
    const vessel = membershipData?.vessel
    const vesselId = vessel?._id != null ? String(vessel._id) : ''
    if (vesselId) return vesselId
    return String(membershipData?.id || '')
}

/** Human-readable text under the QR — registration when available. */
function qrAlternateText(membershipData) {
    const reg = membershipData?.vessel?.registration
    if (reg != null && String(reg).trim() !== '') return String(reg).trim()
    return '1-888-BOAT-TOW'
}

function vesselIdValue(membershipData) {
    const id = membershipData?.vessel?._id
    return id != null ? String(id) : '—'
}

/** Match mobile `formatDateToMMDDYYYY` (MM-DD-YYYY). */
function formatMMDDYYYY(value) {
    if (value == null || value === '') return '—'
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${mm}-${dd}-${yyyy}`
}

function showField(x) {
    if (x == null || x === '') return '—'
    return String(x)
}

/** Same logic as mobile MembershipCard: product name or offline type. */
function membershipTypeLabel(m) {
    const v = m?.vessel
    return m?.name || v?.offline_membership_type || '—'
}

/** Expiry: offline vessel date else Stripe current_period_end. */
function expiresOnFormatted(m) {
    const v = m?.vessel
    if ((m?.source === 'offline' || m?.source === 'admin') && v?.offline_membership_expires_at) {
        return formatMMDDYYYY(v.offline_membership_expires_at)
    }
    return formatMMDDYYYY(m?.current_period_end)
}

/**
 * Generate Apple Wallet Pass (.pkpass file) for iOS
 * 
 * This function creates a digitally-signed pass file that can be added to Apple Wallet.
 * The pass appears as a card in the user's wallet with QR code, membership details, and branding.
 * 
 * Requirements:
 * - Apple Developer certificates in /certs/ directory:
 *   • wwdr.pem - Apple WWDR G4 certificate (RSA-based)
 *   • signerCert.pem - Your Pass Type ID certificate (RSA, 2048-bit)
 *   • signerKey.pem - Your private key (RSA PKCS#1 format)
 * - Pass icons in /assets/pass-icons/ directory (all 6 required: icon.png, icon@2x.png, icon@3x.png, logo.png, logo@2x.png, logo@3x.png)
 * - Environment variables:
 *   • APPLE_PASS_TYPE_ID - Your Pass Type ID from Apple Developer Portal
 *   • APPLE_TEAM_ID - Your 10-character Apple Developer Team ID
 *   • APPLE_PASS_KEY_PASSPHRASE - (Optional) Passphrase if private key is encrypted
 * 
 * Customization:
 * - Colors: Change backgroundColor, foregroundColor, labelColor (lines 39-41)
 * - Fields: Modify primaryFields, secondaryFields, auxiliaryFields, backFields (lines 51-106)
 * - QR Code: Change barcodes[0].message to any string you want encoded (line 46)
 * - Location: Update locations array with your coordinates (lines 109-115)
 * - Organization: Change organizationName and description (lines 32-33)
 * 
 * @param {Object} membershipData - Subscription/membership data
 *                                  Required: id, name, current_period_end
 *                                  Optional: vessel (object with name)
 * @param {Object} userData - User data
 *                           Required: first_name, last_name
 *                           Optional: email, phone
 * 
 * @returns {Object} Result object:
 *                  - configured: boolean (true if certificates found and pass generated)
 *                  - passBuffer: Buffer (the .pkpass file as binary data) - only if configured=true
 *                  - passData: Object (the pass model for reference)
 *                  - error: string (error message if generation failed)
 *                  - message: string (user-friendly message)
 * 
 * @see WALLET_SETUP_GUIDE.md for complete setup and customization instructions
 */
const generateAppleWalletPass = async (membershipData, userData) => {
    try {
        // CERTIFICATE PATHS
        // These paths point to the required Apple Developer certificates
        // All certificates must be in PEM format and RSA-based (not ECC)
        const certsPath = path.resolve(__dirname, '../../certs');
        const wwdrPath = path.join(certsPath, 'wwdr.pem');           // Apple WWDR Certificate (download from Apple)
        const signerCertPath = path.join(certsPath, 'signerCert.pem'); // Your Pass Type ID Certificate
        const signerKeyPath = path.join(certsPath, 'signerKey.pem');   // Your Private Key

        // Check if all required certificates exist
        const hasCertificates = fs.existsSync(wwdrPath) &&
            fs.existsSync(signerCertPath) &&
            fs.existsSync(signerKeyPath);

        // PASS MODEL DEFINITION
        // This object defines the structure, content, and appearance of the pass
        // Apple Wallet will render this data according to iOS design guidelines
        const memberName =
            `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || '—'
        const vessel = membershipData.vessel || {}
        const yearValue =
            vessel.year != null && vessel.year !== '' ? String(vessel.year) : '—'
        const statusValue =
            membershipData.status === 'active' || membershipData.status === 'trialing'
                ? 'Active'
                : 'Inactive'

        // storeCard: compact logo (top-left) + one header field (EXPIRES).
        // MEMBER lives on the back so the header does not collide with the logo.
        // With a square QR barcode, secondary + auxiliary share a combined max of 4.
        // Registration is primary — most important for dockside verification.
        const passModel = {
            type: 'storeCard',
            formatVersion: 1,
            description: 'Flagship Towing Membership',
            organizationName: 'Flagship Towing',
            passTypeIdentifier:
                process.env.APPLE_PASS_TYPE_ID || 'pass.com.flagshiptowing.membership',
            teamIdentifier: process.env.APPLE_TEAM_ID,
            serialNumber: membershipData.id,
            backgroundColor: 'rgb(1, 24, 255)',
            foregroundColor: 'rgb(255, 255, 255)',
            labelColor: 'rgb(255, 255, 255)',
            barcodes: [
                {
                    format: 'PKBarcodeFormatQR',
                    // Vessel id when present — ready for a future in-app / dockside scanner
                    message: qrScanPayload(membershipData),
                    altText: qrAlternateText(membershipData),
                    messageEncoding: 'iso-8859-1',
                },
            ],
            storeCard: {
                headerFields: [
                    {
                        key: 'expires',
                        label: 'EXPIRES',
                        value: expiresOnFormatted(membershipData),
                    },
                ],
                primaryFields: [
                    {
                        key: 'registration',
                        label: 'REGISTRATION',
                        value: showField(vessel.registration),
                    },
                ],
                // Combined with secondary: max 4 when QR is present
                secondaryFields: [
                    {
                        key: 'type',
                        label: 'TYPE',
                        value: membershipTypeLabel(membershipData),
                    },
                    {
                        key: 'year',
                        label: 'YEAR',
                        value: yearValue,
                    },
                ],
                auxiliaryFields: [
                    {
                        key: 'make',
                        label: 'MAKE',
                        value: showField(vessel.make),
                    },
                    {
                        key: 'model',
                        label: 'MODEL',
                        value: showField(vessel.boat_model),
                    },
                ],
                backFields: [
                    {
                        key: 'member',
                        label: 'MEMBER',
                        value: memberName,
                    },
                    {
                        key: 'email',
                        label: 'EMAIL',
                        value: showField(userData.email),
                    },
                    {
                        key: 'status',
                        label: 'MEMBERSHIP STATUS',
                        value: statusValue,
                    },
                    {
                        key: 'emergency',
                        label: 'EMERGENCY TOWING',
                        value: '1-888-BOAT-TOW',
                    },
                    {
                        key: 'memberPhone',
                        label: 'PHONE',
                        value: showField(userData.phone),
                    },
                    {
                        key: 'vesselId',
                        label: 'VESSEL ID',
                        value: vesselIdValue(membershipData),
                    },
                    {
                        key: 'membershipId',
                        label: 'MEMBERSHIP ID',
                        value: String(membershipData.id || '—'),
                    },
                    {
                        key: 'terms',
                        label: 'Terms & Conditions',
                        value: 'For full terms and conditions, visit flagshiptowing.com',
                    },
                ],
            },

            locations: [
                {
                    latitude: 37.7749,
                    longitude: -122.4194,
                    relevantText: 'Welcome! Show your membership card for assistance.',
                },
            ],
        };

        // Return error if certificates are not configured
        if (!hasCertificates) {
            return {
                configured: false,
                passData: passModel,
                message: 'Apple Wallet certificates not configured. Required: wwdr.pem, signerCert.pem, signerKey.pem in /certs directory'
            };
        }

        try {
            // Create temporary directory for pass bundle (must end with .pass extension)
            const tmpDir = path.resolve(__dirname, '../../.tmp-passes');
            const modelDir = path.join(tmpDir, `pass-${Date.now()}.pass`);

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }
            fs.mkdirSync(modelDir, { recursive: true });

            // Write pass.json to the bundle
            const passJsonPath = path.join(modelDir, 'pass.json');
            fs.writeFileSync(passJsonPath, JSON.stringify(passModel, null, 2));

            // Copy icon files into the pass bundle (required by Apple)
            const iconsDir = path.resolve(__dirname, '../../assets/pass-icons');
            const iconFiles = [
                'icon.png',
                'icon@2x.png',
                'logo.png',
                'logo@2x.png',
                'logo@3x.png',
                'strip.png',
                'strip@2x.png',
                'strip@3x.png',
            ];

            iconFiles.forEach(iconFile => {
                const sourcePath = path.join(iconsDir, iconFile);
                if (fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, path.join(modelDir, iconFile));
                }
            });

            // Load and validate certificates
            const wwdrContent = fs.readFileSync(wwdrPath);
            const signerCertContent = fs.readFileSync(signerCertPath);
            const signerKeyContent = fs.readFileSync(signerKeyPath);

            if (wwdrContent.length === 0 || signerCertContent.length === 0 || signerKeyContent.length === 0) {
                throw new Error('One or more certificate files are empty');
            }

            // Generate .pkpass file using passkit-generator
            const pass = await PKPass.from({
                model: modelDir,
                certificates: {
                    wwdr: wwdrContent,
                    signerCert: signerCertContent,
                    signerKey: signerKeyContent,
                    ...(process.env.APPLE_PASS_KEY_PASSPHRASE && {
                        signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE
                    })
                }
            });

            // Get pass as buffer
            const passBuffer = pass.getAsBuffer();

            // Clean up temporary directory
            try {
                fs.rmSync(modelDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error('Could not clean up temp directory:', cleanupError.message);
            }

            return {
                configured: true,
                passBuffer: passBuffer,
                passData: passModel
            };

        } catch (passError) {
            console.error('Error generating .pkpass file:', passError?.message);
            return {
                configured: false,
                error: passError?.message,
                passData: passModel,
                message: 'Error generating pass file. Check certificate format (must be RSA) and passphrase.'
            };
        }

    } catch (error) {
        console.error('Error generating Apple Wallet pass:', error);
        throw error;
    }
};

/**
 * Generate Google Wallet Pass URL for Android
 *
 * Uses the Wallet Objects REST API to upsert class + object so existing passes
 * actually update (JWT-only save often leaves an already-saved pass unchanged).
 * Class suffix is versioned so a new card template can ship without fighting
 * a stale class definition in Google Pay Console.
 */
const GOOGLE_PASS_CLASS_SUFFIX = 'flagship_membership_v3'

/** Only return URL if it responds with an image content-type (Google rejects 404 HTML). */
async function resolvePublicImageUrl(url) {
    const trimmed = (url || '').trim()
    if (!trimmed || !/^https:\/\//i.test(trimmed)) return ''
    try {
        const res = await fetch(trimmed, { method: 'HEAD', redirect: 'follow' })
        if (!res.ok) return ''
        const type = (res.headers.get('content-type') || '').toLowerCase()
        if (!type.startsWith('image/')) return ''
        return trimmed
    } catch {
        return ''
    }
}

const generateGoogleWalletPass = async (membershipData, userData) => {
    try {
        const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
        if (!issuerId) {
            return {
                url: null,
                configured: false,
                message: 'GOOGLE_WALLET_ISSUER_ID is not set',
            }
        }

        const sanitizedMembershipId = String(membershipData.id || '').replace(
            /[^a-zA-Z0-9_.-]/g,
            '_',
        )
        const memberName =
            `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || '—'
        const vessel = membershipData.vessel || {}
        const yearValue =
            vessel.year != null && vessel.year !== '' ? String(vessel.year) : '—'
        const statusValue =
            membershipData.status === 'active' || membershipData.status === 'trialing'
                ? 'Active'
                : 'Inactive'

        const scanValue = qrScanPayload(membershipData)
        const scanAlt = qrAlternateText(membershipData)

        // Verify image URLs before attaching — broken URLs make Google reject the pass.
        const [logoUri, heroUri] = await Promise.all([
            resolvePublicImageUrl(process.env.GOOGLE_WALLET_LOGO_URL),
            resolvePublicImageUrl(process.env.GOOGLE_WALLET_HERO_URL),
        ])

        const classId = `${issuerId}.${GOOGLE_PASS_CLASS_SUFFIX}`
        const objectId = `${issuerId}.${sanitizedMembershipId}_v4`

        const moduleField = (id) => ({
            firstValue: {
                fields: [{ fieldPath: `object.textModulesData['${id}']` }],
            },
        })

        const genericClass = {
            id: classId,
            classTemplateInfo: {
                cardTemplateOverride: {
                    cardRowTemplateInfos: [
                        {
                            oneItem: {
                                item: moduleField('registration'),
                            },
                        },
                        {
                            twoItems: {
                                startItem: moduleField('type'),
                                endItem: moduleField('expires'),
                            },
                        },
                        {
                            twoItems: {
                                startItem: moduleField('year'),
                                endItem: moduleField('make'),
                            },
                        },
                        {
                            twoItems: {
                                startItem: moduleField('model'),
                                endItem: moduleField('status'),
                            },
                        },
                    ],
                },
            },
        }

        const buildGenericObject = (includeImages) => {
            const obj = {
                id: objectId,
                classId,
                state: 'ACTIVE',
                cardTitle: {
                    defaultValue: {
                        language: 'en-US',
                        value: 'Flagship Towing Membership',
                    },
                },
                header: {
                    defaultValue: {
                        language: 'en-US',
                        value: showField(vessel.registration),
                    },
                },
                subheader: {
                    defaultValue: {
                        language: 'en-US',
                        value: memberName,
                    },
                },
                barcode: {
                    type: 'QR_CODE',
                    value: scanValue,
                    alternateText: scanAlt,
                },
                textModulesData: [
                    { header: 'REGISTRATION', body: showField(vessel.registration), id: 'registration' },
                    { header: 'TYPE', body: membershipTypeLabel(membershipData), id: 'type' },
                    { header: 'EMAIL', body: showField(userData.email), id: 'email' },
                    { header: 'EXPIRES ON', body: expiresOnFormatted(membershipData), id: 'expires' },
                    { header: 'YEAR', body: yearValue, id: 'year' },
                    { header: 'MAKE', body: showField(vessel.make), id: 'make' },
                    { header: 'MODEL', body: showField(vessel.boat_model), id: 'model' },
                    { header: 'MEMBERSHIP STATUS', body: statusValue, id: 'status' },
                    { header: 'EMERGENCY TOWING', body: '1-888-BOAT-TOW', id: 'emergency' },
                    { header: 'PHONE', body: showField(userData.phone), id: 'phone' },
                    { header: 'VESSEL ID', body: vesselIdValue(membershipData), id: 'vesselId' },
                    { header: 'MEMBERSHIP ID', body: String(membershipData.id || '—'), id: 'membershipId' },
                ],
                hexBackgroundColor: '#0118FF',
            }

            if (includeImages && logoUri) {
                obj.logo = {
                    sourceUri: { uri: logoUri },
                    contentDescription: {
                        defaultValue: {
                            language: 'en-US',
                            value: 'Flagship Towing Logo',
                        },
                    },
                }
            }
            if (includeImages && heroUri) {
                obj.heroImage = {
                    sourceUri: { uri: heroUri },
                    contentDescription: {
                        defaultValue: {
                            language: 'en-US',
                            value: 'Flagship Towing',
                        },
                    },
                }
            }
            return obj
        }

        // Prefer no images unless env URLs were verified reachable.
        let genericObject = buildGenericObject(Boolean(logoUri || heroUri))
        if (!logoUri && process.env.GOOGLE_WALLET_LOGO_URL) {
            console.warn(
                'GOOGLE_WALLET_LOGO_URL is set but not a reachable image — omitting logo',
            )
        }
        if (!heroUri && process.env.GOOGLE_WALLET_HERO_URL) {
            console.warn(
                'GOOGLE_WALLET_HERO_URL is set but not a reachable image — omitting hero',
            )
        }

        const serviceAccountPath = path.resolve(
            __dirname,
            '../../certs/google-wallet-service-account.json',
        )

        if (!fs.existsSync(serviceAccountPath)) {
            return {
                url: null,
                configured: false,
                passData: { genericObject, genericClass },
                message:
                    'Google Wallet service account not configured. Add google-wallet-service-account.json to /certs directory',
            }
        }

        const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

        const { google } = require('googleapis')
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccountKey,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
        })
        const client = await auth.getClient()
        const walletobjects = google.walletobjects({ version: 'v1', auth: client })

        const upsertClass = async () => {
            try {
                await walletobjects.genericclass.get({ resourceId: classId })
                await walletobjects.genericclass.update({
                    resourceId: classId,
                    requestBody: genericClass,
                })
            } catch (err) {
                const code = err?.code || err?.response?.status
                if (code === 404) {
                    await walletobjects.genericclass.insert({ requestBody: genericClass })
                    return
                }
                throw err
            }
        }

        const upsertObject = async (objectBody) => {
            try {
                await walletobjects.genericobject.get({ resourceId: objectId })
                await walletobjects.genericobject.update({
                    resourceId: objectId,
                    requestBody: objectBody,
                })
            } catch (err) {
                const code = err?.code || err?.response?.status
                if (code === 404) {
                    await walletobjects.genericobject.insert({ requestBody: objectBody })
                    return
                }
                throw err
            }
        }

        try {
            await upsertClass()
            try {
                await upsertObject(genericObject)
            } catch (imgErr) {
                const msg = String(imgErr?.message || imgErr || '')
                if (/image/i.test(msg)) {
                    console.warn(
                        'Google Wallet image rejected; saving object without logo/hero:',
                        msg,
                    )
                    genericObject = buildGenericObject(false)
                    await upsertObject(genericObject)
                } else {
                    throw imgErr
                }
            }
        } catch (apiError) {
            console.error(
                'Google Wallet REST upsert failed, falling back to JWT save:',
                apiError?.message || apiError,
            )
            genericObject = buildGenericObject(false)
        }

        const jwt = require('jsonwebtoken')
        // Always sign JWT from the final object (images already stripped on failure)
        const claims = {
            iss: serviceAccountKey.client_email,
            aud: 'google',
            origins: [],
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            payload: {
                genericClasses: [genericClass],
                genericObjects: [genericObject],
            },
        }

        const token = jwt.sign(claims, serviceAccountKey.private_key, {
            algorithm: 'RS256',
        })

        return {
            url: `https://pay.google.com/gp/v/save/${token}`,
            token,
            configured: true,
            classId,
            objectId,
        }
    } catch (error) {
        console.error('Error generating Google Wallet pass:', error)
        throw error
    }
}

module.exports = {
    generateAppleWalletPass,
    generateGoogleWalletPass,
}

