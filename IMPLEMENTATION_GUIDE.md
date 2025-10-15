# Voice Cloning App - AWS Scalability Implementation

This Next.js application has been transformed into a scalable, cloud-native SaaS platform with Auth0 authentication, Stripe subscriptions, and AWS infrastructure.

## 🚀 Features

### Authentication & User Management
- **Auth0 Integration**: Secure OAuth 2.0 authentication with social login support
- **Session Management**: Redis-backed sessions with automatic expiration
- **User Profiles**: DynamoDB-stored user data with subscription tracking

### Subscription Tiers
- **Free Tier**: 10 recordings/month, preset audio configurations only
- **Basic Tier** ($9.99/month): 100 recordings/month, priority generation
- **Premium Tier** ($29.99/month): Unlimited recordings, full audio controls, custom presets

### Audio Features
- **Voice Cloning**: Upload audio samples to create custom voices
- **Text-to-Speech**: Generate speech with ElevenLabs API
- **Audio Controls**: Tier-based access to advanced audio manipulation
- **Recording Storage**: S3-backed persistent storage for favorited recordings

### Infrastructure
- **AWS DynamoDB**: User data, sessions, recordings, and subscriptions
- **AWS S3**: Audio file storage with lifecycle policies
- **AWS ElastiCache**: Redis session storage for horizontal scaling
- **AWS Amplify**: Auto-scaling deployment with CDN

## 🛠️ Setup Instructions

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# ElevenLabs API
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Auth0 Configuration
AUTH0_SECRET=your_auth0_secret_here
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your_auth0_client_id_here
AUTH0_CLIENT_SECRET=your_auth0_client_secret_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_BASIC_PRICE_ID=price_your_basic_price_id_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here

# DynamoDB Tables
DYNAMODB_USERS_TABLE=voice-app-users
DYNAMODB_SESSIONS_TABLE=voice-app-sessions
DYNAMODB_RECORDINGS_TABLE=voice-app-recordings
DYNAMODB_SUBSCRIPTIONS_TABLE=voice-app-subscriptions

# ElastiCache Redis
REDIS_HOST=your_redis_host_here
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# S3 Configuration
S3_BUCKET_NAME=voice-app-audio-dev
S3_REGION=us-east-1

# Application Configuration
SESSION_DURATION=900000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_your_basic_price_id_here
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here
```

### 2. AWS Infrastructure Setup

#### DynamoDB Tables
Create the following tables with the specified schemas:

**Users Table** (`voice-app-users`)
- Partition Key: `userId` (String)
- Global Secondary Index: `stripeCustomerId-index`
- Global Secondary Index: `email-index`

**Sessions Table** (`voice-app-sessions`)
- Partition Key: `sessionId` (String)
- TTL: `expiresAt` (Number)

**Recordings Table** (`voice-app-recordings`)
- Partition Key: `userId` (String)
- Sort Key: `recordingId` (String)
- Global Secondary Index: `userId-createdAt-index`
- Local Secondary Index: `userId-isFavorite-index`

**Subscriptions Table** (`voice-app-subscriptions`)
- Partition Key: `userId` (String)
- Sort Key: `subscriptionId` (String)
- Global Secondary Index: `stripeSubscriptionId-index`

#### S3 Bucket
Create bucket with:
- Server-side encryption (SSE-S3)
- Block public access enabled
- Lifecycle policy: Transition to Glacier after 7 days, delete after 30 days
- CORS configuration for browser access

#### ElastiCache Redis
Create Redis cluster with:
- Engine: Redis 7.x
- Instance type: cache.t3.micro (dev) or cache.r6g.large (prod)
- Automatic failover enabled
- VPC security group allowing access from application

### 3. Auth0 Setup
1. Create Auth0 application (Regular Web Application)
2. Configure callback URLs: `http://localhost:3000/api/auth/callback`
3. Configure logout URLs: `http://localhost:3000`
4. Enable refresh tokens
5. Add user metadata fields: `stripeCustomerId`, `subscriptionTier`

### 4. Stripe Setup
1. Create products and prices for Basic ($9.99/month) and Premium ($29.99/month) tiers
2. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Enable webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### 5. Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 📁 Project Structure

```
app/
├── api/                    # API routes
│   ├── auth/              # Auth0 authentication
│   ├── recordings/        # Recording CRUD operations
│   ├── stripe/            # Stripe subscription management
│   ├── user/              # User profile and usage
│   ├── tts/               # Text-to-speech generation
│   ├── voices/            # Voice management
│   └── ivc/               # Voice cloning
├── components/            # React components
│   ├── AuthGuard.tsx      # Authentication wrapper
│   ├── Navigation.tsx     # App navigation
│   ├── RecordingActions.tsx # Save/favorite/delete actions
│   ├── SubscriptionPlans.tsx # Pricing page
│   ├── UpgradePrompt.tsx  # Upgrade CTAs
│   └── FeatureLockedOverlay.tsx # Premium feature locks
├── hooks/                 # Custom React hooks
│   ├── useAuthentication.ts # Auth state management
│   ├── useRecordingPersistence.ts # Recording operations
│   ├── useSession.ts      # User profile and usage
│   └── useSubscription.ts # Stripe operations
├── lib/                   # Utility libraries
│   ├── auth0.ts          # Auth0 client
│   ├── dynamodb.ts      # DynamoDB operations
│   ├── redis.ts         # Redis session management
│   ├── s3.ts            # S3 file operations
│   ├── stripe.ts        # Stripe client
│   └── feature-flags.ts # Subscription feature access
├── types/                # TypeScript definitions
│   ├── database.ts      # Database entity types
│   └── subscription.ts  # Subscription tier definitions
└── page.tsx             # Main application component
```

## 🔧 Key Features Implementation

### Authentication Flow
1. User clicks "Sign In" → redirects to Auth0
2. Auth0 handles authentication → redirects to callback
3. Backend creates/updates user in DynamoDB
4. Session stored in Redis with 15-minute TTL
5. HTTP-only cookie set for session persistence

### Subscription Management
1. User selects plan → Stripe Checkout session created
2. Payment completed → webhook updates user tier
3. Features unlocked based on subscription tier
4. Usage tracking prevents exceeding limits

### Recording Persistence
1. TTS generation → audio blob created
2. User saves recording → uploaded to S3
3. Metadata stored in DynamoDB
4. Signed URLs generated for playback
5. Favorites marked for permanent storage

### Feature Access Control
- **Free/Basic**: Preset audio configurations only
- **Premium**: Full access to all audio sliders and custom presets
- **Usage Limits**: Monthly recording limits enforced per tier
- **Upgrade Prompts**: CTAs shown when limits reached

## 🚀 Deployment

### AWS Amplify
1. Connect repository to AWS Amplify
2. Configure build settings using `amplify.yml`
3. Set environment variables in Amplify console
4. Deploy with automatic scaling

### Environment Variables for Production
Update `NEXT_PUBLIC_APP_URL` and Auth0 URLs for production domain.

## 📊 Monitoring

- **CloudWatch**: DynamoDB metrics, API logs
- **Stripe Dashboard**: Subscription metrics, payment analytics
- **Auth0 Dashboard**: Authentication events, user analytics
- **S3 Metrics**: Storage usage, lifecycle transitions

## 🔒 Security

- **Session Security**: HTTP-only cookies, Redis TTL
- **API Protection**: Middleware validates all protected routes
- **Data Encryption**: S3 server-side encryption, DynamoDB encryption at rest
- **Webhook Security**: Stripe signature validation
- **CORS**: Configured for secure cross-origin requests

## 🎯 Next Steps

1. **AWS Infrastructure**: Set up DynamoDB tables, S3 bucket, ElastiCache
2. **Auth0 Configuration**: Create application and configure settings
3. **Stripe Setup**: Create products and configure webhooks
4. **Environment Variables**: Configure all required environment variables
5. **Testing**: Test authentication, subscriptions, and recording persistence
6. **Deployment**: Deploy to AWS Amplify with production settings

The application is now ready for scalable deployment with full subscription management, user authentication, and cloud infrastructure!


