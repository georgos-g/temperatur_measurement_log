# OAuth Authentication Setup Guide

This guide walks you through setting up and testing the new OAuth authentication features in your Temperature Logger application.

## Prerequisites

1. **Node.js and npm/yarn installed**
2. **Google Cloud Console account** (for Google OAuth)
3. **Apple Developer account** (for Apple Sign In - paid membership required)

## Step 1: Environment Configuration

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Generate NextAuth secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using OpenSSL
openssl rand -base64 32
```

3. Add the secret to your `.env.local`:

```bash
NEXTAUTH_SECRET=your_generated_secret_here
```

## Step 2: Google OAuth Setup

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google+ API
   - Google OAuth2 API

### 2.2 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Select "Web application"
4. Configure:
   - **Name**: Temperature Logger
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

### 2.3 Get Credentials

1. Copy the **Client ID** and **Client Secret**
2. Add to your `.env.local`:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Step 3: Apple Sign In Setup

### 3.1 Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Go to "Certificates, Identifiers & Profiles"
3. Click "Identifiers" → "+" to create new identifier
4. Select "App ID"
5. Configure:
   - **Description**: Temperature Logger
   - **Bundle ID**: com.yourdomain.temperaturelogger
   - **Capabilities**: Enable "Sign In with Apple"

### 3.2 Create Service ID

1. Go to "Identifiers" → "+" → "Service ID"
2. Configure:
   - **Description**: Temperature Logger Web
   - **Identifier**: com.yourdomain.temperaturelogger.web
3. Configure "Sign In with Apple":
   - Enable "Sign In with Apple"
   - Add your domain to "Domains and Subdomains"
   - Add redirect URIs:
     - `http://localhost:3000/api/auth/callback/apple` (development)
     - `https://yourdomain.com/api/auth/callback/apple` (production)

### 3.3 Generate Private Key

1. Go to "Keys" → "+" to create new key
2. Select "Sign In with Apple"
3. Configure key name and access
4. Download the `.p8` key file (save it securely)
5. Note the **Key ID** (shown in the portal)

### 3.4 Generate Client Secret

Apple requires a JWT token as client secret. Use this script:

```javascript
// generate-apple-secret.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('path/to/your/private/key.p8');
const keyId = 'YOUR_KEY_ID';
const teamId = 'YOUR_TEAM_ID';
const clientId = 'com.yourdomain.temperaturelogger.web';

const token = jwt.sign(
  {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6 months
    aud: 'https://appleid.apple.com',
    sub: clientId,
  },
  privateKey,
  {
    algorithm: 'ES256',
    headerid: keyId,
  }
);

console.log('Apple Client Secret:', token);
```

Run the script and add the output to your `.env.local`:

```bash
APPLE_CLIENT_ID=com.yourdomain.temperaturelogger.web
APPLE_CLIENT_SECRET=your_generated_jwt_token_here
```

## Step 4: Database Migration

Run the OAuth migration to update your database schema:

```bash
# Check if migration is needed
curl http://localhost:3000/api/migrate-oauth

# Run migration
curl -X POST http://localhost:3000/api/migrate-oauth
```

Or use the API directly in your browser:

1. Navigate to `http://localhost:3000/api/migrate-oauth`
2. If migration is needed, run a POST request using curl or Postman

## Step 5: Testing

### 5.1 Start Development Server

```bash
yarn dev
```

### 5.2 Test Authentication Methods

#### Traditional Email/Name:

1. Go to `http://localhost:3000`
2. Enter name and email
3. Click "Anmelden" or "Konto erstellen"
4. Verify successful login and redirect to temperature form

#### Google OAuth:

1. Go to `http://localhost:3000`
2. Click "Mit Google anmelden"
3. Sign in with your Google account
4. Grant permissions if prompted
5. Verify successful login and redirect to temperature form

#### Apple Sign In:

1. Go to `http://localhost:3000`
2. Click "Mit Apple anmelden"
3. Sign in with your Apple ID
4. Complete the authentication flow
5. Verify successful login and redirect to temperature form

### 5.3 Verify Database

Check your database to ensure users are created with correct provider information:

```sql
SELECT id, name, email, provider, provider_id, created_at
FROM users
ORDER BY created_at DESC;
```

## Step 6: Production Deployment

### 6.1 Update Environment Variables

For production, update your environment variables:

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=production_google_client_id
GOOGLE_CLIENT_SECRET=production_google_client_secret
APPLE_CLIENT_ID=com.yourdomain.temperaturelogger.web
APPLE_CLIENT_SECRET=production_apple_client_secret
```

### 6.2 Update OAuth Callbacks

Update your OAuth provider configurations with production URLs:

- Google: `https://yourdomain.com/api/auth/callback/google`
- Apple: `https://yourdomain.com/api/auth/callback/apple`

### 6.3 Security Considerations

1. **HTTPS Required**: OAuth providers require HTTPS in production
2. **Domain Verification**: Ensure your domain is verified with OAuth providers
3. **Secret Management**: Use secure secret management in production
4. **Rate Limiting**: Consider implementing rate limiting for auth endpoints

## Troubleshooting

### Common Issues

#### Google OAuth Issues

- **Redirect URI mismatch**: Ensure exact match in Google Console
- **CORS issues**: Verify authorized JavaScript origins
- **Invalid client**: Check Client ID and Secret

#### Apple Sign In Issues

- **Invalid client secret**: Regenerate JWT token
- **Domain verification**: Verify domain ownership in Apple Portal
- **Private key issues**: Ensure correct key format and permissions

#### Database Issues

- **Migration failures**: Check database permissions
- **Column not found**: Run OAuth migration script
- **Connection issues**: Verify database URL and credentials

### Debug Mode

Enable NextAuth debug mode by adding to `.env.local`:

```bash
NEXTAUTH_DEBUG=true
```

This will provide detailed logging for authentication flows.

## Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Session Management**: Use secure, HTTP-only cookies
4. **Input Validation**: Validate all user inputs
5. **Error Handling**: Don't expose sensitive information in error messages

## Support

For issues with:

- **Google OAuth**: [Google Cloud Support](https://cloud.google.com/support)
- **Apple Sign In**: [Apple Developer Support](https://developer.apple.com/support/)
- **NextAuth**: [NextAuth Documentation](https://next-auth.js.org/)
- **This Application**: Check application logs and GitHub issues
