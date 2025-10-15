import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createCustomerPortalSession } from '../../lib/stripe';
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

    const { priceId, tier } = await req.json();

    if (!priceId || !tier) {
      return NextResponse.json({ error: 'Missing priceId or tier' }, { status: 400 });
    }

    // Get user to find Stripe customer ID
    const userResult = await getItem(TABLES.USERS, { userId: sessionData.userId });
    
    if (!userResult.Item) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.Item;
    const session = await createCheckoutSession(priceId, sessionData.userId, user.stripeCustomerId);

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
};


