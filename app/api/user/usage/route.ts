import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../lib/redis';
import { getItem, updateItem } from '../../lib/dynamodb';
import { TABLES } from '../../lib/dynamodb';
import { getMaxRecordings } from '../../lib/feature-flags';

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
    const maxRecordings = getMaxRecordings(user.subscriptionTier);
    
    // Check if monthly reset is needed
    const now = Date.now();
    const resetDate = user.recordingsResetDate || now;
    const monthInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (now - resetDate > monthInMs) {
      // Reset monthly counter
      await updateItem(
        TABLES.USERS,
        { userId: sessionData.userId },
        'SET recordingsThisMonth = :count, recordingsResetDate = :date',
        {
          ':count': 0,
          ':date': now,
        }
      );
      
      user.recordingsThisMonth = 0;
      user.recordingsResetDate = now;
    }

    return NextResponse.json({
      recordingsUsed: user.recordingsThisMonth,
      recordingsLimit: maxRecordings,
      resetDate: user.recordingsResetDate,
      hasReachedLimit: maxRecordings !== -1 && user.recordingsThisMonth >= maxRecordings,
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
};


