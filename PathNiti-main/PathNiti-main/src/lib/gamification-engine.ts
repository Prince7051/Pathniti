/**
 * Gamification Engine for PathNiti
 * Advanced engagement and motivation system for SIH finals
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: 'academic' | 'engagement' | 'social' | 'milestone' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: AchievementRequirement[];
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface AchievementRequirement {
  type: 'quiz_completed' | 'streak_days' | 'points_earned' | 'colleges_visited' | 'mentors_connected' | 'custom';
  value: number;
  current: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedAt?: string;
  category: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  badges: Badge[];
  achievements: Achievement[];
}

export interface Streak {
  current: number;
  longest: number;
  lastActivity: string;
  streakType: 'daily_login' | 'quiz_completion' | 'study_time';
}

export interface GamificationConfig {
  enableAchievements: boolean;
  enableBadges: boolean;
  enableLeaderboards: boolean;
  enableStreaks: boolean;
  enablePoints: boolean;
  enableLevels: boolean;
  enableRewards: boolean;
  enableSocialFeatures: boolean;
  enableNotifications: boolean;
  pointMultipliers: Record<string, number>;
}

export class GamificationEngine {
  private config: GamificationConfig;
  private achievements: Map<string, Achievement> = new Map();
  private badges: Map<string, Badge> = new Map();
  private userProgress: Map<string, any> = new Map();
  private leaderboard: LeaderboardEntry[] = [];
  private streaks: Map<string, Streak> = new Map();

  constructor(config: Partial<GamificationConfig> = {}) {
    this.config = {
      enableAchievements: true,
      enableBadges: true,
      enableLeaderboards: true,
      enableStreaks: true,
      enablePoints: true,
      enableLevels: true,
      enableRewards: true,
      enableSocialFeatures: true,
      enableNotifications: true,
      pointMultipliers: {
        quiz_completion: 10,
        streak_bonus: 5,
        achievement_unlock: 25,
        social_interaction: 3,
        study_time: 2
      },
      ...config
    };

    this.initializeAchievements();
    this.initializeBadges();
  }

  /**
   * Initialize achievement system
   */
  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      {
        id: 'first_quiz',
        title: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🎯',
        points: 50,
        category: 'academic',
        rarity: 'common',
        requirements: [{ type: 'quiz_completed', value: 1, current: 0 }],
        unlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: '🧠',
        points: 200,
        category: 'academic',
        rarity: 'uncommon',
        requirements: [{ type: 'quiz_completed', value: 10, current: 0 }],
        unlocked: false,
        progress: 0,
        maxProgress: 10
      },
      {
        id: 'streak_warrior',
        title: 'Streak Warrior',
        description: 'Maintain a 7-day study streak',
        icon: '🔥',
        points: 300,
        category: 'engagement',
        rarity: 'rare',
        requirements: [{ type: 'streak_days', value: 7, current: 0 }],
        unlocked: false,
        progress: 0,
        maxProgress: 7
      },
      {
        id: 'explorer',
        title: 'College Explorer',
        description: 'Visit 20 different colleges',
        icon: '🏛️',
        points: 250,
        category: 'engagement',
        rarity: 'uncommon',
        requirements: [{ type: 'colleges_visited', value: 20, current: 0 }],
        unlocked: false,
        progress: 0,
        maxProgress: 20
      },
      {
        id: 'mentor_connector',
        title: 'Mentor Connector',
        description: 'Connect with 5 mentors',
        icon: '🤝',
        points: 400,
        category: 'social',
        rarity: 'rare',
        requirements: [{ type: 'mentors_connected', value: 5, current: 0 }],
        unlocked: false,
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'point_master',
        title: 'Point Master',
        description: 'Earn 1000 points',
        icon: '⭐',
        points: 500,
        category: 'milestone',
        rarity: 'epic',
        requirements: [{ type: 'points_earned', value: 1000, current: 0 }],
        unlocked: false,
        progress: 0,
        maxProgress: 1000
      },
      {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Get 100% on a quiz',
        icon: '💯',
        points: 100,
        category: 'academic',
        rarity: 'uncommon',
        requirements: [{ type: 'custom', value: 1, current: 0 }],
        unlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Complete a quiz before 8 AM',
        icon: '🌅',
        points: 75,
        category: 'special',
        rarity: 'uncommon',
        requirements: [{ type: 'custom', value: 1, current: 0 }],
        unlocked: false,
        progress: 0,
        maxProgress: 1
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * Initialize badge system
   */
  private initializeBadges(): void {
    const badges: Badge[] = [
      {
        id: 'newcomer',
        name: 'Newcomer',
        description: 'Welcome to PathNiti!',
        icon: '👋',
        color: '#4CAF50',
        earned: false,
        category: 'welcome'
      },
      {
        id: 'dedicated',
        name: 'Dedicated',
        description: 'Study for 5 consecutive days',
        icon: '📚',
        color: '#2196F3',
        earned: false,
        category: 'study'
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Interact with 10 different users',
        icon: '🦋',
        color: '#FF9800',
        earned: false,
        category: 'social'
      },
      {
        id: 'helper',
        name: 'Helper',
        description: 'Help 5 other students',
        icon: '🤝',
        color: '#9C27B0',
        earned: false,
        category: 'community'
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Get 100% on 5 quizzes',
        icon: '🎯',
        color: '#F44336',
        earned: false,
        category: 'academic'
      },
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Discover 50 different colleges',
        icon: '🗺️',
        color: '#00BCD4',
        earned: false,
        category: 'discovery'
      },
      {
        id: 'mentor',
        name: 'Mentor',
        description: 'Become a mentor to others',
        icon: '👨‍🏫',
        color: '#795548',
        earned: false,
        category: 'leadership'
      },
      {
        id: 'champion',
        name: 'Champion',
        description: 'Top 10 in monthly leaderboard',
        icon: '🏆',
        color: '#FFD700',
        earned: false,
        category: 'competition'
      }
    ];

    badges.forEach(badge => {
      this.badges.set(badge.id, badge);
    });
  }

  /**
   * Award points for an action
   */
  awardPoints(userId: string, action: string, basePoints: number = 0): number {
    if (!this.config.enablePoints) return 0;

    const multiplier = this.config.pointMultipliers[action] || 1;
    const points = basePoints * multiplier;
    
    const userProgress = this.getUserProgress(userId);
    userProgress.totalPoints += points;
    userProgress.pointsThisWeek += points;
    userProgress.pointsThisMonth += points;

    this.updateUserProgress(userId, userProgress);
    
    // Check for point-based achievements
    this.checkAchievements(userId);
    
    return points;
  }

  /**
   * Update streak
   */
  updateStreak(userId: string, streakType: Streak['streakType']): void {
    if (!this.config.enableStreaks) return;

    const streak = this.streaks.get(userId) || {
      current: 0,
      longest: 0,
      lastActivity: '',
      streakType
    };

    const today = new Date().toDateString();
    const lastActivity = new Date(streak.lastActivity).toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (lastActivity === today) {
      // Already updated today
      return;
    } else if (lastActivity === yesterday) {
      // Continue streak
      streak.current += 1;
    } else {
      // Streak broken
      streak.current = 1;
    }

    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastActivity = new Date().toISOString();
    streak.streakType = streakType;

    this.streaks.set(userId, streak);
    
    // Award streak bonus points
    if (streak.current > 1) {
      this.awardPoints(userId, 'streak_bonus', streak.current);
    }

    // Check for streak achievements
    this.checkAchievements(userId);
  }

  /**
   * Record quiz completion
   */
  recordQuizCompletion(userId: string, score: number, timeSpent: number): void {
    const userProgress = this.getUserProgress(userId);
    userProgress.quizzesCompleted += 1;
    userProgress.totalScore += score;
    userProgress.totalTimeSpent += timeSpent;

    // Award points
    this.awardPoints(userId, 'quiz_completion', 10);
    
    // Update streak
    this.updateStreak(userId, 'quiz_completion');

    // Check for perfect score
    if (score === 100) {
      this.unlockAchievement(userId, 'perfect_score');
    }

    // Check for early bird
    const hour = new Date().getHours();
    if (hour < 8) {
      this.unlockAchievement(userId, 'early_bird');
    }

    this.updateUserProgress(userId, userProgress);
    this.checkAchievements(userId);
  }

  /**
   * Record study time
   */
  recordStudyTime(userId: string, minutes: number): void {
    const userProgress = this.getUserProgress(userId);
    userProgress.studyTimeMinutes += minutes;
    userProgress.studyTimeThisWeek += minutes;
    userProgress.studyTimeThisMonth += minutes;

    // Award points based on study time
    this.awardPoints(userId, 'study_time', minutes);

    this.updateUserProgress(userId, userProgress);
    this.checkAchievements(userId);
  }

  /**
   * Record college visit
   */
  recordCollegeVisit(userId: string, collegeId: string): void {
    const userProgress = this.getUserProgress(userId);
    
    if (!userProgress.visitedColleges.includes(collegeId)) {
      userProgress.visitedColleges.push(collegeId);
      userProgress.collegesVisited += 1;
      
      // Award points
      this.awardPoints(userId, 'colleges_visited', 5);
      
      this.updateUserProgress(userId, userProgress);
      this.checkAchievements(userId);
    }
  }

  /**
   * Record mentor connection
   */
  recordMentorConnection(userId: string, mentorId: string): void {
    const userProgress = this.getUserProgress(userId);
    
    if (!userProgress.connectedMentors.includes(mentorId)) {
      userProgress.connectedMentors.push(mentorId);
      userProgress.mentorsConnected += 1;
      
      // Award points
      this.awardPoints(userId, 'mentors_connected', 20);
      
      this.updateUserProgress(userId, userProgress);
      this.checkAchievements(userId);
    }
  }

  /**
   * Check and unlock achievements
   */
  private checkAchievements(userId: string): void {
    const userProgress = this.getUserProgress(userId);
    
    this.achievements.forEach((achievement, achievementId) => {
      if (achievement.unlocked) return;

      let unlocked = true;
      let progress = 0;

      achievement.requirements.forEach(requirement => {
        let current = 0;
        
        switch (requirement.type) {
          case 'quiz_completed':
            current = userProgress.quizzesCompleted;
            break;
          case 'streak_days':
            current = this.streaks.get(userId)?.current || 0;
            break;
          case 'points_earned':
            current = userProgress.totalPoints;
            break;
          case 'colleges_visited':
            current = userProgress.collegesVisited;
            break;
          case 'mentors_connected':
            current = userProgress.mentorsConnected;
            break;
          case 'custom':
            // Custom logic for specific achievements
            if (achievementId === 'perfect_score') {
              current = userProgress.perfectScores || 0;
            } else if (achievementId === 'early_bird') {
              current = userProgress.earlyBirdQuizzes || 0;
            }
            break;
        }

        requirement.current = current;
        
        if (current < requirement.value) {
          unlocked = false;
        }
        
        progress = Math.min(current, requirement.value);
      });

      if (unlocked && !achievement.unlocked) {
        this.unlockAchievement(userId, achievementId);
      } else {
        achievement.progress = progress;
        achievement.maxProgress = Math.max(...achievement.requirements.map(r => r.value));
      }
    });
  }

  /**
   * Unlock achievement
   */
  private unlockAchievement(userId: string, achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
    
    // Award points
    this.awardPoints(userId, 'achievement_unlock', achievement.points);
    
    // Show notification
    if (this.config.enableNotifications) {
      this.showAchievementNotification(achievement);
    }

    // Check for badge unlocks
    this.checkBadges(userId);
  }

  /**
   * Check and unlock badges
   */
  private checkBadges(userId: string): void {
    const userProgress = this.getUserProgress(userId);
    
    this.badges.forEach((badge, badgeId) => {
      if (badge.earned) return;

      let earned = false;

      switch (badgeId) {
        case 'newcomer':
          earned = userProgress.quizzesCompleted > 0;
          break;
        case 'dedicated':
          earned = (this.streaks.get(userId)?.current || 0) >= 5;
          break;
        case 'social_butterfly':
          earned = userProgress.socialInteractions >= 10;
          break;
        case 'helper':
          earned = userProgress.helpGiven >= 5;
          break;
        case 'perfectionist':
          earned = userProgress.perfectScores >= 5;
          break;
        case 'explorer':
          earned = userProgress.collegesVisited >= 50;
          break;
        case 'mentor':
          earned = userProgress.isMentor;
          break;
        case 'champion':
          earned = this.getUserRank(userId) <= 10;
          break;
      }

      if (earned && !badge.earned) {
        this.unlockBadge(userId, badgeId);
      }
    });
  }

  /**
   * Unlock badge
   */
  private unlockBadge(userId: string, badgeId: string): void {
    const badge = this.badges.get(badgeId);
    if (!badge || badge.earned) return;

    badge.earned = true;
    badge.earnedAt = new Date().toISOString();
    
    // Show notification
    if (this.config.enableNotifications) {
      this.showBadgeNotification(badge);
    }
  }

  /**
   * Get user progress
   */
  getUserProgress(userId: string): any {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        totalPoints: 0,
        pointsThisWeek: 0,
        pointsThisMonth: 0,
        quizzesCompleted: 0,
        totalScore: 0,
        totalTimeSpent: 0,
        studyTimeMinutes: 0,
        studyTimeThisWeek: 0,
        studyTimeThisMonth: 0,
        visitedColleges: [],
        collegesVisited: 0,
        connectedMentors: [],
        mentorsConnected: 0,
        socialInteractions: 0,
        helpGiven: 0,
        perfectScores: 0,
        earlyBirdQuizzes: 0,
        isMentor: false,
        level: 1,
        experience: 0
      });
    }
    
    return this.userProgress.get(userId);
  }

  /**
   * Update user progress
   */
  private updateUserProgress(userId: string, progress: any): void {
    this.userProgress.set(userId, progress);
    
    // Update leaderboard
    this.updateLeaderboard();
  }

  /**
   * Update leaderboard
   */
  private updateLeaderboard(): void {
    if (!this.config.enableLeaderboards) return;

    const entries: LeaderboardEntry[] = [];
    
    this.userProgress.forEach((progress, userId) => {
      const userAchievements = Array.from(this.achievements.values())
        .filter(a => a.unlocked);
      const userBadges = Array.from(this.badges.values())
        .filter(b => b.earned);
      
      entries.push({
        userId,
        username: `User ${userId.slice(-4)}`, // Placeholder
        score: progress.totalPoints,
        rank: 0, // Will be set after sorting
        badges: userBadges,
        achievements: userAchievements
      });
    });

    // Sort by score and assign ranks
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.leaderboard = entries;
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 10): LeaderboardEntry[] {
    return this.leaderboard.slice(0, limit);
  }

  /**
   * Get user rank
   */
  getUserRank(userId: string): number {
    const entry = this.leaderboard.find(e => e.userId === userId);
    return entry ? entry.rank : 999;
  }

  /**
   * Get user achievements
   */
  getUserAchievements(userId: string): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get user badges
   */
  getUserBadges(userId: string): Badge[] {
    return Array.from(this.badges.values());
  }

  /**
   * Get user streak
   */
  getUserStreak(userId: string): Streak | null {
    return this.streaks.get(userId) || null;
  }

  /**
   * Show achievement notification
   */
  private showAchievementNotification(achievement: Achievement): void {
    if (typeof window === 'undefined') return;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
          <div class="achievement-title">Achievement Unlocked!</div>
          <div class="achievement-name">${achievement.title}</div>
          <div class="achievement-description">${achievement.description}</div>
          <div class="achievement-points">+${achievement.points} points</div>
        </div>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.5s ease-out;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.5s ease-in';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 5000);
  }

  /**
   * Show badge notification
   */
  private showBadgeNotification(badge: Badge): void {
    if (typeof window === 'undefined') return;

    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
      <div class="badge-content">
        <div class="badge-icon" style="color: ${badge.color}">${badge.icon}</div>
        <div class="badge-text">
          <div class="badge-title">Badge Earned!</div>
          <div class="badge-name">${badge.name}</div>
          <div class="badge-description">${badge.description}</div>
        </div>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.5s ease-out;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.5s ease-in';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 5000);
  }

  /**
   * Get gamification statistics
   */
  getStats(): any {
    return {
      totalUsers: this.userProgress.size,
      totalAchievements: this.achievements.size,
      totalBadges: this.badges.size,
      unlockedAchievements: Array.from(this.achievements.values()).filter(a => a.unlocked).length,
      earnedBadges: Array.from(this.badges.values()).filter(b => b.earned).length,
      averagePoints: this.calculateAveragePoints(),
      topPerformer: this.leaderboard[0]?.username || 'None'
    };
  }

  private calculateAveragePoints(): number {
    if (this.userProgress.size === 0) return 0;
    
    const totalPoints = Array.from(this.userProgress.values())
      .reduce((sum, progress) => sum + progress.totalPoints, 0);
    
    return Math.round(totalPoints / this.userProgress.size);
  }

  /**
   * Reset user progress (for testing)
   */
  resetUserProgress(userId: string): void {
    this.userProgress.delete(userId);
    this.streaks.delete(userId);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GamificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const gamificationEngine = new GamificationEngine();
