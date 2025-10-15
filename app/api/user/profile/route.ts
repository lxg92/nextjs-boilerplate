import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../lib/redis';
import { getItem } from '../../lib/dynamodb';
import { TABLES } from '../../lib/dynamodb';
import { getFeatureFlags } from '../../lib/feature-flags';

export const GET = async (req: NextRequest) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user profile
    const userResult = await getItem(TABLES.USERS, { userId: sessionData.userId });
    
    if (!userResult.Item) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.Item;
    const features = getFeatureFlags(user.subscriptionTier);

    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      recordingsThisMonth: user.recordingsThisMonth,
      features,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
};


