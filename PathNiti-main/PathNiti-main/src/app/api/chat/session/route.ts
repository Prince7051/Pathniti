import { NextRequest, NextResponse } from "next/server";
// import { createServiceClient } from "@/lib/supabase/service"; // Temporarily disabled

export async function POST(request: NextRequest) {
  try {
    const { user_id, session_name = "Chat with Sarthi" } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // const supabase = createServiceClient(); // Temporarily disabled

    // Create new conversation session
    // Temporarily disabled - conversation_sessions table not defined in schema
    // const { data: session, error } = await supabase
    //   .from("conversation_sessions")
    //   .insert({
    //     user_id,
    //     session_name,
    //     context: {
    //       created_via: "chat_interface",
    //       user_agent: request.headers.get("user-agent"),
    //     },
    //     metadata: {
    //       ip_address:
    //         request.headers.get("x-forwarded-for") ||
    //         request.headers.get("x-real-ip"),
    //     },
    //   })
    //   .select()
    //   .single();

    // if (error) {
    //   console.error("Error creating conversation session:", error);
    //   return NextResponse.json(
    //     { error: "Failed to create chat session" },
    //     { status: 500 },
    //   );
    // }
    
    const session = { 
      id: "temp-session-id", 
      session_name, 
      created_at: new Date().toISOString() 
    }; // Temporary placeholder

    return NextResponse.json({
      success: true,
      session_id: session.id,
      session_name: session.session_name,
      created_at: session.created_at,
    });
  } catch (error) {
    console.error("Error in chat session creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // const supabase = createServiceClient(); // Temporarily disabled

    // Get user's conversation sessions
    // Temporarily disabled - conversation_sessions table not defined in schema
    // const { data: sessions, error } = await supabase
    //   .from("conversation_sessions")
    //   .select(
    //     `
    //     id,
    //     session_name,
    //     status,
    //     created_at,
    //     last_activity_at,
    //     context,
    //     metadata
    //   `,
    //   )
    //   .eq("user_id", user_id)
    //   .eq("status", "active")
    //   .order("last_activity_at", { ascending: false });

    // if (error) {
    //   console.error("Error fetching conversation sessions:", error);
    //   return NextResponse.json(
    //     { error: "Failed to fetch chat sessions" },
    //     { status: 500 },
    //   );
    // }
    
    const sessions: unknown[] = []; // Temporary placeholder - empty array

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
    });
  } catch (error) {
    console.error("Error in chat session fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
