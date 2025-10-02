# VoiceClone AI - Secure Voice Cloning Platform

A secure, subscription-based voice cloning application built with Next.js, Auth0, and Stripe. This application allows users to create voice clones and generate speech with usage limits based on their subscription tier.

## Features

- 🔐 **Secure Authentication** - Auth0 integration for user management
- 💳 **Subscription Management** - Stripe-powered billing with 3 tiers (Free/Basic/Premium)
- 🎤 **Voice Cloning** - Create instant voice clones from audio samples
- 🔊 **Text-to-Speech** - Generate high-quality audio with SSML support
- 📊 **Usage Tracking** - Monitor character usage, recordings, and voice limits
- 🛡️ **Route Protection** - Middleware-based authentication and authorization
- 💾 **Data Persistence** - User data and usage tracking (in-memory for demo)

## Architecture

### Authentication & Authorization
- **Auth0** for user authentication and session management
- **Middleware** protection for API routes and dashboard
- **User-based** data isolation and access control

### Subscription Tiers

| Feature | Free | Basic ($9.99/mo) | Premium ($29.99/mo) |
|---------|------|------------------|---------------------|
| Voice Clones | 1 | 5 | 20 |
| Characters/Month | 10,000 | 100,000 | 1,000,000 |
| Recordings/Month | 50 | 500 | 5,000 |
| SSML Support | Basic | Advanced | Advanced |
| Priority Support | ❌ | ❌ | ✅ |

### Security Features
- Route-level authentication middleware
- Usage limit enforcement per subscription tier
- Secure API endpoints with user validation
- Stripe webhook verification for subscription events

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Auth0 Configuration
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR_DOMAIN.auth0.com'
AUTH0_CLIENT_ID='your_client_id'
AUTH0_CLIENT_SECRET='your_client_secret'

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY='pk_test_...'
STRIPE_SECRET_KEY='sk_test_...'
STRIPE_WEBHOOK_SECRET='whsec_...'
STRIPE_BASIC_PRICE_ID='price_basic_monthly'
STRIPE_PREMIUM_PRICE_ID='price_premium_monthly'

# ElevenLabs API Key
ELEVENLABS_API_KEY='your_elevenlabs_api_key'

# Next.js
NEXTAUTH_URL='http://localhost:3000'
```

### 2. Auth0 Setup

1. Create an Auth0 account and application
2. Configure the following settings:
   - **Application Type**: Regular Web Application
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

### 3. Stripe Setup

1. Create a Stripe account and get your API keys
2. Create products and prices for Basic and Premium plans
3. Set up webhook endpoint: `http://localhost:3000/api/webhooks/stripe`
4. Configure webhook events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4. ElevenLabs Setup

1. Create an ElevenLabs account
2. Get your API key from the dashboard
3. Ensure you have sufficient credits for voice cloning

### 5. Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...auth0]/     # Auth0 authentication routes
│   │   ├── ivc/                 # Voice cloning API
│   │   ├── tts/                 # Text-to-speech API
│   │   ├── voices/              # Voice management API
│   │   ├── subscriptions/       # Stripe subscription API
│   │   └── webhooks/stripe/     # Stripe webhook handler
│   ├── dashboard/               # Protected dashboard page
│   ├── pricing/                 # Pricing page
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Landing page
├── lib/
│   ├── auth.ts                 # Authentication utilities
│   ├── database.ts             # In-memory database (demo)
│   ├── stripe.ts               # Stripe configuration
│   ├── subscription-tiers.ts   # Subscription tier definitions
│   └── types.ts                # TypeScript type definitions
├── middleware.ts               # Route protection middleware
└── providers.tsx              # React Query & Auth0 providers
```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Auth0 login
- `GET /api/auth/logout` - Auth0 logout
- `GET /api/auth/callback` - Auth0 callback

### Voice Management
- `POST /api/ivc` - Create voice clone (requires auth)
- `GET /api/voices` - List user voices (requires auth)
- `DELETE /api/voices/delete` - Delete voice (requires auth)

### Text-to-Speech
- `POST /api/tts` - Generate speech (requires auth, usage limits)

### Subscriptions
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout
- `POST /api/subscriptions/create-portal-session` - Create customer portal

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Security Considerations

### Production Deployment

1. **Database**: Replace in-memory database with PostgreSQL/MongoDB
2. **Environment Variables**: Use secure secret management
3. **HTTPS**: Ensure all communication is encrypted
4. **Rate Limiting**: Implement API rate limiting
5. **Monitoring**: Add logging and error tracking
6. **Backup**: Implement data backup strategies

### Security Features Implemented

- ✅ User authentication with Auth0
- ✅ Route protection middleware
- ✅ Usage limit enforcement
- ✅ User data isolation
- ✅ Secure API endpoints
- ✅ Stripe webhook verification
- ✅ Input validation and sanitization

## Usage Limits Enforcement

The application enforces usage limits at multiple levels:

1. **Frontend**: UI shows current usage and limits
2. **API**: Server-side validation before processing
3. **Database**: Usage tracking and limit checking
4. **Middleware**: Route protection and authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@voiceclone.ai or create an issue in the repository.
