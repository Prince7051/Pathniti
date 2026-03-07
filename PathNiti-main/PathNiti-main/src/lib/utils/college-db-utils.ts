/**
 * Database Utility Functions for College Profile Operations
 * Provides functions for CRUD operations on college profiles and related data
 */

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/client";
import { generateUniqueCollegeSlug } from "./slug-generator";
import type {
  CollegeProfileData,
  CollegeProfileCreateData,
  CollegeProfileUpdateData,
  Course,
  Notice,
} from "@/lib/types/college-profile";
import type {
  Database,
} from "@/lib/supabase/types";

type CollegeInsert = Database['public']['Tables']['colleges']['Insert'];
type CollegeUpdate = Database['public']['Tables']['colleges']['Update'];
type StudentApplicationInsert = Database['public']['Tables']['student_applications']['Insert'];
type StudentApplicationUpdate = Database['public']['Tables']['student_applications']['Update'];
type CollegeCourseInsert = Database['public']['Tables']['college_courses']['Insert'];
type CollegeNoticeInsert = Database['public']['Tables']['college_notices']['Insert'];

export interface StudentApplicationData {
  id?: string;
  student_id: string;
  college_id: string;
  full_name: string;
  email: string;
  phone: string;
  class_stream: string;
  documents: {
    marksheet_10th?: string;
    marksheet_12th?: string;
    other_documents?: string[];
  };
  status?: "pending" | "approved" | "rejected";
  feedback?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CollegeCourseCreateData {
  college_id: string;
  name: string;
  description?: string;
  duration?: string;
  eligibility?: string;
  fees?: {
    tuition: number;
    other: number;
    total: number;
  };
  seats?: number;
  is_active?: boolean;
}

export interface CollegeNoticeCreateData {
  college_id: string;
  title: string;
  content: string;
  type?: "general" | "admission" | "event" | "urgent";
  is_active?: boolean;
  published_at?: string;
  expires_at?: string;
}

/**
 * Create a new college profile
 */
export async function createCollegeProfile(
  profileData: CollegeProfileCreateData,
): Promise<{ data: CollegeProfileData | null; error: string | null }> {
  try {
    const client = createServiceClient();

    // Generate unique slug
    const slug = await generateUniqueCollegeSlug(profileData.name);

    const insertData: CollegeInsert = {
      ...profileData,
      slug,
      is_verified: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scholarships: profileData.scholarships?.map(scholarship => ({
        name: scholarship.name,
        amount: typeof scholarship.amount === 'string' ? parseFloat(scholarship.amount) || 0 : scholarship.amount || 0,
        eligibility: scholarship.eligibility,
        application_deadline: scholarship.application_deadline || ''
      })) || null,
      entrance_tests: profileData.entrance_tests?.map(test => ({
        exam_name: test.name,
        exam_date: test.exam_date || '',
        registration_deadline: test.registration_deadline || '',
        syllabus: test.syllabus_url ? [test.syllabus_url] : []
      })) || null,
      fee_structure: profileData.fee_structure ? {
        annual: profileData.fee_structure.tuition_fee,
        one_time_fees: {
          admission_fee: 0,
          library_fee: 0,
          lab_fee: 0
        }
      } : null,
    };

    const { data, error } = await (createServiceClient() as any)
      .from("colleges")
      .insert([insertData] as CollegeInsert[])
      .select(
        `
        *,
        college_courses(*),
        college_notices(*)
      `,
      )
      .single();

    if (error) {
      console.error("Error creating college profile:", error);
      return { data: null, error: error.message };
    }

    // Transform the data to match our interface
    const transformedData: CollegeProfileData = {
      ...(data as any),
      slug: (data as { slug?: string; [key: string]: unknown }).slug || "",
      courses: ((data as Record<string, unknown>).college_courses as Course[]) || [],
      notices: ((data as Record<string, unknown>).college_notices as Notice[]) || [],
      events: [], // Events will be added later when implemented
    };

    return { data: transformedData, error: null };
  } catch (err) {
    console.error("Unexpected error creating college profile:", err);
    return { data: null, error: "Failed to create college profile" };
  }
}

/**
 * Get college profile by slug
 */
export async function getCollegeBySlug(
  slug: string,
): Promise<{ data: CollegeProfileData | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const { data, error } = await client
      .from("colleges")
      .select(
        `
        *,
        college_courses(*),
        college_notices(*)
      `,
      )
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "College not found" };
      }
      console.error("Error fetching college by slug:", error);
      return { data: null, error: error.message };
    }

    // Transform the data to match our interface
    const transformedData: CollegeProfileData = {
      ...(data as any),
      slug: (data as { slug?: string; [key: string]: unknown }).slug || "",
      courses: ((data as Record<string, unknown>).college_courses as Course[]) || [],
      notices: ((data as Record<string, unknown>).college_notices as Notice[]) || [],
      events: [], // Events will be added later when implemented
    };

    return { data: transformedData, error: null };
  } catch (err) {
    console.error("Unexpected error fetching college by slug:", err);
    return { data: null, error: "Failed to fetch college profile" };
  }
}

/**
 * Update college profile
 */
export async function updateCollegeProfile(
  collegeId: string,
  updates: CollegeProfileUpdateData,
): Promise<{ data: CollegeProfileData | null; error: string | null }> {
  try {
    const client = createServiceClient();

    // If name is being updated, regenerate slug
    if (updates.name && !updates.slug) {
      updates.slug = await generateUniqueCollegeSlug(updates.name, collegeId);
    }

    const updateData: CollegeUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
      scholarships: updates.scholarships?.map(scholarship => ({
        name: scholarship.name,
        amount: typeof scholarship.amount === 'string' ? parseFloat(scholarship.amount) || 0 : scholarship.amount || 0,
        eligibility: scholarship.eligibility,
        application_deadline: scholarship.application_deadline || ''
      })) || undefined,
      entrance_tests: updates.entrance_tests?.map(test => ({
        exam_name: test.name,
        exam_date: test.exam_date || '',
        registration_deadline: test.registration_deadline || '',
        syllabus: test.syllabus_url ? [test.syllabus_url] : []
      })) || undefined,
      fee_structure: updates.fee_structure ? {
        annual: updates.fee_structure.tuition_fee,
        one_time_fees: {
          admission_fee: 0,
          library_fee: 0,
          lab_fee: 0
        }
      } : undefined,
    };

    const { data, error } = await (createServiceClient() as any)
      .from("colleges")
      .update(updateData as CollegeUpdate)
      .eq("id", collegeId)
      .select(
        `
        *,
        college_courses(*),
        college_notices(*)
      `,
      )
      .single();

    if (error) {
      console.error("Error updating college profile:", error);
      return { data: null, error: error.message };
    }

    // Transform the data to match our interface
    const transformedData: CollegeProfileData = {
      ...(data as any),
      slug: (data as { slug?: string; [key: string]: unknown }).slug || "",
      courses: ((data as Record<string, unknown>).college_courses as Course[]) || [],
      notices: ((data as Record<string, unknown>).college_notices as Notice[]) || [],
      events: [], // Events will be added later when implemented
    };

    return { data: transformedData, error: null };
  } catch (err) {
    console.error("Unexpected error updating college profile:", err);
    return { data: null, error: "Failed to update college profile" };
  }
}

/**
 * Get college courses
 */
export async function getCollegeCourses(
  collegeId: string,
): Promise<{ data: Course[] | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const { data, error } = await client
      .from("college_courses")
      .select("*")
      .eq("college_id", collegeId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching college courses:", error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error("Unexpected error fetching college courses:", err);
    return { data: null, error: "Failed to fetch college courses" };
  }
}

/**
 * Create college course
 */
export async function createCollegeCourse(
  courseData: CollegeCourseCreateData,
): Promise<{ data: Course | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const insertData: CollegeCourseInsert = {
      ...courseData,
      is_active: courseData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fees: courseData.fees ? {
        tuition_fee: courseData.fees.tuition,
        other_fees: courseData.fees.other,
        total_fee: courseData.fees.total,
        currency: 'INR'
      } : null,
    };

    const { data, error } = await (createServiceClient() as any)
      .from("college_courses")
      .insert([insertData] as CollegeCourseInsert[])
      .select()
      .single();

    if (error) {
      console.error("Error creating college course:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error creating college course:", err);
    return { data: null, error: "Failed to create college course" };
  }
}

/**
 * Update college course
 */
export async function updateCollegeCourse(
  courseId: string,
  updates: Partial<CollegeCourseCreateData>,
): Promise<{ data: Course | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (createServiceClient() as any)
      .from("college_courses")
      .update(updateData as Partial<CollegeCourseInsert>)
      .eq("id", courseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating college course:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error updating college course:", err);
    return { data: null, error: "Failed to update college course" };
  }
}

/**
 * Delete college course (soft delete)
 */
export async function deleteCollegeCourse(
  courseId: string,
): Promise<{ data: Course | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const { data, error } = await (createServiceClient() as any)
      .from("college_courses")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      } as Partial<CollegeCourseInsert>)
      .eq("id", courseId)
      .select()
      .single();

    if (error) {
      console.error("Error deleting college course:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error deleting college course:", err);
    return { data: null, error: "Failed to delete college course" };
  }
}

/**
 * Get all courses for a college (including inactive ones for admin)
 */
export async function getAllCollegeCourses(
  collegeId: string,
  includeInactive: boolean = false,
): Promise<{ data: Course[] | null; error: string | null }> {
  try {
    const client = createServiceClient();

    let query = client
      .from("college_courses")
      .select("*")
      .eq("college_id", collegeId)
      .order("name");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching all college courses:", error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error("Unexpected error fetching all college courses:", err);
    return { data: null, error: "Failed to fetch college courses" };
  }
}

/**
 * Get college notices
 */
export async function getCollegeNotices(
  collegeId: string,
): Promise<{ data: Notice[] | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const { data, error } = await client
      .from("college_notices")
      .select("*")
      .eq("college_id", collegeId)
      .eq("is_active", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching college notices:", error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error("Unexpected error fetching college notices:", err);
    return { data: null, error: "Failed to fetch college notices" };
  }
}

/**
 * Create college notice
 */
export async function createCollegeNotice(
  noticeData: CollegeNoticeCreateData,
): Promise<{ data: Notice | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const insertData: CollegeNoticeInsert = {
      ...noticeData,
      type: noticeData.type || "general",
      is_active: noticeData.is_active ?? true,
      published_at: noticeData.published_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (createServiceClient() as any)
      .from("college_notices")
      .insert([insertData] as CollegeNoticeInsert[])
      .select()
      .single();

    if (error) {
      console.error("Error creating college notice:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error creating college notice:", err);
    return { data: null, error: "Failed to create college notice" };
  }
}

/**
 * Create student application
 */
export async function createStudentApplication(
  applicationData: StudentApplicationData,
): Promise<{ data: StudentApplicationData | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const insertData: StudentApplicationInsert = {
      ...applicationData,
      status: applicationData.status || "pending",
      submitted_at: applicationData.submitted_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      documents: {
        academic_documents: applicationData.documents.marksheet_10th ? [applicationData.documents.marksheet_10th] : [],
        identity_documents: applicationData.documents.marksheet_12th ? [applicationData.documents.marksheet_12th] : [],
        other_documents: applicationData.documents.other_documents || []
      },
    };

    const { data, error } = await (createServiceClient() as any)
      .from("student_applications")
      .insert([insertData] as StudentApplicationInsert[])
      .select()
      .single();

    if (error) {
      console.error("Error creating student application:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error creating student application:", err);
    return { data: null, error: "Failed to create student application" };
  }
}

/**
 * Get student applications for a college
 */
export async function getCollegeApplications(
  collegeId: string,
  status?: "pending" | "approved" | "rejected",
): Promise<{ data: StudentApplicationData[] | null; error: string | null }> {
  try {
    const client = createServiceClient();

    let query = client
      .from("student_applications")
      .select("*")
      .eq("college_id", collegeId)
      .order("submitted_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching college applications:", error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error("Unexpected error fetching college applications:", err);
    return { data: null, error: "Failed to fetch college applications" };
  }
}

/**
 * Get student applications for a student
 */
export async function getStudentApplications(
  studentId: string,
): Promise<{
  data:
    | (StudentApplicationData & {
        college_name: string;
        college_slug: string;
      })[]
    | null;
  error: string | null;
}> {
  try {
    const client = createServiceClient();

    const { data, error } = await client
      .from("student_applications")
      .select(
        `
        *,
        colleges!inner(name, slug)
      `,
      )
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching student applications:", error);
      return { data: null, error: error.message };
    }

    // Transform the data to include college info
    const transformedData =
      data?.map((app: Record<string, unknown>) => ({
        ...app,
        college_name: (app.colleges as Record<string, unknown>).name as string,
        college_slug: (app.colleges as Record<string, unknown>).slug as string || "",
      })) as (StudentApplicationData & { college_name: string; college_slug: string })[] || [];

    return { data: transformedData, error: null };
  } catch (err) {
    console.error("Unexpected error fetching student applications:", err);
    return { data: null, error: "Failed to fetch student applications" };
  }
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: "pending" | "approved" | "rejected",
  feedback?: string,
  reviewerId?: string,
): Promise<{ data: StudentApplicationData | null; error: string | null }> {
  try {
    const client = createServiceClient();

    const updates: StudentApplicationUpdate = {
      status,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (feedback) {
      updates.feedback = feedback;
    }

    if (reviewerId) {
      updates.reviewed_by = reviewerId;
    }

    const { data, error } = await (createServiceClient() as any)
      .from("student_applications")
      .update(updates as StudentApplicationUpdate)
      .eq("id", applicationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating application status:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error updating application status:", err);
    return { data: null, error: "Failed to update application status" };
  }
}

/**
 * Get all colleges with basic info for listing
 * This function should only be used server-side or with proper authentication
 */
export async function getAllColleges(): Promise<{
  data: CollegeProfileData[] | null;
  error: string | null;
}> {
  try {
    // Use regular client instead of service client for client-side compatibility
    const client = createClient();

    const { data, error } = await client
      .from("colleges")
      .select(
        `
        *,
        college_courses(*),
        college_notices(*)
      `,
      )
      .eq("is_active", true) // Only fetch active colleges
      .order("name");

    if (error) {
      console.error("Error fetching all colleges:", error);
      return { data: null, error: error.message };
    }

    // Transform the data to match our interface
    const transformedData: CollegeProfileData[] =
      data?.map((college: Record<string, unknown>) => ({
        ...(college as any),
        slug: college.slug as string || "",
        courses: ((college as Record<string, unknown>).college_courses as Course[]) || [],
        notices: ((college as Record<string, unknown>).college_notices as Notice[]) || [],
        events: [], // Events will be added later when implemented
      })) || [];

    return { data: transformedData, error: null };
  } catch (err) {
    console.error("Unexpected error fetching all colleges:", err);
    return { data: null, error: "Failed to fetch colleges" };
  }
}
