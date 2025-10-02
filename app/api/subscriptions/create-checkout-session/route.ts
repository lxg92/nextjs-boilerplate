import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { createCheckoutSession } from '@/lib/stripe';
import { STRIPE_CONFIG } from '@/lib/stripe';
import { db } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await req.json();
    
    if (!tier || !['basic', 'premium'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get or create user
    let user = await db.getUserByAuth0Id(session.user.sub);
    if (!user) {
      user = await db.createUser({
        auth0Id: session.user.sub,
        email: session.user.email || '',
        name: session.user.name || '',
        subscriptionTier: 'free',
      });
    }

    const config = STRIPE_CONFIG[tier as keyof typeof STRIPE_CONFIG];
    const checkoutSession = await createCheckoutSession({
      customerId: user.stripeCustomerId || undefined,
      priceId: config.priceId,
      successUrl: `${process.env.AUTH0_BASE_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.AUTH0_BASE_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

