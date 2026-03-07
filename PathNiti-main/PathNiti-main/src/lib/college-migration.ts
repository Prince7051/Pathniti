import { createClient } from "@supabase/supabase-js";

export interface CollegeData {
  college_id: string;
  name: string;
  address: string;
  pin_code?: string;
  streams_offered: string[];
  admission_criteria: string;
  fee_structure: {
    tuition_fee?: number;
    hostel_fee?: number;
    other_fees?: number;
    currency: string;
  };
  admission_open_date?: string;
  admission_close_date?: string;
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
  };
  verified: boolean;
  last_verified_at?: string;
}

export class CollegeMigrationService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  // Migrate mock college data to database
  async migrateMockColleges(): Promise<void> {
    const mockColleges: CollegeData[] = [
      {
        college_id: "college-001",
        name: "Delhi University",
        address: "University of Delhi, Delhi, 110007",
        pin_code: "110007",
        streams_offered: ["arts", "science", "commerce", "engineering"],
        admission_criteria: "Based on Class 12 marks and entrance exam",
        fee_structure: {
          tuition_fee: 50000,
          hostel_fee: 30000,
          other_fees: 10000,
          currency: "INR",
        },
        admission_open_date: "2024-03-01",
        admission_close_date: "2024-06-30",
        contact_info: {
          phone: "+91-11-27667011",
          email: "info@du.ac.in",
          website: "https://du.ac.in",
        },
        verified: true,
        last_verified_at: new Date().toISOString(),
      },
      {
        college_id: "college-002",
        name: "Jawaharlal Nehru University",
        address: "JNU, New Delhi, 110067",
        pin_code: "110067",
        streams_offered: ["arts", "science", "social_sciences", "languages"],
        admission_criteria: "JNUEE entrance exam",
        fee_structure: {
          tuition_fee: 30000,
          hostel_fee: 20000,
          other_fees: 5000,
          currency: "INR",
        },
        admission_open_date: "2024-02-01",
        admission_close_date: "2024-05-31",
        contact_info: {
          phone: "+91-11-26704000",
          email: "info@jnu.ac.in",
          website: "https://jnu.ac.in",
        },
        verified: true,
        last_verified_at: new Date().toISOString(),
      },
      {
        college_id: "college-003",
        name: "IIT Delhi",
        address: "Hauz Khas, New Delhi, 110016",
        pin_code: "110016",
        streams_offered: ["engineering"],
        admission_criteria: "JEE Advanced rank",
        fee_structure: {
          tuition_fee: 200000,
          hostel_fee: 50000,
          other_fees: 25000,
          currency: "INR",
        },
        admission_open_date: "2024-01-01",
        admission_close_date: "2024-04-30",
        contact_info: {
          phone: "+91-11-26591735",
          email: "info@iitd.ac.in",
          website: "https://iitd.ac.in",
        },
        verified: true,
        last_verified_at: new Date().toISOString(),
      },
      {
        college_id: "college-004",
        name: "University of Mumbai",
        address: "Mumbai, Maharashtra, 400001",
        pin_code: "400001",
        streams_offered: ["arts", "science", "commerce", "engineering"],
        admission_criteria: "Based on Class 12 marks",
        fee_structure: {
          tuition_fee: 40000,
          hostel_fee: 25000,
          other_fees: 8000,
          currency: "INR",
        },
        admission_open_date: "2024-03-15",
        admission_close_date: "2024-07-15",
        contact_info: {
          phone: "+91-22-22708700",
          email: "info@mu.ac.in",
          website: "https://mu.ac.in",
        },
        verified: true,
        last_verified_at: new Date().toISOString(),
      },
      {
        college_id: "college-005",
        name: "Anna University",
        address: "Chennai, Tamil Nadu, 600025",
        pin_code: "600025",
        streams_offered: ["engineering", "science"],
        admission_criteria: "TNEA entrance exam",
        fee_structure: {
          tuition_fee: 150000,
          hostel_fee: 40000,
          other_fees: 15000,
          currency: "INR",
        },
        admission_open_date: "2024-02-15",
        admission_close_date: "2024-06-15",
        contact_info: {
          phone: "+91-44-22351723",
          email: "info@annauniv.edu",
          website: "https://annauniv.edu",
        },
        verified: true,
        last_verified_at: new Date().toISOString(),
      },
    ];

    try {
      // Check if colleges already exist
      const { data: existingColleges, error: checkError } = await this.supabase
        .from("colleges_enhanced")
        .select("college_id")
        .in(
          "college_id",
          mockColleges.map((c) => c.college_id),
        );

      if (checkError) {
        throw new Error(
          `Failed to check existing colleges: ${checkError.message}`,
        );
      }

      const existingIds = existingColleges?.map((c: { college_id: string }) => c.college_id) || [];
      const newColleges = mockColleges.filter(
        (c) => !existingIds.includes(c.college_id),
      );

      if (newColleges.length > 0) {
        const { error: insertError } = await (this.supabase as any)
          .from("colleges_enhanced")
          .insert(newColleges);

        if (insertError) {
          throw new Error(`Failed to insert colleges: ${insertError.message}`);
        }

        console.log(
          `Successfully migrated ${newColleges.length} colleges to database`,
        );
      } else {
        console.log("All mock colleges already exist in database");
      }
    } catch (error) {
      console.error("Error migrating mock colleges:", error);
      throw error;
    }
  }

  // Get colleges from database (replaces mock data)
  async getColleges(filters?: {
    streams?: string[];
    verified?: boolean;
    limit?: number;
  }): Promise<CollegeData[]> {
    try {
      let query = this.supabase
        .from("colleges_enhanced")
        .select("*")
        .order("name");

      if (filters?.verified !== undefined) {
        query = query.eq("verified", filters.verified);
      }

      if (filters?.streams && filters.streams.length > 0) {
        query = query.overlaps("streams_offered", filters.streams);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: colleges, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch colleges: ${error.message}`);
      }

      return colleges || [];
    } catch (error) {
      console.error("Error fetching colleges:", error);
      throw error;
    }
  }

  // Update college data
  async updateCollege(
    collegeId: string,
    updates: Partial<CollegeData>,
  ): Promise<void> {
    try {
      const { error } = await (this.supabase as any)
        .from("colleges_enhanced")
        .update({
          ...updates,
          last_verified_at: new Date().toISOString(),
        })
        .eq("college_id", collegeId);

      if (error) {
        throw new Error(`Failed to update college: ${error.message}`);
      }

      console.log(`Successfully updated college ${collegeId}`);
    } catch (error) {
      console.error("Error updating college:", error);
      throw error;
    }
  }

  // Verify college
  async verifyCollege(collegeId: string, verified: boolean): Promise<void> {
    try {
      const { error } = await (this.supabase as any)
        .from("colleges_enhanced")
        .update({
          verified,
          last_verified_at: new Date().toISOString(),
        })
        .eq("college_id", collegeId);

      if (error) {
        throw new Error(`Failed to verify college: ${error.message}`);
      }

      console.log(
        `Successfully ${verified ? "verified" : "unverified"} college ${collegeId}`,
      );
    } catch (error) {
      console.error("Error verifying college:", error);
      throw error;
    }
  }

  // Search colleges
  async searchColleges(
    searchTerm: string,
    filters?: {
      streams?: string[];
      verified?: boolean;
    },
  ): Promise<CollegeData[]> {
    try {
      let query = this.supabase
        .from("colleges_enhanced")
        .select("*")
        .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);

      if (filters?.verified !== undefined) {
        query = query.eq("verified", filters.verified);
      }

      if (filters?.streams && filters.streams.length > 0) {
        query = query.overlaps("streams_offered", filters.streams);
      }

      const { data: colleges, error } = await query;

      if (error) {
        throw new Error(`Failed to search colleges: ${error.message}`);
      }

      return colleges || [];
    } catch (error) {
      console.error("Error searching colleges:", error);
      throw error;
    }
  }
}
