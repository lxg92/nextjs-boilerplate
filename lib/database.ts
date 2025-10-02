import { User, UsageStats, Voice, Recording } from './types';

// In-memory database for demonstration
// In production, replace with a real database like PostgreSQL, MongoDB, etc.
class Database {
  private users: Map<string, User> = new Map();
  private usageStats: Map<string, UsageStats> = new Map();
  private voices: Map<string, Voice> = new Map();
  private recordings: Map<string, Recording> = new Map();

  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, newUser);
    
    // Initialize usage stats
    this.usageStats.set(id, {
      userId: id,
      charactersUsedThisMonth: 0,
      recordingsCreatedThisMonth: 0,
      voicesCreated: 0,
      lastResetDate: new Date(),
    });
    
    return newUser;
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.auth0Id === auth0Id) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Usage stats operations
  async getUsageStats(userId: string): Promise<UsageStats | null> {
    return this.usageStats.get(userId) || null;
  }

  async updateUsageStats(userId: string, updates: Partial<UsageStats>): Promise<UsageStats | null> {
    const stats = this.usageStats.get(userId);
    if (!stats) return null;
    
    const updatedStats = { ...stats, ...updates };
    this.usageStats.set(userId, updatedStats);
    return updatedStats;
  }

  // Voice operations
  async createVoice(voice: Omit<Voice, 'id' | 'createdAt'>): Promise<Voice> {
    const id = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newVoice: Voice = {
      ...voice,
      id,
      createdAt: new Date(),
    };
    this.voices.set(id, newVoice);
    return newVoice;
  }

  async getVoicesByUserId(userId: string): Promise<Voice[]> {
    return Array.from(this.voices.values()).filter(voice => voice.userId === userId);
  }

  async deleteVoice(id: string): Promise<boolean> {
    return this.voices.delete(id);
  }

  // Recording operations
  async createRecording(recording: Omit<Recording, 'id'>): Promise<Recording> {
    const id = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRecording: Recording = {
      ...recording,
      id,
    };
    this.recordings.set(id, newRecording);
    return newRecording;
  }

  async getRecordingsByUserId(userId: string): Promise<Recording[]> {
    return Array.from(this.recordings.values())
      .filter(recording => recording.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async deleteRecording(id: string): Promise<boolean> {
    return this.recordings.delete(id);
  }

  // Reset monthly usage (call this monthly)
  async resetMonthlyUsage(): Promise<void> {
    const now = new Date();
    for (const [userId, stats] of this.usageStats.entries()) {
      const lastReset = new Date(stats.lastResetDate);
      const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                              (now.getMonth() - lastReset.getMonth());
      
      if (monthsSinceReset >= 1) {
        this.usageStats.set(userId, {
          ...stats,
          charactersUsedThisMonth: 0,
          recordingsCreatedThisMonth: 0,
          lastResetDate: now,
        });
      }
    }
  }
}

export const db = new Database();

