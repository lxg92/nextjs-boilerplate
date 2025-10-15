import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from '../../lib/stripe';
import { getItem, putItem, updateItem } from '../../lib/dynamodb';
import { TABLES } from '../../lib/dynamodb';
import { deleteSession } from '../../lib/redis';

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    const event = validateWebhookSignature(body, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        
        if (!userId) {
          console.error('No userId in checkout session metadata');
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Get user and update subscription tier
        const userResult = await getItem(TABLES.USERS, { userId });
        
        if (!userResult.Item) {
          console.error('User not found for checkout session:', userId);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.Item;
        const subscription = session.subscription as string;
        
        // Determine tier based on price ID
        const tier = session.metadata?.tier || 'BASIC';
        
        // Update user subscription
        await updateItem(
          TABLES.USERS,
          { userId },
          'SET subscriptionTier = :tier, subscriptionStatus = :status',
          {
            ':tier': tier,
            ':status': 'active',
          }
        );

        // Create subscription record
        await putItem(TABLES.SUBSCRIPTIONS, {
          userId,
          subscriptionId: `${userId}_${subscription}`,
          stripeSubscriptionId: subscription,
          stripePriceId: session.metadata?.priceId || '',
          tier,
          status: 'active',
          currentPeriodStart: Math.floor(Date.now() / 1000),
          currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
          cancelAtPeriodEnd: false,
          createdAt: Date.now(),
        });

        // Invalidate user session to refresh tier
        const sessionId = req.cookies.get('sessionId')?.value;
        if (sessionId) {
          await deleteSession(sessionId);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID
        const userResult = await getItem(TABLES.USERS, { stripeCustomerId: customerId });
        
        if (!userResult.Item) {
          console.error('User not found for subscription update:', customerId);
          break;
        }

        const user = userResult.Item;
        
        // Update subscription status
        await updateItem(
          TABLES.USERS,
          { userId: user.userId },
          'SET subscriptionStatus = :status',
          {
            ':status': subscription.status,
          }
        );

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID
        const userResult = await getItem(TABLES.USERS, { stripeCustomerId: customerId });
        
        if (!userResult.Item) {
          console.error('User not found for subscription deletion:', customerId);
          break;
        }

        const user = userResult.Item;
        
        // Downgrade to FREE tier
        await updateItem(
          TABLES.USERS,
          { userId: user.userId },
          'SET subscriptionTier = :tier, subscriptionStatus = :status',
          {
            ':tier': 'FREE',
            ':status': 'canceled',
          }
        );

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        
        // Find user by Stripe customer ID
        const userResult = await getItem(TABLES.USERS, { stripeCustomerId: customerId });
        
        if (!userResult.Item) {
          console.error('User not found for payment failure:', customerId);
          break;
        }

        const user = userResult.Item;
        
        // Update subscription status to past_due
        await updateItem(
          TABLES.USERS,
          { userId: user.userId },
          'SET subscriptionStatus = :status',
          {
            ':status': 'past_due',
          }
        );

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
};


