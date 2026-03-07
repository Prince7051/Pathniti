/**
 * Sarthi AI Recommendations API
 * Enhanced career guidance with parental mindset awareness and ROI calculations
 * Always uses Gemini free tier for cost-effective operation
 */

import { NextRequest, NextResponse } from "next/server";
import { sarthiAI, type SarthiUserProfile } from "@/lib/sarthi-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_profile, request_type = "full_recommendation" } = body;

    if (!user_profile) {
      return NextResponse.json(
        { error: "User profile is required" },
        { status: 400 },
      );
    }

    // Validate and structure user profile
    const sarthiProfile: SarthiUserProfile = {
      user_id: user_profile.user_id || "anonymous",
      age: user_profile.age,
      class_level: user_profile.class_level,
      current_stream: user_profile.stream,
      interests: user_profile.interests || [],
      aptitude_results:
        user_profile.quiz_scores || user_profile.aptitude_results,
      location: {
        state: user_profile.location?.state || "Jammu and Kashmir",
        city: user_profile.location?.city,
        district: user_profile.location?.district,
      },
      family_background: {
        income_range: user_profile.family_income
          ? user_profile.family_income < 300000
            ? "low"
            : user_profile.family_income < 800000
              ? "middle"
              : "high"
          : "middle",
        parent_education: user_profile.parent_education,
        parent_occupation: user_profile.parent_occupation,
        family_expectations: user_profile.family_expectations || [
          "job_security",
          "good_salary",
        ],
      },
      quiz_scores: user_profile.quiz_scores,
      personality_traits: user_profile.personality_traits,
      concerns: user_profile.concerns || ["earning_potential", "job_security"],
    };

    let recommendations;

    switch (request_type) {
      case "full_recommendation":
        recommendations =
          await sarthiAI.getEnhancedRecommendations(sarthiProfile);

        // Add nearby colleges for the primary recommendation
        if (recommendations.primary_recommendation) {
          const nearbyColleges = await sarthiAI.getNearbyCollegesForStream(
            sarthiProfile,
            recommendations.primary_recommendation.stream,
          );
          recommendations.primary_recommendation.nearby_colleges =
            nearbyColleges.slice(0, 5);
        }
        break;

      case "stream_comparison":
        // Compare specific streams requested by user/parent
        const streamsToCompare = body.streams || [
          "science",
          "commerce",
          "arts",
        ];
        const streamRecommendations =
          await sarthiAI.getEnhancedRecommendations(sarthiProfile);

        recommendations = {
          comparison: streamsToCompare
            .map((stream: string) => {
              const streamRec =
                streamRecommendations.alternatives.find(
                  (r) => r.stream === stream,
                ) ||
                (streamRecommendations.primary_recommendation.stream === stream
                  ? streamRecommendations.primary_recommendation
                  : null);
              return streamRec;
            })
            .filter(Boolean),
          summary: `Detailed comparison of ${streamsToCompare.join(", ")} streams based on your profile and ROI analysis.`,
        };
        break;

      case "quick_advice":
        // Quick advice for specific questions
        // const question = body.question || ''; // Unused variable
        recommendations =
          await sarthiAI.getEnhancedRecommendations(sarthiProfile);
        (recommendations as typeof recommendations & { quick_response: string }).quick_response = `Based on your profile, ${recommendations.parent_friendly_summary}`;
        break;

      default:
        recommendations =
          await sarthiAI.getEnhancedRecommendations(sarthiProfile);
    }

    // Add metadata
    const response = {
      success: true,
      recommendations,
      metadata: {
        timestamp: new Date().toISOString(),
        user_location: sarthiProfile.location,
        recommendation_confidence:
          recommendations.primary_recommendation?.confidence || 0,
        ai_enhanced: true,
        sarthi_version: "1.0",
        gemini_free_tier: true,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in Sarthi recommendations API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to generate recommendations. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Sarthi AI Recommendations API",
    version: "1.0",
    endpoints: {
      POST: {
        "/api/sarthi/recommendations":
          "Get comprehensive career recommendations",
        body: {
          user_profile:
            "User profile with interests, aptitude, family background",
          request_type:
            "full_recommendation | stream_comparison | quick_advice",
        },
      },
    },
    features: [
      "Parental mindset awareness",
      "ROI analysis with earning timelines",
      "Stream comparison with pros/cons",
      "J&K specific scholarship information",
      "Nearby college recommendations",
      "Government job opportunity analysis",
      "Fast earning career path identification",
    ],
  });
}
