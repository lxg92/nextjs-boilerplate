import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { createCustomerPortalSession } from '@/lib/stripe';
import { db } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.getUserByAuth0Id(session.user.sub);
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const portalSession = await createCustomerPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${process.env.AUTH0_BASE_URL}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}

