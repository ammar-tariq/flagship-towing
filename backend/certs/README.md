# Certificates Directory

This directory should contain your Apple Wallet and Google Wallet certificates.

⚠️ **IMPORTANT**: Never commit these files to version control!

## Required Files

### Apple Wallet
- `wwdr.pem` - Apple Worldwide Developer Relations Certificate
- `signerCert.pem` - Your Pass Type ID Certificate
- `signerKey.pem` - Your Pass Type ID Private Key

### Google Wallet
- `google-wallet-service-account.json` - Google Cloud service account JSON key

## Setup Instructions

See the main `WALLET_SETUP.md` file in the root of the backend folder for detailed instructions on how to generate and obtain these certificates.

## Security

This directory is listed in `.gitignore` to prevent accidental commits. Keep these files secure and never share them publicly.

