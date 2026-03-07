import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from("colleges")
      .select("count")
      .limit(1);
    
    if (testError) {
      return NextResponse.json({
        success: false,
        error: testError.message,
        details: testError
      });
    }

    // Get actual college data
    const { data: colleges, error } = await supabase
      .from("colleges")
      .select("*")
      .limit(5);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    return NextResponse.json({
      success: true,
      count: colleges?.length || 0,
      sample: colleges,
      message: "Colleges table is accessible"
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
}
