import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

export { redis };

export interface SessionData {
  userId: string;
  auth0Id: string;
  subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM';
  createdAt: number;
}

export const setSession = async (sessionId: string, sessionData: SessionData, ttlSeconds: number = 900) => {
  const key = `session:${sessionId}`;
  await redis.setex(key, ttlSeconds, JSON.stringify(sessionData));
};

export const getSession = async (sessionId: string): Promise<SessionData | null> => {
  const key = `session:${sessionId}`;
  const data = await redis.get(key);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as SessionData;
  } catch {
    return null;
  }
};

export const deleteSession = async (sessionId: string) => {
  const key = `session:${sessionId}`;
  await redis.del(key);
};

export const refreshSession = async (sessionId: string, ttlSeconds: number = 900) => {
  const key = `session:${sessionId}`;
  await redis.expire(key, ttlSeconds);
};

