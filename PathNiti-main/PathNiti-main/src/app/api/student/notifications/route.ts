import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from '@/lib/supabase/types';

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.then(store => store.getAll());
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.then(store => store.set(name, value, options)),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    let userId: string;

    if (userIdParam) {
      // If userId is provided as query parameter, use it directly
      userId = userIdParam;
    } else {
      // Otherwise, get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = user.id;
    }

    // Verify user is a student (only if we have a valid userId)
    // Skip profile check for performance if no userId
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, first_name, last_name")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error for user:", userId, profileError);
        return NextResponse.json(
          { 
            error: "Profile not found or access denied.", 
            details: profileError.message,
            userId: userId 
          },
          { status: 403 },
        );
      }

      // If no profile data, return empty notifications
      if (!profile) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }


      if ((profile as { role?: string }).role !== "student") {
        console.error("User role mismatch. Expected 'student', got:", (profile as { role?: string }).role, "for user:", userId);
        return NextResponse.json(
          { 
            error: "Access denied. Student role required.", 
            currentRole: (profile as { role?: string }).role,
            userId: userId 
          },
          { status: 403 },
        );
      }
    } else {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Fetch notifications for the user
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(50); // Limit to recent 50 notifications

    if (notificationsError) {
      console.error("Error fetching notifications:", notificationsError);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: notifications || [],
    });
  } catch (error) {
    console.error("Unexpected error in student notifications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
