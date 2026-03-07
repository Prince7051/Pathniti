import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  normalizePaginationParams,
  createPaginationResult,
} from "@/lib/utils/pagination";
import { applicationCache, CacheKeys } from "@/lib/services/cache-service";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Return mock applications data for development
    const mockApplications = [
      {
        id: "1",
        full_name: "John Doe",
        email: "john.doe@example.com",
        phone: "+91 9876543210",
        class_stream: "Computer Science Engineering",
        status: "pending",
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        feedback: null,
        documents: ["resume.pdf", "marksheet.pdf"],
        profiles: {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com"
        }
      },
      {
        id: "2",
        full_name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+91 9876543211",
        class_stream: "Mechanical Engineering",
        status: "approved",
        submitted_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        reviewed_at: new Date().toISOString(),
        feedback: "Excellent academic record and strong motivation.",
        documents: ["resume.pdf", "marksheet.pdf", "certificates.pdf"],
        profiles: {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane.smith@example.com"
        }
      },
      {
        id: "3",
        full_name: "Mike Johnson",
        email: "mike.johnson@example.com",
        phone: "+91 9876543212",
        class_stream: "Electronics and Communication Engineering",
        status: "rejected",
        submitted_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        reviewed_at: new Date().toISOString(),
        feedback: "Does not meet minimum eligibility criteria.",
        documents: ["resume.pdf", "marksheet.pdf"],
        profiles: {
          first_name: "Mike",
          last_name: "Johnson",
          email: "mike.johnson@example.com"
        }
      }
    ];

    const result = {
      applications: mockApplications,
      pagination: {
        page,
        limit,
        total: mockApplications.length,
        totalPages: Math.ceil(mockApplications.length / limit),
        hasNext: false,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in college applications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Fallback implementation using original logic
async function getFallbackApplications(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  // Get current user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get college information
  const { data: collegeProfile } = await supabase
    .from("college_profiles")
    .select(
      `
      college_id,
      colleges!inner (
        id,
        name
      )
    `,
    )
    .eq("id", session!.user.id)
    .single();

  const college = {
    id: collegeProfile!.college_id,
    name: (collegeProfile!.colleges as { name?: string })?.name || "Unknown College",
  };

  // Parse query parameters
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const { page, limit, offset } = normalizePaginationParams(
    searchParams.get("page") || undefined,
    searchParams.get("limit") || undefined,
    50,
  );

  // Build optimized query with better indexing
  let query = supabase
    .from("student_applications")
    .select(
      `
      id,
      full_name,
      email,
      phone,
      class_stream,
      status,
      submitted_at,
      reviewed_at,
      feedback,
      documents,
      profiles!student_applications_student_id_fkey (
        first_name,
        last_name,
        email
      )
    `,
    )
    .eq("college_id", college.id)
    .order("submitted_at", { ascending: false });

  // Apply filters
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  // Apply pagination
  query = query.range(offset!, offset! + limit - 1);

  const { data: applications, error: applicationsError } = await query;

  if (applicationsError) {
    throw applicationsError;
  }

  // Get total count
  let countQuery = supabase
    .from("student_applications")
    .select("*", { count: "exact", head: true })
    .eq("college_id", college.id);

  if (status && status !== "all") {
    countQuery = countQuery.eq("status", status);
  }

  if (search) {
    countQuery = countQuery.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    throw countError;
  }

  const result = createPaginationResult(
    applications || [],
    page,
    limit,
    count || 0,
  );

  return NextResponse.json({
    applications: result.data,
    pagination: result.pagination,
  });
}
