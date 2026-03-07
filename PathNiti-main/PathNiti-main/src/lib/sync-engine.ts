/**
 * Sync Engine for PathNiti Offline-First Architecture
 * Handles synchronization between offline storage and server database
 */

import {
  offlineStorage,
  OfflineChatMessage,
} from "./offline-storage";
import { supabase } from "./supabase";

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingItems: number;
  syncInProgress: boolean;
  lastError: string | null;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
  duration: number;
}

class SyncEngine {
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private onlineStatus =
    typeof window !== "undefined" ? navigator.onLine : true;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.setupEventListeners();
      this.startPeriodicSync();
    }
  }

  private setupEventListeners(): void {
    // Listen for online/offline status changes
    window.addEventListener("online", () => {
      this.onlineStatus = true;
      this.notifyListeners();
      this.triggerSync();
    });

    window.addEventListener("offline", () => {
      this.onlineStatus = false;
      this.notifyListeners();
    });

    // Listen for visibility changes to sync when user returns
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.onlineStatus) {
        this.triggerSync();
      }
    });
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(
      () => {
        if (this.onlineStatus && !this.syncInProgress) {
          this.triggerSync();
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes
  }

  public addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const status = this.getSyncStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  public getSyncStatus(): SyncStatus {
    return {
      isOnline: this.onlineStatus,
      lastSyncTime: localStorage.getItem("lastSyncTime"),
      pendingItems: 0, // Will be calculated dynamically
      syncInProgress: this.syncInProgress,
      lastError: localStorage.getItem("lastSyncError"),
    };
  }

  public async triggerSync(): Promise<SyncResult> {
    if (this.syncInProgress || !this.onlineStatus) {
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: ["Sync already in progress or offline"],
        duration: 0,
      };
    }

    const startTime = Date.now();
    this.syncInProgress = true;
    this.notifyListeners();

    try {
      const results = await Promise.allSettled([
        this.syncQuizResponses(),
        this.syncAssessmentSessions(),
        this.syncChatMessages(),
        this.syncUserProfile(),
        this.syncCacheData(),
      ]);

      const syncedItems = results
        .filter((result) => result.status === "fulfilled")
        .reduce(
          (sum, result) =>
            sum + (result as PromiseFulfilledResult<number>).value,
          0,
        );

      const failedItems = results.filter(
        (result) => result.status === "rejected",
      ).length;

      const errors = results
        .filter((result) => result.status === "rejected")
        .map(
          (result) =>
            (result as PromiseRejectedResult).reason?.message ||
            "Unknown error",
        );

      const success = failedItems === 0;
      const duration = Date.now() - startTime;

      if (success) {
        localStorage.setItem("lastSyncTime", new Date().toISOString());
        localStorage.removeItem("lastSyncError");
      } else {
        localStorage.setItem("lastSyncError", errors.join("; "));
      }

      const syncResult: SyncResult = {
        success,
        syncedItems,
        failedItems,
        errors,
        duration,
      };

      this.syncInProgress = false;
      this.notifyListeners();

      return syncResult;
    } catch (error) {
      this.syncInProgress = false;
      this.notifyListeners();

      return {
        success: false,
        syncedItems: 0,
        failedItems: 1,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        duration: Date.now() - startTime,
      };
    }
  }

  private async syncQuizResponses(): Promise<number> {
    const unsyncedResponses = await offlineStorage.getUnsyncedQuizResponses();
    let syncedCount = 0;

    for (const response of unsyncedResponses) {
      try {
        const { error } = await (supabase as any).from("assessment_responses").insert({
          session_id: response.session_id,
          question_id: response.question_id,
          user_answer: response.user_answer,
          time_taken: response.time_taken,
          is_correct: response.is_correct,
          answered_at: response.answered_at,
        });

        if (error) {
          console.error("Failed to sync quiz response:", error);
          continue;
        }

        await offlineStorage.markQuizResponseSynced(response.id);
        syncedCount++;
      } catch (error) {
        console.error("Error syncing quiz response:", error);
      }
    }

    return syncedCount;
  }

  private async syncAssessmentSessions(): Promise<number> {
    const unsyncedSessions =
      await offlineStorage.getUnsyncedAssessmentSessions();
    let syncedCount = 0;

    for (const session of unsyncedSessions) {
      try {
        const { error } = await (supabase as any).from("assessment_sessions").upsert({
          id: session.id,
          user_id: session.user_id,
          status: session.status,
          started_at: session.started_at,
          completed_at: session.completed_at,
          aptitude_scores: session.aptitude_scores,
          riasec_scores: session.riasec_scores,
          personality_scores: session.personality_scores,
          subject_performance: session.subject_performance,
          practical_constraints: session.practical_constraints,
          total_score: session.total_score,
          total_questions: session.total_questions,
          answered_questions: session.answered_questions,
          time_spent: session.time_spent,
          session_type: session.session_type,
        });

        if (error) {
          console.error("Failed to sync assessment session:", error);
          continue;
        }

        await offlineStorage.updateAssessmentSession(session.id, {
          synced: true,
        });
        syncedCount++;
      } catch (error) {
        console.error("Error syncing assessment session:", error);
      }
    }

    return syncedCount;
  }

  private async syncChatMessages(): Promise<number> {
    // Get unsynced chat messages from sync queue
    const syncQueue = await offlineStorage.getSyncQueue();
    const chatMessages = syncQueue.filter(
      (item) => item.type === "chat_message",
    );
    let syncedCount = 0;

    for (const item of chatMessages) {
      try {
        const message = item.data as unknown as OfflineChatMessage;

        const { error } = await (supabase as any).from("chat_messages").insert({
          session_id: message.session_id,
          type: message.type,
          content: message.content,
          timestamp: message.timestamp,
          metadata: message.metadata,
        });

        if (error) {
          console.error("Failed to sync chat message:", error);
          continue;
        }

        await offlineStorage.removeFromSyncQueue(item.id);
        syncedCount++;
      } catch (error) {
        console.error("Error syncing chat message:", error);
      }
    }

    return syncedCount;
  }

  private async syncUserProfile(): Promise<number> {
    const profile = await offlineStorage.getUserProfile();
    if (!profile || !profile.pending_updates) {
      return 0;
    }

    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          phone: profile.phone,
          first_name: profile.first_name,
          last_name: profile.last_name,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          class_level: profile.class_level,
          stream: profile.stream,
          location: profile.location,
          interests: profile.interests,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        console.error("Failed to sync user profile:", error);
        return 0;
      }

      // Mark profile as synced
      await offlineStorage.saveUserProfile({
        ...profile,
        pending_updates: false,
        last_synced: new Date().toISOString(),
      });

      return 1;
    } catch (error) {
      console.error("Error syncing user profile:", error);
      return 0;
    }
  }

  private async syncCacheData(): Promise<number> {
    // This method handles syncing cached data like colleges and scholarships
    // For now, we'll just refresh the cache with latest data from server
    try {
      await this.refreshCollegesCache();
      await this.refreshScholarshipsCache();
      await this.refreshAwarenessContentCache();
      return 1;
    } catch (error) {
      console.error("Error syncing cache data:", error);
      return 0;
    }
  }

  private async refreshCollegesCache(): Promise<void> {
    try {
      const { data: colleges, error } = await supabase
        .from("colleges")
        .select(
          `
          id, name, type, location, address, website, phone, email,
          established_year, accreditation, facilities, is_active,
          programs(name, stream, level, duration, eligibility, fees)
        `,
        )
        .eq("is_active", true)
        .limit(100); // Limit to prevent large downloads

      if (error) {
        console.error("Failed to fetch colleges:", error);
        return;
      }

      const offlineColleges = colleges.map((college) => ({
        ...(college as { [key: string]: unknown }),
        cached_at: new Date().toISOString(),
        last_synced: new Date().toISOString(),
      }));

      await offlineStorage.cacheColleges(offlineColleges as any);
    } catch (error) {
      console.error("Error refreshing colleges cache:", error);
    }
  }

  private async refreshScholarshipsCache(): Promise<void> {
    try {
      const { data: scholarships, error } = await supabase
        .from("scholarships")
        .select("*")
        .eq("is_active", true)
        .limit(50);

      if (error) {
        console.error("Failed to fetch scholarships:", error);
        return;
      }

      const offlineScholarships = scholarships.map((scholarship) => ({
        ...(scholarship as { [key: string]: unknown }),
        cached_at: new Date().toISOString(),
        last_synced: new Date().toISOString(),
      }));

      await offlineStorage.cacheScholarships(offlineScholarships as any);
    } catch (error) {
      console.error("Error refreshing scholarships cache:", error);
    }
  }

  private async refreshAwarenessContentCache(): Promise<void> {
    try {
      // This would fetch awareness content from your content management system
      // For now, we'll create some sample content
      const sampleContent = [
        {
          id: "awareness_1",
          title: "Career Guidance for Class 10 Students",
          content:
            "Choosing the right stream after Class 10 is crucial for your future career...",
          type: "career_guide" as const,
          category: "stream_selection",
          tags: ["class10", "stream", "career"],
          created_at: new Date().toISOString(),
          cached_at: new Date().toISOString(),
        },
        {
          id: "awareness_2",
          title: "Government Scholarship Programs",
          content:
            "Various government scholarship programs are available for students...",
          type: "faq" as const,
          category: "scholarships",
          tags: ["scholarship", "government", "financial_aid"],
          created_at: new Date().toISOString(),
          cached_at: new Date().toISOString(),
        },
      ];

      await offlineStorage.cacheAwarenessContent(sampleContent);
    } catch (error) {
      console.error("Error refreshing awareness content cache:", error);
    }
  }

  public async forceSync(): Promise<SyncResult> {
    // Force sync regardless of online status (for testing)
    const originalStatus = this.onlineStatus;
    this.onlineStatus = true;

    try {
      return await this.triggerSync();
    } finally {
      this.onlineStatus = originalStatus;
    }
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine();

// Export for testing
export { SyncEngine };
