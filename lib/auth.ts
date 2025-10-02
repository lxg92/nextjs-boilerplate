import { getSession } from '@auth0/nextjs-auth0';
import { db } from './database';
import { getUsageLimits, SubscriptionTier } from './subscription-tiers';

export async function getAuthenticatedUser() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  let user = await db.getUserByAuth0Id(session.user.sub);
  if (!user) {
    // Create user if doesn't exist
    user = await db.createUser({
      auth0Id: session.user.sub,
      email: session.user.email || '',
      name: session.user.name || '',
      subscriptionTier: 'free',
    });
  }

  return user;
}

export async function checkUsageLimit(
  userId: string,
  limitType: 'maxVoices' | 'maxCharactersPerMonth' | 'maxRecordingsPerMonth',
  currentUsage: number
): Promise<{ allowed: boolean; limit: number; tier: SubscriptionTier }> {
  const user = await db.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const limits = getUsageLimits(user.subscriptionTier);
  const limit = limits[limitType] as number;
  
  return {
    allowed: currentUsage < limit,
    limit,
    tier: user.subscriptionTier,
  };
}

export async function incrementUsage(
  userId: string,
  charactersUsed: number,
  recordingsCreated: number = 1
): Promise<void> {
  const stats = await db.getUsageStats(userId);
  if (!stats) {
    throw new Error('Usage stats not found');
  }

  await db.updateUsageStats(userId, {
    charactersUsedThisMonth: stats.charactersUsedThisMonth + charactersUsed,
    recordingsCreatedThisMonth: stats.recordingsCreatedThisMonth + recordingsCreated,
  });
}

