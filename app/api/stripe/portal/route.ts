import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '../../lib/stripe';
import { getSession } from '../../lib/redis';
import { getItem } from '../../lib/dynamodb';
import { TABLES } from '../../lib/dynamodb';

export const POST = async (req: NextRequest) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user to find Stripe customer ID
    const userResult = await getItem(TABLES.USERS, { userId: sessionData.userId });
    
    if (!userResult.Item) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.Item;
    
    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    const session = await createCustomerPortalSession(user.stripeCustomerId);

    return NextResponse.json({ portalUrl: session.url });
  } catch (error) {
    console.error('Customer portal session creation error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
};


