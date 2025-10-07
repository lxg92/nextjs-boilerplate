# Updated Auth0 Integration with Prisma

## Prisma-Enhanced Auth0 Configuration

### Environment Variables
```bash
# .env.local
AUTH0_SECRET='your-secret-key-here'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='https://api.voiceapp.com'

# Database
DATABASE_URL="postgresql://voiceapp:password@localhost:5432/voiceapp?schema=public"
```

### Prisma-Enhanced Auth0 SDK Configuration
```typescript
// lib/auth0.ts
import { initAuth0 } from '@auth0/nextjs-auth0';
import { UserService } from '../services/user-service';

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
  },
  afterCallback: async (req, session) => {
    if (session?.user) {
      try {
        const userService = new UserService();
        await userService.createOrUpdateUser(session.user);
        
        // Log successful authentication
        await userService.createAuditLog({
          userId: session.user.sub,
          action: 'USER_LOGIN',
          resourceType: 'AUTHENTICATION',
          ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.error('Error creating/updating user after Auth0 callback:', error);
        // Don't throw error to avoid breaking the auth flow
      }
    }
    return session;
  }
});
```

### Enhanced Auth0 API Routes
```typescript
// app/api/auth/[...auth0]/route.ts
import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';
import { UserService } from '../../../services/user-service';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      prompt: 'login'
    }
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL,
    afterCallback: async (req) => {
      // Log logout event
      try {
        const userService = new UserService();
        await userService.createAuditLog({
          action: 'USER_LOGOUT',
          resourceType: 'AUTHENTICATION',
          ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        console.error('Error logging logout event:', error);
      }
    }
  }),
  callback: handleCallback({
    afterCallback: async (req, session) => {
      if (session?.user) {
        try {
          const userService = new UserService();
          const user = await userService.createOrUpdateUser(session.user);
          
          // Create audit log for successful authentication
          await userService.createAuditLog({
            userId: user.id,
            action: 'USER_LOGIN',
            resourceType: 'AUTHENTICATION',
            ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          });
        } catch (error) {
          console.error('Error creating/updating user after Auth0 callback:', error);
          // Don't throw error to avoid breaking the auth flow
        }
      }
      return session;
    }
  })
});
```

### Enhanced Authentication Middleware
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

export const requireAuthWithAudit = (
  handler: (req: NextApiRequest, res: NextApiResponse, user: any) => Promise<void>,
  action: string,
  resourceType: string
) => {
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
      
      // Create audit log
      await userService.createAuditLog({
        userId: user.id,
        action,
        resourceType,
        ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });
      
      return handler(req, res, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  });
};
```

### Enhanced User API Routes with Prisma
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
    
    // Log profile access
    await userService.createAuditLog({
      userId: user.id,
      action: 'VIEW_USER_PROFILE',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent')
    });

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
    
    // Validate allowed fields
    const allowedFields = ['name', 'avatarUrl'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Get old values for audit log
    const oldValues = {
      name: user.name,
      avatarUrl: user.avatarUrl
    };

    const updatedUser = await userService.updateUserProfile(user.id, filteredUpdates);

    // Log profile update with old and new values
    await userService.createAuditLog({
      userId: user.id,
      action: 'UPDATE_USER_PROFILE',
      resourceType: 'USER',
      resourceId: user.id,
      oldValues,
      newValues: filteredUpdates,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent')
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Enhanced User Management API
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

    // Log user data access
    await userService.createAuditLog({
      userId: user.id,
      action: 'VIEW_USER_DATA',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent')
    });

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

    // Log account deletion
    await userService.createAuditLog({
      userId: user.id,
      action: 'DELETE_USER_ACCOUNT',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent')
    });

    await userService.deleteUser(user.id);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Enhanced Client-Side Auth Hook
```typescript
// hooks/useAuth.ts
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import { User } from '@prisma/client';

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
  usageStats?: {
    voiceClones: number;
    ttsGenerations: number;
    apiCalls: number;
    charactersUsed: number;
  };
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
          } else {
            console.error('Failed to fetch user profile');
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [auth0User]);

  const refreshUser = async () => {
    if (auth0User) {
      try {
        const response = await fetch('/api/users/profile');
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    }
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
        return updatedProfile;
      } else {
        throw new Error('Failed to update user profile');
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  return {
    user: userProfile,
    auth0User,
    isLoading: isLoading || loading,
    error,
    refreshUser,
    updateUser
  };
};
```

### Enhanced Login/Logout Components
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

### Enhanced Protected Route Component
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
        {fallback}
      </div>
    );
  }

  return <>{children}</>;
};
```

### Updated App Layout with Enhanced Auth
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
  description: "Voice cloning application with Auth0 authentication and Prisma ORM",
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
   npm install @auth0/nextjs-auth0 prisma @prisma/client
   npm install -D tsx
   ```

2. **Configure Auth0**:
   - Create Auth0 account and application
   - Set up callback URLs and logout URLs
   - Configure application settings

3. **Environment Variables**:
   - Add Auth0 credentials to `.env.local`
   - Add database URL for Prisma

4. **Database Setup**:
   - Run Prisma migrations
   - Seed database with initial data

5. **Test Authentication**:
   - Start development server
   - Test login/logout flow
   - Verify user creation in database
   - Check audit logs

## Benefits of Prisma + Auth0 Integration

✅ **Enhanced Security**: Comprehensive audit logging  
✅ **Better Performance**: Optimized database queries  
✅ **Type Safety**: Full TypeScript support  
✅ **User Tracking**: Complete user activity monitoring  
✅ **Error Handling**: Robust error management  
✅ **Scalability**: Better suited for high-traffic applications  
✅ **Developer Experience**: Excellent tooling and debugging  
✅ **Compliance**: Built-in audit trail for regulatory requirements  

This enhanced Auth0 integration with Prisma provides a production-ready authentication system with comprehensive user management, audit logging, and excellent developer experience.

