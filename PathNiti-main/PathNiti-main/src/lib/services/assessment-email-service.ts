/**
 * Assessment Results Email Service
 * Sends personalized career recommendations via email after assessment completion
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_iZL5TtxG_Je4eMGCM8EmNTXmrzXkm663s");

export interface AssessmentEmailData {
  user_email: string;
  user_name: string;
  assessment_results: {
    session_id: string;
    completed_at: string;
    overall_score: number;
    confidence_level: number;
  };
  recommendations: {
    primary_recommendations: Array<{
      stream: string;
      reasoning: string;
      time_to_earn: string;
      average_salary: string;
      job_demand_trend: string;
      confidence_score: number;
      career_paths?: string[];
    }>;
    secondary_recommendations?: Array<{
      stream: string;
      reasoning: string;
      time_to_earn: string;
      average_salary: string;
      job_demand_trend: string;
      confidence_score: number;
      career_paths?: string[];
    }>;
    ai_reasoning: string;
    confidence_score: number;
  };
  colleges?: Array<{
    college_name: string;
    address: string;
    stream_offered: string;
    match_score: number;
  }>;
  scholarships?: Array<{
    name: string;
    benefit: string;
    eligibility: string;
    match_score: number;
  }>;
}

/**
 * Send assessment results email with personalized recommendations
 */
export async function sendAssessmentResultsEmail(
  data: AssessmentEmailData
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    const { user_email, user_name, assessment_results, recommendations, colleges, scholarships } = data;

    const subject = `🎯 Your Career Assessment Results - ${user_name}`;
    const html = generateAssessmentResultsEmailHTML(data);
    const text = generateAssessmentResultsEmailText(data);

    const result = await resend.emails.send({
      from: "PathNiti <career-guidance@pathniti.com>",
      to: [user_email],
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error("Resend API error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("Assessment results email sent successfully:", result.data?.id);
    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error("Failed to send assessment results email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate HTML email for assessment results
 */
function generateAssessmentResultsEmailHTML(data: AssessmentEmailData): string {
  const { user_name, assessment_results, recommendations, colleges, scholarships } = data;
  const primaryRec = recommendations.primary_recommendations[0];
  const secondaryRec = recommendations.secondary_recommendations?.[0];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Career Assessment Results - PathNiti</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 700px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1e293b; }
        .summary-card { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 2px solid #0ea5e9; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .score-display { display: flex; justify-content: space-around; margin: 20px 0; }
        .score-item { text-align: center; }
        .score-number { font-size: 32px; font-weight: bold; color: #0ea5e9; }
        .score-label { font-size: 14px; color: #64748b; margin-top: 5px; }
        .recommendation-card { background: white; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .recommendation-title { font-size: 20px; font-weight: bold; color: #10b981; margin-bottom: 15px; }
        .badge { display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; margin: 5px 5px 5px 0; }
        .secondary-card { background: white; border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .secondary-title { font-size: 18px; font-weight: bold; color: #f59e0b; margin-bottom: 15px; }
        .college-card, .scholarship-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .college-title, .scholarship-title { font-weight: bold; color: #1e293b; margin-bottom: 10px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #2563eb; }
        .footer { background: #1e293b; color: white; padding: 30px; text-align: center; }
        .footer a { color: #60a5fa; text-decoration: none; }
        .ai-insights { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .ai-title { font-weight: bold; color: #92400e; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Your Career Assessment Results</h1>
          <p>Personalized recommendations based on your comprehensive assessment</p>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${user_name}!</div>
          
          <p>Congratulations on completing your comprehensive career assessment! We've analyzed your responses and prepared personalized career recommendations just for you.</p>
          
          <!-- Assessment Summary -->
          <div class="summary-card">
            <h2 style="color: #0ea5e9; margin-top: 0;">📊 Assessment Summary</h2>
            <div class="score-display">
              <div class="score-item">
                <div class="score-number">${assessment_results.overall_score}/100</div>
                <div class="score-label">Overall Score</div>
              </div>
              <div class="score-item">
                <div class="score-number">${Math.round(assessment_results.confidence_level * 100)}%</div>
                <div class="score-label">Confidence Level</div>
              </div>
              <div class="score-item">
                <div class="score-number">${new Date(assessment_results.completed_at).toLocaleDateString()}</div>
                <div class="score-label">Completed</div>
              </div>
            </div>
          </div>

          <!-- AI Insights -->
          <div class="ai-insights">
            <div class="ai-title">🤖 AI Analysis Summary</div>
            <p>${recommendations.ai_reasoning}</p>
          </div>

          <!-- Primary Recommendation -->
          ${primaryRec ? `
          <div class="recommendation-card">
            <div class="recommendation-title">⭐ Your Best Career Match: ${primaryRec.stream.replace('_', ' ').toUpperCase()}</div>
            <p><strong>Match Confidence:</strong> <span class="badge">${Math.round(primaryRec.confidence_score * 100)}% Match</span></p>
            <p>${primaryRec.reasoning}</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
              <div>
                <strong>⏱️ Time to Earn:</strong><br>
                ${primaryRec.time_to_earn}
              </div>
              <div>
                <strong>💰 Average Salary:</strong><br>
                ${primaryRec.average_salary}
              </div>
              <div>
                <strong>📈 Job Demand:</strong><br>
                <span class="badge">${primaryRec.job_demand_trend.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            
            ${primaryRec.career_paths && primaryRec.career_paths.length > 0 ? `
            <div>
              <strong>🎯 Career Paths:</strong><br>
              ${primaryRec.career_paths.map(path => `<span class="badge">${path}</span>`).join('')}
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Secondary Recommendation -->
          ${secondaryRec ? `
          <div class="secondary-card">
            <div class="secondary-title">🔄 Alternative Option: ${secondaryRec.stream.replace('_', ' ').toUpperCase()}</div>
            <p><strong>Match Confidence:</strong> <span class="badge">${Math.round(secondaryRec.confidence_score * 100)}% Match</span></p>
            <p>${secondaryRec.reasoning}</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
              <div>
                <strong>⏱️ Time to Earn:</strong><br>
                ${secondaryRec.time_to_earn}
              </div>
              <div>
                <strong>💰 Average Salary:</strong><br>
                ${secondaryRec.average_salary}
              </div>
              <div>
                <strong>📈 Job Demand:</strong><br>
                <span class="badge">${secondaryRec.job_demand_trend.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Recommended Colleges -->
          ${colleges && colleges.length > 0 ? `
          <div style="margin: 30px 0;">
            <h3 style="color: #1e293b;">🏛️ Recommended Colleges</h3>
            ${colleges.slice(0, 3).map(college => `
              <div class="college-card">
                <div class="college-title">${college.college_name}</div>
                <p><strong>📍 Location:</strong> ${college.address}</p>
                <p><strong>📚 Stream:</strong> ${college.stream_offered}</p>
                <p><strong>🎯 Match Score:</strong> <span class="badge">${Math.round(college.match_score * 100)}% Match</span></p>
              </div>
            `).join('')}
            ${colleges.length > 3 ? `<p><em>... and ${colleges.length - 3} more colleges</em></p>` : ''}
          </div>
          ` : ''}

          <!-- Scholarships -->
          ${scholarships && scholarships.length > 0 ? `
          <div style="margin: 30px 0;">
            <h3 style="color: #1e293b;">🎓 Available Scholarships</h3>
            ${scholarships.slice(0, 2).map(scholarship => `
              <div class="scholarship-card">
                <div class="scholarship-title">${scholarship.name}</div>
                <p><strong>💰 Benefit:</strong> ${scholarship.benefit}</p>
                <p><strong>📋 Eligibility:</strong> ${scholarship.eligibility}</p>
                <p><strong>🎯 Match Score:</strong> <span class="badge">${Math.round(scholarship.match_score * 100)}% Match</span></p>
              </div>
            `).join('')}
            ${scholarships.length > 2 ? `<p><em>... and ${scholarships.length - 2} more scholarships</em></p>` : ''}
          </div>
          ` : ''}

          <!-- Call to Action -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://pathniti.com/assessment-results?session_id=${assessment_results.session_id}" class="button">
              View Detailed Results
            </a>
            <br>
            <a href="https://pathniti.com/career-pathways" class="button" style="background: #10b981; margin-left: 10px;">
              Explore Career Pathways
            </a>
          </div>

          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #1e293b; margin-top: 0;">💡 Next Steps</h4>
            <ul>
              <li>Review your detailed assessment results on our platform</li>
              <li>Explore the recommended career pathways in depth</li>
              <li>Research the suggested colleges and their admission requirements</li>
              <li>Apply for relevant scholarships to support your education</li>
              <li>Consider taking additional assessments to refine your career path</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <h3>🚀 Ready to Shape Your Future?</h3>
          <p>Your personalized career journey starts now. Use these recommendations as a guide to make informed decisions about your education and career path.</p>
          <p>
            <a href="https://pathniti.com">Visit PathNiti</a> | 
            <a href="https://pathniti.com/contact">Contact Support</a> | 
            <a href="https://pathniti.com/unsubscribe">Unsubscribe</a>
          </p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            This email was sent because you completed a career assessment on PathNiti. 
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate text email for assessment results
 */
function generateAssessmentResultsEmailText(data: AssessmentEmailData): string {
  const { user_name, assessment_results, recommendations, colleges, scholarships } = data;
  const primaryRec = recommendations.primary_recommendations[0];
  const secondaryRec = recommendations.secondary_recommendations?.[0];

  return `
🎯 YOUR CAREER ASSESSMENT RESULTS - PathNiti

Hello ${user_name}!

Congratulations on completing your comprehensive career assessment! We've analyzed your responses and prepared personalized career recommendations just for you.

📊 ASSESSMENT SUMMARY
• Overall Score: ${assessment_results.overall_score}/100
• Confidence Level: ${Math.round(assessment_results.confidence_level * 100)}%
• Completed: ${new Date(assessment_results.completed_at).toLocaleDateString()}

🤖 AI ANALYSIS SUMMARY
${recommendations.ai_reasoning}

${primaryRec ? `
⭐ YOUR BEST CAREER MATCH: ${primaryRec.stream.replace('_', ' ').toUpperCase()}
• Match Confidence: ${Math.round(primaryRec.confidence_score * 100)}%
• Reasoning: ${primaryRec.reasoning}
• Time to Earn: ${primaryRec.time_to_earn}
• Average Salary: ${primaryRec.average_salary}
• Job Demand: ${primaryRec.job_demand_trend.replace('_', ' ').toUpperCase()}
${primaryRec.career_paths && primaryRec.career_paths.length > 0 ? `• Career Paths: ${primaryRec.career_paths.join(', ')}` : ''}
` : ''}

${secondaryRec ? `
🔄 ALTERNATIVE OPTION: ${secondaryRec.stream.replace('_', ' ').toUpperCase()}
• Match Confidence: ${Math.round(secondaryRec.confidence_score * 100)}%
• Reasoning: ${secondaryRec.reasoning}
• Time to Earn: ${secondaryRec.time_to_earn}
• Average Salary: ${secondaryRec.average_salary}
• Job Demand: ${secondaryRec.job_demand_trend.replace('_', ' ').toUpperCase()}
` : ''}

${colleges && colleges.length > 0 ? `
🏛️ RECOMMENDED COLLEGES
${colleges.slice(0, 3).map(college => `
• ${college.college_name}
  Location: ${college.address}
  Stream: ${college.stream_offered}
  Match Score: ${Math.round(college.match_score * 100)}%
`).join('')}
${colleges.length > 3 ? `... and ${colleges.length - 3} more colleges` : ''}
` : ''}

${scholarships && scholarships.length > 0 ? `
🎓 AVAILABLE SCHOLARSHIPS
${scholarships.slice(0, 2).map(scholarship => `
• ${scholarship.name}
  Benefit: ${scholarship.benefit}
  Eligibility: ${scholarship.eligibility}
  Match Score: ${Math.round(scholarship.match_score * 100)}%
`).join('')}
${scholarships.length > 2 ? `... and ${scholarships.length - 2} more scholarships` : ''}
` : ''}

💡 NEXT STEPS
• Review your detailed assessment results on our platform
• Explore the recommended career pathways in depth
• Research the suggested colleges and their admission requirements
• Apply for relevant scholarships to support your education
• Consider taking additional assessments to refine your career path

🚀 READY TO SHAPE YOUR FUTURE?
Your personalized career journey starts now. Use these recommendations as a guide to make informed decisions about your education and career path.

View Detailed Results: https://pathniti.com/assessment-results?session_id=${assessment_results.session_id}
Explore Career Pathways: https://pathniti.com/career-pathways

---
Visit PathNiti: https://pathniti.com
Contact Support: https://pathniti.com/contact
Unsubscribe: https://pathniti.com/unsubscribe

This email was sent because you completed a career assessment on PathNiti. 
If you have any questions, please contact our support team.
  `.trim();
}

export default {
  sendAssessmentResultsEmail,
};
