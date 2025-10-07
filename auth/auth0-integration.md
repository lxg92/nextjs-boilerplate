# Auth0 Integration for Voice App

## Auth0 Configuration

### Environment Variables
```bash
# .env.local
AUTH0_SECRET='your-secret-key-here'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='https://api.voiceapp.com'
```

### Auth0 Application Settings
```json
{
  "name": "Voice App",
  "description": "Voice cloning application",
  "callbacks": [
    "http://localhost:3000/api/auth/callback",
    "https://yourdomain.com/api/auth/callback"
  ],
  "logout_urls": [
    "http://localhost:3000",
    "https://yourdomain.com"
  ],
  "web_origins": [
    "http://localhost:3000",
    "https://yourdomain.com"
  ],
  "allowed_origins": [
    "http://localhost:3000",
    "https://yourdomain.com"
  ],
  "grant_types": [
    "authorization_code",
    "refresh_token"
  ],
  "token_endpoint_auth_method": "client_secret_post",
  "refresh_token": {
    "expiration_type": "expiring",
    "leeway": 0,
    "token_lifetime": 2592000,
    "infinite_token_lifetime": false,
    "idle_token_lifetime": 1296000,
    "rotation_type": "rotating"
  }
}
```

## Next.js Auth0 Integration

### Auth0 SDK Configuration
```typescript
// lib/auth0.ts
import { initAuth0 } from '@auth0/nextjs-auth0';

export default initAuth0({
  secret: process.env.AUTH0_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  audience: process.env.AUTH0_AUDIENCE,
  scope: 'openid profile email',
  session: {
    rollingDuration: 60 * 60 * 24, // 24 hours
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
    postLogoutRedirect: '/'
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email'
  }
});
```

### Auth0 API Routes
```typescript
// app/api/auth/[...auth0]/route.ts
import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      prompt: 'login'
    }
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL
  }),
  callback: handleCallback({
    afterCallback: async (req, session) => {
      // Create or update user in database
      await createOrUpdateUser(session.user);
      return session;
    }
  })
});
```

### User Management Service
```typescript
// services/user-service.ts
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { Database } from './database';

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

### Authentication Middleware
```typescript
// middleware/auth.ts
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { UserService } from '../services/user-service';

export const requireAuth = (handler: (req: NextApiRequest, res: NextApiResponse, user: any) => Promise<void>) => {
  return withApiAuthRequired(async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getSession(req, res);
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userService = new UserService();
      const user = await userService.getUserByAuth0Id(session.user.sub);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Add user to request object
      (req as any).user = user;
      
      return handler(req, res, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  });
};
```

### User API Routes
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

    return NextResponse.json(user);
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

### Client-Side Auth Hook
```typescript
// hooks/useAuth.ts
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
}

export const useAuth = () => {
  const { user: auth0User, error, isLoading } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth0User) {
        try {
          const response = await fetch('/api/users/profile');
          if (response.ok) {
            const profile = await response.json();
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [auth0User]);

  return {
    user: userProfile,
    auth0User,
    isLoading: isLoading || loading,
    error
  };
};
```

### Auth Provider Component
```typescript
// components/AuthProvider.tsx
'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};
```

### Login/Logout Components
```typescript
// components/LoginButton.tsx
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export const LoginButton = () => {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {user.name}
        </span>
        <Link
          href="/api/auth/logout"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/api/auth/login"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Login
    </Link>
  );
};
```

### Protected Route Component
```typescript
// components/ProtectedRoute.tsx
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';
import { LoginButton } from './LoginButton';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Authentication Required
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please log in to access this page.
        </p>
        <LoginButton />
      </div>
    );
  }

  return <>{children}</>;
};
```

### Updated App Layout
```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Setup Instructions

1. **Install Auth0 SDK**:
   ```bash
   npm install @auth0/nextjs-auth0
   ```

2. **Configure Auth0**:
   - Create Auth0 account and application
   - Set up callback URLs and logout URLs
   - Configure application settings

3. **Environment Variables**:
   - Add Auth0 credentials to `.env.local`
   - Update production environment variables

4. **Database Setup**:
   - Ensure users table exists in PostgreSQL
   - Run database migrations

5. **Test Authentication**:
   - Start development server
   - Test login/logout flow
   - Verify user creation in database

This Auth0 integration provides:
- **Secure Authentication**: OAuth2/OIDC flow
- **User Management**: Automatic user creation and updates
- **Session Management**: Secure session handling
- **API Protection**: Protected API routes
- **Client Integration**: React hooks and components
- **Production Ready**: Scalable and secure authentication

