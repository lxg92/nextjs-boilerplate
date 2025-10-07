# Prisma ORM Setup for Voice App

## Prisma Configuration

### Package.json Dependencies
```json
{
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "prisma": "^5.7.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5"
  }
}
```

### Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  auth0Id       String   @unique @map("auth0_id")
  email         String   @unique
  name          String?
  avatarUrl     String?  @map("avatar_url")
  emailVerified Boolean  @default(false) @map("email_verified")
  lastLogin     DateTime? @map("last_login")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  subscriptions    Subscription[]
  voiceClones      VoiceClone[]
  ttsGenerations   TtsGeneration[]
  usageTracking    UsageTracking[]
  rateLimits       RateLimit[]
  userSessions     UserSession[]
  auditLogs        AuditLog[]

  @@map("users")
}

model SubscriptionPlan {
  id                    String   @id @default(uuid())
  name                  String   @unique
  displayName           String   @map("display_name")
  description           String?
  priceMonthly          Decimal  @default(0) @map("price_monthly") @db.Decimal(10, 2)
  priceYearly           Decimal  @default(0) @map("price_yearly") @db.Decimal(10, 2)
  stripePriceIdMonthly  String?  @map("stripe_price_id_monthly")
  stripePriceIdYearly   String?  @map("stripe_price_id_yearly")
  voiceCloneLimit       Int      @default(1) @map("voice_clone_limit")
  ttsCharactersPerMonth Int      @default(10000) @map("tts_characters_per_month")
  apiCallsPerMonth      Int      @default(1000) @map("api_calls_per_month")
  features              Json     @default("{}")
  isActive              Boolean  @default(true) @map("is_active")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  // Relations
  subscriptions Subscription[]

  @@map("subscription_plans")
}

model Subscription {
  id                    String    @id @default(uuid())
  userId                String    @map("user_id")
  planId                String    @map("plan_id")
  stripeSubscriptionId  String?   @unique @map("stripe_subscription_id")
  stripeCustomerId      String?   @map("stripe_customer_id")
  status                String    @default("active")
  billingCycle          String    @default("monthly") @map("billing_cycle")
  currentPeriodStart    DateTime? @map("current_period_start")
  currentPeriodEnd      DateTime? @map("current_period_end")
  cancelAtPeriodEnd     Boolean   @default(false) @map("cancel_at_period_end")
  canceledAt            DateTime? @map("canceled_at")
  trialEnd              DateTime? @map("trial_end")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  // Relations
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan          SubscriptionPlan @relation(fields: [planId], references: [id])
  usageTracking UsageTracking[]

  @@unique([userId, status])
  @@map("subscriptions")
}

model VoiceClone {
  id                    String    @id @default(uuid())
  userId                String    @map("user_id")
  elevenlabsVoiceId     String    @unique @map("elevenlabs_voice_id")
  name                  String
  description           String?
  category              String    @default("personal")
  audioFileUrl          String?   @map("audio_file_url")
  audioFileSize         BigInt?   @map("audio_file_size")
  audioDurationSeconds  Int?      @map("audio_duration_seconds")
  isPublic              Boolean   @default(false) @map("is_public")
  isActive              Boolean   @default(true) @map("is_active")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  // Relations
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  ttsGenerations TtsGeneration[]

  @@map("voice_clones")
}

model TtsGeneration {
  id                    String    @id @default(uuid())
  userId                String    @map("user_id")
  voiceId               String    @map("voice_id")
  textContent           String    @map("text_content")
  textLength            Int       @map("text_length")
  audioFileUrl          String?   @map("audio_file_url")
  audioFileSize         BigInt?   @map("audio_file_size")
  audioDurationSeconds  Int?      @map("audio_duration_seconds")
  generationTimeMs      Int?      @map("generation_time_ms")
  costUsd               Decimal?  @map("cost_usd") @db.Decimal(10, 4)
  status                String    @default("completed")
  errorMessage          String?   @map("error_message")
  createdAt             DateTime  @default(now()) @map("created_at")

  // Relations
  user    User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  voice   VoiceClone @relation(fields: [voiceId], references: [id], onDelete: Cascade)

  @@map("tts_generations")
}

model UsageTracking {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  subscriptionId String   @map("subscription_id")
  serviceType    String   @map("service_type")
  usageCount     Int      @default(0) @map("usage_count")
  usageValue     BigInt   @default(0) @map("usage_value")
  usageDate      DateTime @default(now()) @map("usage_date")
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@unique([userId, serviceType, usageDate])
  @@map("usage_tracking")
}

model RateLimit {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  endpoint     String
  requestCount Int      @default(0) @map("request_count")
  windowStart  DateTime @default(now()) @map("window_start")
  windowEnd    DateTime @default(now()) @map("window_end")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, endpoint, windowStart])
  @@map("rate_limits")
}

model StripeWebhookEvent {
  id               String    @id @default(uuid())
  stripeEventId    String    @unique @map("stripe_event_id")
  eventType        String    @map("event_type")
  processed        Boolean   @default(false)
  processingError  String?   @map("processing_error")
  eventData        Json      @map("event_data")
  createdAt        DateTime  @default(now()) @map("created_at")
  processedAt      DateTime? @map("processed_at")

  @@map("stripe_webhook_events")
}

model UserSession {
  id           String    @id @default(uuid())
  userId       String    @map("user_id")
  sessionToken String    @unique @map("session_token")
  expiresAt    DateTime  @map("expires_at")
  ipAddress    String?   @map("ip_address")
  userAgent    String?   @map("user_agent")
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at")
  lastAccessed DateTime  @default(now()) @map("last_accessed")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}

model AuditLog {
  id           String    @id @default(uuid())
  userId       String?   @map("user_id")
  action       String
  resourceType String    @map("resource_type")
  resourceId   String?   @map("resource_id")
  oldValues    Json?     @map("old_values")
  newValues    Json?     @map("new_values")
  ipAddress    String?   @map("ip_address")
  userAgent    String?   @map("user_agent")
  createdAt    DateTime  @default(now()) @map("created_at")

  // Relations
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("audit_logs")
}

model SystemConfig {
  id          String   @id @default(uuid())
  configKey   String   @unique @map("config_key")
  configValue Json     @map("config_value")
  description String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("system_config")
}
```

## Prisma Client Setup

### Database Connection
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### Prisma Service Base Class
```typescript
// services/base-service.ts
import { prisma } from '../lib/prisma';
import { PrismaClient } from '@prisma/client';

export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
```

## Updated User Service with Prisma

```typescript
// services/user-service.ts
import { BaseService } from './base-service';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { 
  User, 
  Subscription, 
  UsageStats, 
  Prisma 
} from '@prisma/client';

export interface UserWithSubscription extends User {
  subscriptions: (Subscription & {
    plan: {
      name: string;
      displayName: string;
      voiceCloneLimit: number;
      ttsCharactersPerMonth: number;
      apiCallsPerMonth: number;
    };
  })[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  subscription?: {
    id: string;
    planType: string;
    status: string;
    currentPeriodEnd: Date;
    usageLimit: number;
    currentUsage: number;
  };
  usageStats?: UsageStats;
}

export interface UsageStats {
  voiceClones: number;
  ttsGenerations: number;
  apiCalls: number;
  charactersUsed: number;
}

export class UserService extends BaseService {
  async createOrUpdateUser(auth0User: UserProfile): Promise<User> {
    const userData = {
      auth0Id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name,
      avatarUrl: auth0User.picture,
      emailVerified: auth0User.email_verified || false,
      lastLogin: new Date(),
    };

    try {
      const user = await this.prisma.user.upsert({
        where: { auth0Id: auth0User.sub },
        update: {
          email: userData.email,
          name: userData.name,
          avatarUrl: userData.avatarUrl,
          emailVerified: userData.emailVerified,
          lastLogin: userData.lastLogin,
        },
        create: {
          ...userData,
          subscriptions: {
            create: {
              plan: {
                connect: { name: 'free' }
              },
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            }
          }
        },
        include: {
          subscriptions: {
            include: {
              plan: true
            }
          }
        }
      });

      return user;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { auth0Id }
      });
    } catch (error) {
      console.error('Error fetching user by Auth0 ID:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { status: 'active' },
            include: {
              plan: true
            }
          },
          voiceClones: {
            where: { isActive: true }
          },
          ttsGenerations: true,
          usageTracking: {
            where: { serviceType: 'tts_generation' }
          }
        }
      });

      if (!user) {
        return null;
      }

      const activeSubscription = user.subscriptions[0];
      const usageStats = await this.getUserUsageStats(userId);
      const currentUsage = await this.getCurrentUsage(userId);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        subscription: activeSubscription ? {
          id: activeSubscription.id,
          planType: activeSubscription.plan.name,
          status: activeSubscription.status,
          currentPeriodEnd: activeSubscription.currentPeriodEnd!,
          usageLimit: activeSubscription.plan.voiceCloneLimit,
          currentUsage: currentUsage.voiceClones
        } : undefined,
        usageStats
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(id: string, updates: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUserUsageStats(userId: string): Promise<UsageStats> {
    try {
      const [
        voiceClones,
        ttsGenerations,
        usageTracking
      ] = await Promise.all([
        this.prisma.voiceClone.count({
          where: { userId, isActive: true }
        }),
        this.prisma.ttsGeneration.count({
          where: { userId }
        }),
        this.prisma.usageTracking.aggregate({
          where: { userId },
          _sum: {
            usageCount: true,
            usageValue: true
          }
        })
      ]);

      return {
        voiceClones,
        ttsGenerations,
        apiCalls: usageTracking._sum.usageCount || 0,
        charactersUsed: Number(usageTracking._sum.usageValue) || 0
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  }

  async getCurrentUsage(userId: string): Promise<{ voiceClones: number }> {
    try {
      const voiceClones = await this.prisma.voiceClone.count({
        where: { userId, isActive: true }
      });

      return { voiceClones };
    } catch (error) {
      console.error('Error fetching current usage:', error);
      throw error;
    }
  }

  async createAuditLog(data: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          oldValues: data.oldValues,
          newValues: data.newValues,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error for audit logs to avoid breaking main operations
    }
  }
}
```

## Prisma Migration Setup

### Migration Scripts
```typescript
// scripts/migrate.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database migration...');

  // Create default subscription plans
  const plans = [
    {
      name: 'free',
      displayName: 'Free Plan',
      description: 'Perfect for trying out voice cloning',
      priceMonthly: 0,
      priceYearly: 0,
      voiceCloneLimit: 1,
      ttsCharactersPerMonth: 10000,
      apiCallsPerMonth: 100,
      features: {
        voice_cloning: true,
        basic_tts: true,
        email_support: false
      }
    },
    {
      name: 'basic',
      displayName: 'Basic Plan',
      description: 'Great for personal use',
      priceMonthly: 9.99,
      priceYearly: 99.99,
      voiceCloneLimit: 5,
      ttsCharactersPerMonth: 100000,
      apiCallsPerMonth: 10000,
      features: {
        voice_cloning: true,
        advanced_tts: true,
        email_support: true,
        priority_processing: false
      }
    },
    {
      name: 'premium',
      displayName: 'Premium Plan',
      description: 'Perfect for content creators',
      priceMonthly: 29.99,
      priceYearly: 299.99,
      voiceCloneLimit: 20,
      ttsCharactersPerMonth: 500000,
      apiCallsPerMonth: 50000,
      features: {
        voice_cloning: true,
        advanced_tts: true,
        email_support: true,
        priority_processing: true,
        custom_voices: true
      }
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      description: 'For businesses and teams',
      priceMonthly: 99.99,
      priceYearly: 999.99,
      voiceCloneLimit: 100,
      ttsCharactersPerMonth: 2000000,
      apiCallsPerMonth: 200000,
      features: {
        voice_cloning: true,
        advanced_tts: true,
        phone_support: true,
        priority_processing: true,
        custom_voices: true,
        api_access: true,
        team_management: true
      }
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    });
  }

  // Create default system configuration
  const configs = [
    {
      configKey: 'rate_limits',
      configValue: {
        voice_clone_per_hour: 5,
        tts_per_hour: 100,
        api_calls_per_hour: 1000
      },
      description: 'Rate limiting configuration'
    },
    {
      configKey: 'elevenlabs',
      configValue: {
        api_timeout: 30000,
        max_file_size: 10485760,
        supported_formats: ['mp3', 'wav', 'm4a']
      },
      description: 'ElevenLabs API configuration'
    },
    {
      configKey: 'stripe',
      configValue: {
        webhook_tolerance: 300,
        retry_failed_webhooks: true
      },
      description: 'Stripe configuration'
    },
    {
      configKey: 'app',
      configValue: {
        maintenance_mode: false,
        max_voice_duration: 300,
        max_text_length: 5000
      },
      description: 'Application configuration'
    }
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { configKey: config.configKey },
      update: config,
      create: config
    });
  }

  console.log('Database migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Package.json Scripts
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx scripts/migrate.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

## Environment Variables
```bash
# .env.local
DATABASE_URL="postgresql://voiceapp:password@localhost:5432/voiceapp?schema=public"
```

## Setup Instructions

1. **Install Prisma**:
   ```bash
   npm install prisma @prisma/client
   npm install -D tsx
   ```

2. **Initialize Prisma**:
   ```bash
   npx prisma init
   ```

3. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

4. **Push Schema to Database**:
   ```bash
   npm run db:push
   ```

5. **Seed Database**:
   ```bash
   npm run db:seed
   ```

6. **Open Prisma Studio** (optional):
   ```bash
   npm run db:studio
   ```

## Benefits of Using Prisma

✅ **Type Safety**: Full TypeScript support with generated types  
✅ **Query Builder**: Intuitive and type-safe database queries  
✅ **Migrations**: Automatic database schema management  
✅ **Connection Pooling**: Built-in connection management  
✅ **Performance**: Optimized queries and caching  
✅ **Developer Experience**: Excellent tooling and debugging  
✅ **Schema Validation**: Automatic validation and constraints  
✅ **Multi-database Support**: Easy to switch between databases  

This Prisma setup provides a much more robust and developer-friendly database layer compared to raw SQL queries, with better type safety, automatic migrations, and excellent developer tooling.

