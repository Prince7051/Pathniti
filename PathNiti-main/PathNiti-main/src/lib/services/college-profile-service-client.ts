/**
 * College Profile Service - Client Side
 * Client-side version that uses the regular Supabase client instead of service client
 */

import { createClient } from "@/lib/supabase/client";
import type { CollegeProfileData } from "@/lib/types/college-profile";

export class CollegeProfileServiceClient {
  private supabase = createClient();

  async getProfileBySlug(slug: string): Promise<{
    data: CollegeProfileData | null;
    error: string | null;
  }> {
    try {
      // Handle special case for college management
      if (slug === 'manage') {
        // Use the college management endpoint
        const response = await fetch('/api/colleges/manage/', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return { data: null, error: "Authentication required. Please log in to access college management." };
          }
          if (response.status === 403) {
            return { data: null, error: "Access denied. You need college role to access management." };
          }
          const errorText = await response.text();
          console.error("Error fetching college management data:", errorText);
          return { data: null, error: `HTTP ${response.status}: ${errorText}` };
        }

        const result = await response.json();
        
        if (result.error) {
          console.error("Error fetching college management data:", result.error);
          return { data: null, error: result.error };
        }

        // Transform the management data to match CollegeProfileData interface
        const collegeData: CollegeProfileData = {
          ...result.college,
          slug: result.college.slug || 'manage',
          courses: result.college.courses || [],
          notices: result.college.notices || [],
          events: result.college.events || [],
        };

        return { data: collegeData, error: null };
      }

      // Use API route instead of direct database access
      const response = await fetch(`/api/colleges/${slug}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return { data: null, error: "College not found" };
        }
        if (response.status === 401) {
          return { data: null, error: "Authentication required. Please log in to access this college." };
        }
        if (response.status === 403) {
          return { data: null, error: "Access denied. You don't have permission to view this college." };
        }
        const errorText = await response.text();
        console.error("Error fetching college by slug:", errorText);
        return { data: null, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      
      if (result.error) {
        console.error("Error fetching college by slug:", result.error);
        return { data: null, error: result.error };
      }

      return { data: result.data, error: null };
    } catch (error) {
      console.error("Unexpected error fetching college by slug:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  async getAllColleges(): Promise<{
    data: CollegeProfileData[] | null;
    error: string | null;
  }> {
    try {
      // Use API route instead of direct database access
        const response = await fetch('/api/colleges/', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching colleges:", errorText);
        return { data: null, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      
      if (result.error) {
        console.error("Error fetching colleges:", result.error);
        return { data: null, error: result.error };
      }

      return { data: result.data, error: null };
    } catch (error) {
      console.error("Unexpected error fetching colleges:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

// Export singleton instance
export const collegeProfileServiceClient = new CollegeProfileServiceClient();
