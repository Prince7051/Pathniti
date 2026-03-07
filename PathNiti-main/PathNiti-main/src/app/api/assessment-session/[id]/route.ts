/**
 * Get Assessment Session Data
 * Retrieves assessment session information by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get assessment session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Assessment session not found" },
        { status: 404 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, age, class_level, stream, state, city")
      .eq("id", (session as any).user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Get assessment responses
    const { data: responses, error: responsesError } = await supabase
      .from("assessment_responses")
      .select("*")
      .eq("session_id", id);

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
    }

    return NextResponse.json({
      ...(session as any),
      user_profile: profile,
      responses: responses || [],
    });
  } catch (error) {
    console.error("Error fetching assessment session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
