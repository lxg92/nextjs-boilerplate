# Basic User Management System for Voice App

## User Service Implementation

### Core User Service
```typescript
// services/user-service.ts
import { Database } from './database';
import { UserProfile } from '@auth0/nextjs-auth0/client';

export interface User {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
  subscription?: Subscription;
  usage_stats?: UsageStats;
}

export interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  current_period_end: Date;
  usage_limit: number;
  current_usage: number;
}

export interface UsageStats {
  voice_clones: number;
  tts_generations: number;
  api_calls: number;
  characters_used: number;
}

export class UserService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  async createOrUpdateUser(auth0User: UserProfile): Promise<User> {
    const userData = {
      auth0_id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name,
      avatar_url: auth0User.picture,
      email_verified: auth0User.email_verified || false,
      last_login: new Date()
    };

    // Check if user exists
    const existingUser = await this.db.query(
      'SELECT * FROM users WHERE auth0_id = $1',
      [auth0User.sub]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      const updatedUser = await this.db.query(
        `UPDATE users 
         SET email = $1, name = $2, avatar_url = $3, email_verified = $4, 
             last_login = $5, updated_at = NOW()
         WHERE auth0_id = $6
         RETURNING *`,
        [
          userData.email,
          userData.name,
          userData.avatar_url,
          userData.email_verified,
          userData.last_login,
          auth0User.sub
        ]
      );
      return this.mapDbUserToUser(updatedUser.rows[0]);
    } else {
      // Create new user
      const newUser = await this.db.query(
        `INSERT INTO users (auth0_id, email, name, avatar_url, email_verified, last_login)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userData.auth0_id,
          userData.email,
          userData.name,
          userData.avatar_url,
          userData.email_verified,
          userData.last_login
        ]
      );
      
      // Create default free subscription
      await this.createDefaultSubscription(newUser.rows[0].id);
      
      return this.mapDbUserToUser(newUser.rows[0]);
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? this.mapDbUserToUser(result.rows[0]) : null;
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE auth0_id = $1',
      [auth0Id]
    );
    return result.rows.length > 0 ? this.mapDbUserToUser(result.rows[0]) : null;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const result = await this.db.query(
      `SELECT u.*, s.plan_type, s.status, s.current_period_end,
              sp.voice_clone_limit, sp.tts_characters_per_month, sp.api_calls_per_month
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    
    // Get usage stats
    const usageStats = await this.getUserUsageStats(userId);
    
    // Get current usage
    const currentUsage = await this.getCurrentUsage(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      email_verified: user.email_verified,
      subscription: user.plan_type ? {
        id: user.id,
        plan_type: user.plan_type,
        status: user.status,
        current_period_end: user.current_period_end,
        usage_limit: user.voice_clone_limit || 0,
        current_usage: currentUsage.voice_clones
      } : undefined,
      usage_stats: usageStats
    };
  }

  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const allowedFields = ['name', 'avatar_url'];
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...updateFields.map(field => updates[field as keyof User])];

    const result = await this.db.query(
      `UPDATE users 
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return this.mapDbUserToUser(result.rows[0]);
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async getUserUsageStats(userId: string): Promise<UsageStats> {
    const result = await this.db.query(
      `SELECT 
         COUNT(DISTINCT vc.id) as voice_clones,
         COUNT(DISTINCT tts.id) as tts_generations,
         SUM(ut.usage_count) as api_calls,
         SUM(ut.usage_value) as characters_used
       FROM users u
       LEFT JOIN voice_clones vc ON u.id = vc.user_id AND vc.is_active = true
       LEFT JOIN tts_generations tts ON u.id = tts.user_id
       LEFT JOIN usage_tracking ut ON u.id = ut.user_id AND ut.service_type = 'tts_generation'
       WHERE u.id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    return {
      voice_clones: parseInt(stats.voice_clones) || 0,
      tts_generations: parseInt(stats.tts_generations) || 0,
      api_calls: parseInt(stats.api_calls) || 0,
      characters_used: parseInt(stats.characters_used) || 0
    };
  }

  async getCurrentUsage(userId: string): Promise<{ voice_clones: number }> {
    const result = await this.db.query(
      'SELECT COUNT(*) as voice_clones FROM voice_clones WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    return {
      voice_clones: parseInt(result.rows[0].voice_clones) || 0
    };
  }

  private async createDefaultSubscription(userId: string): Promise<void> {
    // Get free plan
    const freePlan = await this.db.query(
      'SELECT id FROM subscription_plans WHERE name = $1',
      ['free']
    );

    if (freePlan.rows.length > 0) {
      await this.db.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
         VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '1 year')`,
        [userId, freePlan.rows[0].id]
      );
    }
  }

  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      auth0_id: dbUser.auth0_id,
      email: dbUser.email,
      name: dbUser.name,
      avatar_url: dbUser.avatar_url,
      email_verified: dbUser.email_verified,
      last_login: dbUser.last_login,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };
  }
}
```

## User API Routes

### User Profile API
```typescript
// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { UserService } from '../../../services/user-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userService = new UserService();
    const user = await userService.getUserByAuth0Id(session.user.sub);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userProfile = await userService.getUserProfile(user.id);
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userService = new UserService();
    const user = await userService.getUserByAuth0Id(session.user.sub);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates = await request.json();
    const updatedUser = await userService.updateUserProfile(user.id, updates);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### User Management API
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { UserService } from '../../services/user-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userService = new UserService();
    const user = await userService.getUserByAuth0Id(session.user.sub);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userService = new UserService();
    const user = await userService.getUserByAuth0Id(session.user.sub);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await userService.deleteUser(user.id);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Client-Side User Management

### User Context
```typescript
// contexts/UserContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
  subscription?: {
    id: string;
    plan_type: string;
    status: string;
    current_period_end: Date;
    usage_limit: number;
    current_usage: number;
  };
  usage_stats?: {
    voice_clones: number;
    tts_generations: number;
    api_calls: number;
    characters_used: number;
  };
}

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: auth0User, isLoading: auth0Loading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (!auth0User) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (err) {
      setError('Failed to fetch user profile');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setUserProfile(updatedProfile);
      } else {
        throw new Error('Failed to update user profile');
      }
    } catch (err) {
      setError('Failed to update user profile');
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (!auth0Loading) {
      fetchUserProfile();
    }
  }, [auth0User, auth0Loading]);

  const value: UserContextType = {
    userProfile,
    loading,
    error,
    refreshUser,
    updateUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider');
  }
  return context;
};
```

### User Profile Component
```typescript
// components/UserProfile.tsx
'use client';

import React, { useState } from 'react';
import { useUserProfile } from '../contexts/UserContext';

export const UserProfile: React.FC = () => {
  const { userProfile, loading, error, updateUser } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
  });

  React.useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        avatar_url: userProfile.avatar_url || '',
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No user profile found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Profile
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Changes
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {userProfile.avatar_url && (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {userProfile.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{userProfile.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {userProfile.email_verified ? 'Email verified' : 'Email not verified'}
              </p>
            </div>
          </div>

          {userProfile.subscription && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Subscription
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Plan: {userProfile.subscription.plan_type}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status: {userProfile.subscription.status}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Voice Clones: {userProfile.subscription.current_usage} / {userProfile.subscription.usage_limit}
              </p>
            </div>
          )}

          {userProfile.usage_stats && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Usage Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Voice Clones</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {userProfile.usage_stats.voice_clones}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">TTS Generations</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {userProfile.usage_stats.tts_generations}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">API Calls</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {userProfile.usage_stats.api_calls}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Characters Used</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {userProfile.usage_stats.characters_used.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Updated App Layout with User Context
```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import { UserProvider } from "./contexts/UserContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice App",
  description: "Voice cloning application with Auth0 authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install @auth0/nextjs-auth0 pg
   npm install -D @types/pg
   ```

2. **Environment Variables**:
   ```bash
   # .env.local
   AUTH0_SECRET='your-secret-key-here'
   AUTH0_BASE_URL='http://localhost:3000'
   AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
   AUTH0_CLIENT_ID='your-client-id'
   AUTH0_CLIENT_SECRET='your-client-secret'
   AUTH0_AUDIENCE='https://api.voiceapp.com'
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=voiceapp
   DB_USER=voiceapp
   DB_PASSWORD=your-secure-password
   ```

3. **Database Setup**:
   - Run PostgreSQL setup script
   - Ensure all tables are created
   - Verify initial data is inserted

4. **Auth0 Configuration**:
   - Set up Auth0 application
   - Configure callback URLs
   - Set up API audience

5. **Test User Management**:
   - Start development server
   - Test login/logout flow
   - Verify user profile creation
   - Test profile updates

This user management system provides:
- **Complete User Lifecycle**: Creation, updates, deletion
- **Profile Management**: User information and preferences
- **Usage Tracking**: Monitor user activity and limits
- **Subscription Integration**: Track user plans and limits
- **Real-time Updates**: Context-based state management
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript support

