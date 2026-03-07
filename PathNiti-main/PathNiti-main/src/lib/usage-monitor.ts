/**
 * Usage Monitor for Gemini API Free Tier
 * Ensures we stay within free tier limits
 */

interface UsageStats {
  requestsToday: number;
  requestsThisMinute: number;
  lastRequestTime: number;
  dailyLimit: number;
  perMinuteLimit: number;
}

class UsageMonitor {
  private stats: UsageStats = {
    requestsToday: 0,
    requestsThisMinute: 0,
    lastRequestTime: 0,
    dailyLimit: 15, // Conservative limit for gemini-1.5-flash free tier
    perMinuteLimit: 1, // Conservative limit to avoid rate limiting
  };

  private lastMinuteReset = Date.now();

  /**
   * Check if we can make a request without exceeding limits
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    const lastRequestDate = new Date(this.stats.lastRequestTime).toDateString();
    if (today !== lastRequestDate) {
      this.stats.requestsToday = 0;
    }

    // Reset per-minute counter if a minute has passed
    if (now - this.lastMinuteReset > 60000) {
      this.stats.requestsThisMinute = 0;
      this.lastMinuteReset = now;
    }

    // Check limits
    if (this.stats.requestsToday >= this.stats.dailyLimit) {
      console.warn("Daily API limit reached. Using fallback recommendations.");
      return false;
    }

    if (this.stats.requestsThisMinute >= this.stats.perMinuteLimit) {
      console.warn(
        "Per-minute API limit reached. Using fallback recommendations.",
      );
      return false;
    }

    return true;
  }

  /**
   * Record a successful API request
   */
  recordRequest(): void {
    this.stats.requestsToday++;
    this.stats.requestsThisMinute++;
    this.stats.lastRequestTime = Date.now();
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): UsageStats {
    return { ...this.stats };
  }

  /**
   * Get remaining requests for today
   */
  getRemainingRequestsToday(): number {
    return Math.max(0, this.stats.dailyLimit - this.stats.requestsToday);
  }

  /**
   * Check if we're approaching limits
   */
  isApproachingLimit(): boolean {
    const dailyUsagePercent =
      (this.stats.requestsToday / this.stats.dailyLimit) * 100;
    return dailyUsagePercent > 80; // Warning at 80% usage
  }
}

// Export singleton instance
export const usageMonitor = new UsageMonitor();
