import { createServiceClient } from "@/lib/supabase/service";

export interface ChatSession {
  id: string;
  user_id: string;
  session_name: string;
  status: "active" | "archived" | "deleted";
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message_type: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  parent_message_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface SarthiInteraction {
  id: string;
  session_id: string;
  message_id: string;
  capability_used: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  confidence_score?: number;
  processing_time_ms: number;
  user_feedback?: string;
  created_at: string;
}

export class ChatSessionManager {
  private supabase = createServiceClient();

  /**
   * Create a new chat session
   */
  async createSession(
    userId: string,
    sessionName: string = "Chat with Sarthi",
  ): Promise<ChatSession> {
    const { data, error } = await (this.supabase as any)
      .from("conversation_sessions")
      .insert({
        user_id: userId,
        session_name: sessionName,
        context: {
          created_via: "chat_interface",
          user_preferences: {},
        },
        metadata: {
          device_info:
            typeof window !== "undefined"
              ? {
                  user_agent:
                    typeof window !== "undefined"
                      ? navigator.userAgent
                      : "unknown",
                  language:
                    typeof window !== "undefined" ? navigator.language : "en",
                }
              : {},
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's active chat sessions
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await this.supabase
      .from("conversation_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("last_activity_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user sessions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get messages for a specific session
   */
  async getSessionMessages(
    sessionId: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from("conversation_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch session messages: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add a message to a session
   */
  async addMessage(
    sessionId: string,
    messageType: "user" | "assistant" | "system",
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<ChatMessage> {
    const { data, error } = await (this.supabase as any)
      .from("conversation_messages")
      .insert({
        session_id: sessionId,
        message_type: messageType,
        content,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return data;
  }

  /**
   * Log a Sarthi interaction for analytics
   */
  async logInteraction(
    sessionId: string,
    messageId: string,
    capabilityUsed: string,
    inputData: Record<string, unknown>,
    outputData: Record<string, unknown>,
    confidenceScore?: number,
    processingTimeMs: number = 0,
  ): Promise<SarthiInteraction> {
    const { data, error } = await (this.supabase as any)
      .from("sarthi_interactions")
      .insert({
        session_id: sessionId,
        message_id: messageId,
        capability_used: capabilityUsed,
        input_data: inputData,
        output_data: outputData,
        confidence_score: confidenceScore,
        processing_time_ms: processingTimeMs,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log interaction: ${error.message}`);
    }

    return data;
  }

  /**
   * Update session context
   */
  async updateSessionContext(sessionId: string, context: Record<string, unknown>): Promise<void> {
      const { error } = await (this.supabase as any)
      .from("conversation_sessions")
      .update({
        context,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      throw new Error(`Failed to update session context: ${error.message}`);
    }
  }

  /**
   * Archive a session
   */
  async archiveSession(sessionId: string): Promise<void> {
      const { error } = await (this.supabase as any)
      .from("conversation_sessions")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      throw new Error(`Failed to archive session: ${error.message}`);
    }
  }

  /**
   * Get conversation history for context
   */
  async getConversationContext(
    sessionId: string,
    messageLimit: number = 10,
  ): Promise<{
    messages: ChatMessage[];
    context: Record<string, unknown>;
  }> {
    const [messages, session] = await Promise.all([
      this.getSessionMessages(sessionId, messageLimit),
      this.getSession(sessionId),
    ]);

    return {
      messages,
      context: session?.context || {},
    };
  }

  /**
   * Get a specific session
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await this.supabase
      .from("conversation_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Session not found
      }
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user feedback on a response
   */
  async addUserFeedback(
    interactionId: string,
    feedback: string,
  ): Promise<void> {
      const { error } = await (this.supabase as any)
      .from("sarthi_interactions")
      .update({
        user_feedback: feedback,
      })
      .eq("id", interactionId);

    if (error) {
      throw new Error(`Failed to add user feedback: ${error.message}`);
    }
  }

  /**
   * Get analytics data for admin
   */
  async getAnalyticsData(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalInteractions: number;
    capabilityUsage: { [key: string]: number };
    averageConfidence: number;
    averageProcessingTime: number;
  }> {
    let query = this.supabase.from("sarthi_interactions").select("*");

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: interactions, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch analytics data: ${error.message}`);
    }

    const totalInteractions = interactions?.length || 0;
    const capabilityUsage: { [key: string]: number } = {};
    let totalConfidence = 0;
    let totalProcessingTime = 0;
    let confidenceCount = 0;

    interactions?.forEach((interaction: unknown) => {
      // Count capability usage
      const interactionData = interaction as { capability_used?: string; confidence_score?: number; processing_time_ms?: number };
      capabilityUsage[interactionData.capability_used || 'unknown'] =
        (capabilityUsage[interactionData.capability_used || 'unknown'] || 0) + 1;

      // Calculate averages
      if (interactionData.confidence_score) {
        totalConfidence += interactionData.confidence_score;
        confidenceCount++;
      }
      totalProcessingTime += interactionData.processing_time_ms || 0;
    });

    // Get session and message counts
    const { count: sessionCount } = await this.supabase
      .from("conversation_sessions")
      .select("*", { count: "exact", head: true });

    const { count: messageCount } = await this.supabase
      .from("conversation_messages")
      .select("*", { count: "exact", head: true });

    return {
      totalSessions: sessionCount || 0,
      totalMessages: messageCount || 0,
      totalInteractions,
      capabilityUsage,
      averageConfidence:
        confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      averageProcessingTime:
        totalInteractions > 0 ? totalProcessingTime / totalInteractions : 0,
    };
  }
}

// Export singleton instance
export const chatSessionManager = new ChatSessionManager();
