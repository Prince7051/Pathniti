/**
 * Test Script for AI Recommendation System
 * Tests the recommendation logic with sample student data
 */

// Sample test data for different student profiles
const testProfiles = [
  {
    name: "Science-Oriented Student",
    description: "Strong in math and science, weak in arts",
    userProfile: {
      user_id: "test-science-001",
      basic_info: {
        age: 16,
        class_level: "10th",
        current_stream: null,
        location: { state: "Delhi", city: "New Delhi" }
      },
      assessment_results: {
        aptitude_scores: {
          logical_reasoning: 0.9,
          quantitative_skills: 0.95,
          language_verbal_skills: 0.6,
          spatial_visual_skills: 0.7,
          memory_attention: 0.8
        },
        riasec_scores: {
          realistic: 0.8,
          investigative: 0.9,
          artistic: 0.3,
          social: 0.5,
          enterprising: 0.6,
          conventional: 0.7
        },
        personality_scores: {
          introvert_extrovert: 0.4,
          risk_taking_vs_risk_averse: 0.3,
          structured_vs_flexible: 0.2,
          leadership_vs_supportive: 0.6
        },
        subject_performance: {
          science_aptitude: { accuracy: 0.9, speed: 0.8 },
          math_aptitude: { accuracy: 0.95, speed: 0.7 },
          logical_reasoning: { accuracy: 0.85, speed: 0.9 },
          general_knowledge: { accuracy: 0.7, speed: 0.6 }
        },
        practical_constraints: {
          location: "Delhi",
          financial_background: "middle",
          parental_expectation: "engineer"
        }
      },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: "Arts-Oriented Student",
    description: "Strong in language and social skills, weak in math",
    userProfile: {
      user_id: "test-arts-001",
      basic_info: {
        age: 16,
        class_level: "10th",
        current_stream: null,
        location: { state: "Delhi", city: "New Delhi" }
      },
      assessment_results: {
        aptitude_scores: {
          logical_reasoning: 0.5,
          quantitative_skills: 0.3,
          language_verbal_skills: 0.9,
          spatial_visual_skills: 0.6,
          memory_attention: 0.8
        },
        riasec_scores: {
          realistic: 0.3,
          investigative: 0.4,
          artistic: 0.9,
          social: 0.8,
          enterprising: 0.7,
          conventional: 0.5
        },
        personality_scores: {
          introvert_extrovert: 0.7,
          risk_taking_vs_risk_averse: 0.6,
          structured_vs_flexible: 0.8,
          leadership_vs_supportive: 0.4
        },
        subject_performance: {
          science_aptitude: { accuracy: 0.4, speed: 0.5 },
          math_aptitude: { accuracy: 0.3, speed: 0.4 },
          logical_reasoning: { accuracy: 0.5, speed: 0.6 },
          general_knowledge: { accuracy: 0.8, speed: 0.7 }
        },
        practical_constraints: {
          location: "Delhi",
          financial_background: "middle",
          parental_expectation: "any"
        }
      },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: "Commerce-Oriented Student",
    description: "Good with numbers and business, moderate in other areas",
    userProfile: {
      user_id: "test-commerce-001",
      basic_info: {
        age: 16,
        class_level: "10th",
        current_stream: null,
        location: { state: "Delhi", city: "New Delhi" }
      },
      assessment_results: {
        aptitude_scores: {
          logical_reasoning: 0.7,
          quantitative_skills: 0.8,
          language_verbal_skills: 0.7,
          spatial_visual_skills: 0.5,
          memory_attention: 0.8
        },
        riasec_scores: {
          realistic: 0.5,
          investigative: 0.6,
          artistic: 0.4,
          social: 0.6,
          enterprising: 0.8,
          conventional: 0.9
        },
        personality_scores: {
          introvert_extrovert: 0.5,
          risk_taking_vs_risk_averse: 0.4,
          structured_vs_flexible: 0.3,
          leadership_vs_supportive: 0.6
        },
        subject_performance: {
          science_aptitude: { accuracy: 0.6, speed: 0.6 },
          math_aptitude: { accuracy: 0.8, speed: 0.7 },
          logical_reasoning: { accuracy: 0.7, speed: 0.8 },
          general_knowledge: { accuracy: 0.7, speed: 0.7 }
        },
        practical_constraints: {
          location: "Delhi",
          financial_background: "middle",
          parental_expectation: "business"
        }
      },
      timestamp: new Date().toISOString()
    }
  }
];

// Function to test the recommendation system
async function testRecommendationSystem() {
  console.log("🧪 Testing AI Recommendation System");
  console.log("=" .repeat(50));
  
  for (const testCase of testProfiles) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log("-".repeat(40));
    
    try {
      // Make API call to test the recommendation system
      const response = await fetch('http://localhost:3000/api/career-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: testCase.userProfile.user_id,
          student_class: "10th",
          assessment_data: testCase.userProfile.assessment_results,
          test_performance: {
            total_questions: 30,
            answered_questions: 30,
            correct_answers: 25,
            total_time_seconds: 1800,
            responses: []
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log("✅ Recommendation Results:");
      console.log(`🎯 Primary Recommendation: ${result.recommended_path[0]?.stream_or_course || 'None'}`);
      console.log(`📈 Confidence Score: ${(result.recommended_path[0]?.confidence_score * 100 || 0).toFixed(1)}%`);
      console.log(`💭 Reasoning: ${result.recommended_path[0]?.reasoning || 'No reasoning provided'}`);
      
      if (result.recommended_path.length > 1) {
        console.log(`🔄 Alternative Options: ${result.recommended_path.length - 1}`);
        result.recommended_path.slice(1).forEach((rec, index) => {
          console.log(`   ${index + 2}. ${rec.stream_or_course} (${(rec.confidence_score * 100).toFixed(1)}%)`);
        });
      }
      
      console.log(`🧠 AI Insights: ${result.ai_insights?.overall_assessment || 'No insights provided'}`);
      
    } catch (error) {
      console.error(`❌ Error testing ${testCase.name}:`, error.message);
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("🏁 Test completed!");
}

// Function to validate recommendation logic
function validateRecommendationLogic() {
  console.log("\n🔍 Validating Recommendation Logic");
  console.log("=" .repeat(50));
  
  // Test the scoring algorithm directly
  const mockAptitudeScores = {
    logical_reasoning: 0.9,
    quantitative_skills: 0.8,
    language_verbal_skills: 0.6,
    spatial_visual_skills: 0.7,
    memory_attention: 0.8
  };
  
  const mockRIASECScores = {
    realistic: 0.8,
    investigative: 0.9,
    artistic: 0.3,
    social: 0.5,
    enterprising: 0.6,
    conventional: 0.7
  };
  
  console.log("📊 Sample Assessment Scores:");
  console.log("Aptitude Scores:", mockAptitudeScores);
  console.log("RIASEC Scores:", mockRIASECScores);
  
  // Expected behavior validation
  console.log("\n✅ Expected Behavior:");
  console.log("1. Science stream should score highest (strong logical + quantitative + investigative)");
  console.log("2. Engineering careers should be recommended (matches aptitude + interests)");
  console.log("3. Arts stream should score lowest (weak artistic + social scores)");
  console.log("4. Only ONE primary recommendation should be shown");
  console.log("5. Confidence score should reflect actual match quality");
}

// Run the tests
if (typeof window === 'undefined') {
  // Node.js environment
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    testRecommendationSystem().catch(console.error);
  }).catch(() => {
    console.log("node-fetch not available, running validation only");
    validateRecommendationLogic();
  });
} else {
  // Browser environment
  console.log("Run this script in Node.js environment for full testing");
  validateRecommendationLogic();
}

validateRecommendationLogic();
