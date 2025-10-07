# PostgreSQL Database Setup for Voice App

## Database Schema

### Core Tables
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - stores user information from Auth0
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT users_auth0_id_unique UNIQUE (auth0_id),
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Subscription plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- 'free', 'basic', 'premium', 'enterprise'
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    voice_clone_limit INTEGER DEFAULT 1,
    tts_characters_per_month INTEGER DEFAULT 10000,
    api_calls_per_month INTEGER DEFAULT 1000,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'unpaid'
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active subscription per user
    CONSTRAINT unique_active_subscription UNIQUE (user_id, status) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Voice clones table
CREATE TABLE voice_clones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elevenlabs_voice_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'personal', -- 'personal', 'business', 'character'
    audio_file_url TEXT,
    audio_file_size BIGINT,
    audio_duration_seconds INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT voice_clones_elevenlabs_id_unique UNIQUE (elevenlabs_voice_id)
);

-- TTS generation history
CREATE TABLE tts_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voice_id UUID NOT NULL REFERENCES voice_clones(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    text_length INTEGER NOT NULL,
    audio_file_url TEXT,
    audio_file_size BIGINT,
    audio_duration_seconds INTEGER,
    generation_time_ms INTEGER,
    cost_usd DECIMAL(10,4),
    status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'voice_clone', 'tts_generation', 'api_call'
    usage_count INTEGER DEFAULT 0,
    usage_value BIGINT DEFAULT 0, -- characters for TTS, bytes for uploads
    usage_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per service per day
    CONSTRAINT unique_daily_usage UNIQUE (user_id, service_type, usage_date)
);

-- API rate limits table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one rate limit record per user per endpoint per window
    CONSTRAINT unique_rate_limit UNIQUE (user_id, endpoint, window_start)
);

-- Stripe webhook events table
CREATE TABLE stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- User sessions table (for Redis backup)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration table
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes for Performance
```sql
-- Create indexes for performance
CREATE INDEX idx_users_auth0_id ON users(auth0_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX idx_voice_clones_user_id ON voice_clones(user_id);
CREATE INDEX idx_voice_clones_elevenlabs_id ON voice_clones(elevenlabs_voice_id);
CREATE INDEX idx_voice_clones_is_active ON voice_clones(is_active);
CREATE INDEX idx_voice_clones_created_at ON voice_clones(created_at);

CREATE INDEX idx_tts_generations_user_id ON tts_generations(user_id);
CREATE INDEX idx_tts_generations_voice_id ON tts_generations(voice_id);
CREATE INDEX idx_tts_generations_created_at ON tts_generations(created_at);
CREATE INDEX idx_tts_generations_status ON tts_generations(status);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_service_type ON usage_tracking(service_type);
CREATE INDEX idx_usage_tracking_usage_date ON usage_tracking(usage_date);
CREATE INDEX idx_usage_tracking_user_service_date ON usage_tracking(user_id, service_type, usage_date);

CREATE INDEX idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);

CREATE INDEX idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_system_config_config_key ON system_config(config_key);
CREATE INDEX idx_system_config_is_active ON system_config(is_active);
```

## Triggers for Updated At
```sql
-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_clones_updated_at BEFORE UPDATE ON voice_clones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Initial Data
```sql
-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, voice_clone_limit, tts_characters_per_month, api_calls_per_month, features) VALUES
('free', 'Free Plan', 'Perfect for trying out voice cloning', 0, 0, 1, 10000, 100, '{"voice_cloning": true, "basic_tts": true, "email_support": false}'),
('basic', 'Basic Plan', 'Great for personal use', 9.99, 99.99, 5, 100000, 10000, '{"voice_cloning": true, "advanced_tts": true, "email_support": true, "priority_processing": false}'),
('premium', 'Premium Plan', 'Perfect for content creators', 29.99, 299.99, 20, 500000, 50000, '{"voice_cloning": true, "advanced_tts": true, "email_support": true, "priority_processing": true, "custom_voices": true}'),
('enterprise', 'Enterprise Plan', 'For businesses and teams', 99.99, 999.99, 100, 2000000, 200000, '{"voice_cloning": true, "advanced_tts": true, "phone_support": true, "priority_processing": true, "custom_voices": true, "api_access": true, "team_management": true}');

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('rate_limits', '{"voice_clone_per_hour": 5, "tts_per_hour": 100, "api_calls_per_hour": 1000}', 'Rate limiting configuration'),
('elevenlabs', '{"api_timeout": 30000, "max_file_size": 10485760, "supported_formats": ["mp3", "wav", "m4a"]}', 'ElevenLabs API configuration'),
('stripe', '{"webhook_tolerance": 300, "retry_failed_webhooks": true}', 'Stripe configuration'),
('app', '{"maintenance_mode": false, "max_voice_duration": 300, "max_text_length": 5000}', 'Application configuration');
```

## Kubernetes PostgreSQL Deployment
```yaml
# k8s/postgresql.yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: voice-app-db
  namespace: voice-app-production
spec:
  instances: 3
  
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
      maintenance_work_mem: "64MB"
      checkpoint_completion_target: "0.9"
      wal_buffers: "16MB"
      default_statistics_target: "100"
      random_page_cost: "1.1"
      effective_io_concurrency: "200"
      work_mem: "4MB"
      min_wal_size: "1GB"
      max_wal_size: "4GB"
      max_worker_processes: "8"
      max_parallel_workers_per_gather: "4"
      max_parallel_workers: "8"
      max_parallel_maintenance_workers: "4"

  bootstrap:
    initdb:
      database: voiceapp
      owner: voiceapp
      secret:
        name: postgres-credentials

  storage:
    size: 100Gi
    storageClass: gp3

  monitoring:
    enabled: true

  backup:
    retentionPolicy: "30d"
    barmanObjectStore:
      destinationPath: "s3://voice-app-backups/postgres"
      s3Credentials:
        accessKeyId:
          name: backup-credentials
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: backup-credentials
          key: SECRET_ACCESS_KEY
      wal:
        retention: "7d"
      data:
        retention: "30d"
```

## Database Connection Service
```typescript
// services/database.ts
import { Pool, PoolConfig, PoolClient } from 'pg';

export class Database {
  private pool: Pool;

  constructor() {
    const config: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'voiceapp',
      user: process.env.DB_USER || 'voiceapp',
      password: process.env.DB_PASSWORD || '',
      max: parseInt(process.env.DB_POOL_SIZE || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      statement_timeout: 30000,
      query_timeout: 30000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${duration}ms - ${text}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Database query error: ${text}`, error);
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}
```

## Database Migration Service
```typescript
// services/migration.ts
import { Database } from './database';
import fs from 'fs';
import path from 'path';

export class MigrationService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  async runMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Get list of migration files
      const migrationDir = path.join(process.cwd(), 'migrations');
      const files = fs.readdirSync(migrationDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      // Check which migrations have been executed
      const executedMigrations = await this.db.query(
        'SELECT filename FROM migrations ORDER BY id'
      );
      const executedFilenames = executedMigrations.rows.map(row => row.filename);

      // Run pending migrations
      for (const file of files) {
        if (!executedFilenames.includes(file)) {
          console.log(`Running migration: ${file}`);
          
          const migrationSQL = fs.readFileSync(
            path.join(migrationDir, file),
            'utf8'
          );
          
          await this.db.query(migrationSQL);
          
          // Record migration as executed
          await this.db.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            [file]
          );
          
          console.log(`Migration completed: ${file}`);
        }
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}
```

## Setup Scripts
```bash
#!/bin/bash
# setup-database.sh

set -e

echo "Setting up PostgreSQL database for Voice App..."

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "psql is not installed. Please install PostgreSQL client first."
    exit 1
fi

# Set database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-voiceapp}
DB_USER=${DB_USER:-voiceapp}
DB_PASSWORD=${DB_PASSWORD:-password}

# Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME;" || true

# Run schema creation
echo "Creating database schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schema.sql

# Run initial data insertion
echo "Inserting initial data..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/initial-data.sql

echo "Database setup complete!"
```

## Environment Variables
```bash
# .env.local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voiceapp
DB_USER=voiceapp
DB_PASSWORD=your-secure-password
DB_POOL_SIZE=20
DB_TIMEOUT=30000
```

## Setup Instructions

1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:
   ```bash
   sudo -u postgres createdb voiceapp
   sudo -u postgres createuser voiceapp
   sudo -u postgres psql -c "ALTER USER voiceapp PASSWORD 'your-password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE voiceapp TO voiceapp;"
   ```

3. **Run Setup Script**:
   ```bash
   chmod +x setup-database.sh
   ./setup-database.sh
   ```

4. **Verify Setup**:
   ```bash
   psql -h localhost -U voiceapp -d voiceapp -c "SELECT COUNT(*) FROM users;"
   ```

This PostgreSQL setup provides:
- **High Availability**: 3-node cluster with automatic failover
- **Performance**: Optimized indexes and connection pooling
- **Security**: Proper user permissions and SSL support
- **Backup**: Automated backups to S3
- **Monitoring**: Built-in monitoring and health checks
- **Scalability**: Connection pooling and query optimization

