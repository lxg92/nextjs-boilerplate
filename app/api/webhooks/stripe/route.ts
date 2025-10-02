import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/database';
import { getSubscriptionTier } from '@/lib/subscription-tiers';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Find user by Stripe customer ID
        const user = await db.getUserByAuth0Id(customerId);
        if (user) {
          await db.updateUser(user.id, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const user = await db.getUserByAuth0Id(customerId);
        if (user) {
          const tier = getSubscriptionTier(subscription.status);
          await db.updateUser(user.id, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status as any,
            subscriptionTier: tier,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const user = await db.getUserByAuth0Id(customerId);
        if (user) {
          await db.updateUser(user.id, {
            subscriptionStatus: 'canceled',
            subscriptionTier: 'free',
            stripeSubscriptionId: null,
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const user = await db.getUserByAuth0Id(customerId);
        if (user) {
          await db.updateUser(user.id, {
            subscriptionStatus: 'active',
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const user = await db.getUserByAuth0Id(customerId);
        if (user) {
          await db.updateUser(user.id, {
            subscriptionStatus: 'past_due',
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

