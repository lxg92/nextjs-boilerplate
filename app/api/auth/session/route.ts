import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../lib/redis';
import { getItem } from '../../lib/dynamodb';
import { TABLES } from '../../lib/dynamodb';
import { getFeatureFlags } from '../../lib/feature-flags';

export const GET = async (req: NextRequest) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Get user profile from DynamoDB
    const userResult = await getItem(TABLES.USERS, { userId: sessionData.userId });
    
    if (!userResult.Item) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const user = userResult.Item;
    const features = getFeatureFlags(user.subscriptionTier);

    return NextResponse.json({
      valid: true,
      user: {
        userId: user.userId,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        recordingsThisMonth: user.recordingsThisMonth,
        features,
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
};


