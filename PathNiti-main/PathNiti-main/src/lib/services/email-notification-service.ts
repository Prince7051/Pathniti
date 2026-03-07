/**
 * Email Notification Service using Resend API
 * Handles sending email notifications for college updates
 */

import { Resend } from "resend";
import type { CollegeProfileData } from "@/lib/types/college-profile";

const resend = new Resend("re_iZL5TtxG_Je4eMGCM8EmNTXmrzXkm663s");

export interface EmailNotificationOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export interface CollegeUpdateNotification {
  type: "created" | "updated" | "deleted";
  college: CollegeProfileData;
  changes?: string[];
}

/**
 * Send email notification using Resend API
 */
export async function sendEmailNotification(
  options: EmailNotificationOptions,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await resend.emails.send({
      from: "PathNiti <notifications@pathniti.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      console.error("Resend API error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("Email sent successfully:", result.data?.id);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send college update notification to subscribers
 */
export async function sendCollegeUpdateNotification(
  notification: CollegeUpdateNotification,
  subscribers: string[],
): Promise<{ success: boolean; error?: string }> {
  if (subscribers.length === 0) {
    return { success: true };
  }

  const { type, college, changes } = notification;

  let subject: string;
  let html: string;
  let text: string;

  switch (type) {
    case "created":
      subject = `New College Added: ${college.name}`;
      html = generateNewCollegeEmailHTML(college);
      text = generateNewCollegeEmailText(college);
      break;

    case "updated":
      subject = `College Updated: ${college.name}`;
      html = generateCollegeUpdateEmailHTML(college, changes || []);
      text = generateCollegeUpdateEmailText(college, changes || []);
      break;

    case "deleted":
      subject = `College Removed: ${college.name}`;
      html = generateCollegeDeletedEmailHTML(college);
      text = generateCollegeDeletedEmailText(college);
      break;

    default:
      return { success: false, error: "Invalid notification type" };
  }

  return await sendEmailNotification({
    to: subscribers,
    subject,
    html,
    text,
  });
}

/**
 * Generate HTML email for new college
 */
function generateNewCollegeEmailHTML(college: CollegeProfileData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New College Added - PathNiti</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .college-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 5px 5px 5px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 New College Added!</h1>
          <p>A new college has been added to PathNiti</p>
        </div>
        <div class="content">
          <div class="college-card">
            <h2>${college.name}</h2>
            <p><strong>📍 Location:</strong> ${college.location.city}, ${college.location.state}</p>
            <p><strong>🏛️ Type:</strong> ${college.type.replace("_", " ").toUpperCase()}</p>
            ${college.established_year ? `<p><strong>📅 Established:</strong> ${college.established_year}</p>` : ""}
            ${college.is_verified ? '<span class="badge">✅ Verified</span>' : ""}
            
            ${
              college.courses && college.courses.length > 0
                ? `
              <div style="margin-top: 15px;">
                <strong>📚 Available Courses:</strong><br>
                ${college.courses
                  .slice(0, 5)
                  .map((course) => `<span class="badge">${course.name}</span>`)
                  .join("")}
                ${college.courses.length > 5 ? `<span class="badge">+${college.courses.length - 5} more</span>` : ""}
              </div>
            `
                : ""
            }
            
            ${college.about ? `<p style="margin-top: 15px;"><strong>About:</strong> ${college.about.substring(0, 200)}${college.about.length > 200 ? "..." : ""}</p>` : ""}
            
            <a href="https://pathniti.com/colleges/${college.slug || college.id}" class="button">View College Details</a>
          </div>
          
          <div class="footer">
            <p>Stay updated with the latest college additions on PathNiti!</p>
            <p><a href="https://pathniti.com/colleges">Browse All Colleges</a> | <a href="https://pathniti.com/unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate text email for new college
 */
function generateNewCollegeEmailText(college: CollegeProfileData): string {
  return `
🎓 NEW COLLEGE ADDED - PathNiti

${college.name}

📍 Location: ${college.location.city}, ${college.location.state}
🏛️ Type: ${college.type.replace("_", " ").toUpperCase()}
${college.established_year ? `📅 Established: ${college.established_year}` : ""}
${college.is_verified ? "✅ Verified College" : ""}

${
  college.courses && college.courses.length > 0
    ? `
📚 Available Courses:
${college.courses
  .slice(0, 5)
  .map((course) => `• ${course.name}`)
  .join("\n")}
${college.courses.length > 5 ? `... and ${college.courses.length - 5} more courses` : ""}
`
    : ""
}

${college.about ? `About: ${college.about.substring(0, 300)}${college.about.length > 300 ? "..." : ""}` : ""}

View full details: https://pathniti.com/colleges/${college.slug || college.id}

---
Stay updated with PathNiti!
Browse all colleges: https://pathniti.com/colleges
Unsubscribe: https://pathniti.com/unsubscribe
  `.trim();
}

/**
 * Generate HTML email for college update
 */
function generateCollegeUpdateEmailHTML(
  college: CollegeProfileData,
  changes: string[],
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>College Updated - PathNiti</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .college-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .changes { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 College Updated!</h1>
          <p>Information has been updated for a college you're following</p>
        </div>
        <div class="content">
          <div class="college-card">
            <h2>${college.name}</h2>
            <p><strong>📍 Location:</strong> ${college.location.city}, ${college.location.state}</p>
            
            ${
              changes.length > 0
                ? `
              <div class="changes">
                <strong>🔄 Recent Changes:</strong>
                <ul>
                  ${changes.map((change) => `<li>${change}</li>`).join("")}
                </ul>
              </div>
            `
                : ""
            }
            
            <a href="https://pathniti.com/colleges/${college.slug || college.id}" class="button">View Updated Details</a>
          </div>
          
          <div class="footer">
            <p>Stay informed about college updates on PathNiti!</p>
            <p><a href="https://pathniti.com/colleges">Browse All Colleges</a> | <a href="https://pathniti.com/unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate text email for college update
 */
function generateCollegeUpdateEmailText(
  college: CollegeProfileData,
  changes: string[],
): string {
  return `
📝 COLLEGE UPDATED - PathNiti

${college.name}
📍 ${college.location.city}, ${college.location.state}

${
  changes.length > 0
    ? `
🔄 Recent Changes:
${changes.map((change) => `• ${change}`).join("\n")}
`
    : ""
}

View updated details: https://pathniti.com/colleges/${college.slug || college.id}

---
Stay informed with PathNiti!
Browse all colleges: https://pathniti.com/colleges
Unsubscribe: https://pathniti.com/unsubscribe
  `.trim();
}

/**
 * Generate HTML email for college deletion
 */
function generateCollegeDeletedEmailHTML(college: CollegeProfileData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>College Removed - PathNiti</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .college-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🗑️ College Removed</h1>
          <p>A college has been removed from PathNiti</p>
        </div>
        <div class="content">
          <div class="college-card">
            <h2>${college.name}</h2>
            <p><strong>📍 Location:</strong> ${college.location.city}, ${college.location.state}</p>
            <p>This college is no longer available in our directory.</p>
            
            <a href="https://pathniti.com/colleges" class="button">Browse Other Colleges</a>
          </div>
          
          <div class="footer">
            <p>Stay updated with PathNiti!</p>
            <p><a href="https://pathniti.com/colleges">Browse All Colleges</a> | <a href="https://pathniti.com/unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate text email for college deletion
 */
function generateCollegeDeletedEmailText(college: CollegeProfileData): string {
  return `
🗑️ COLLEGE REMOVED - PathNiti

${college.name}
📍 ${college.location.city}, ${college.location.state}

This college is no longer available in our directory.

Browse other colleges: https://pathniti.com/colleges

---
Stay updated with PathNiti!
Browse all colleges: https://pathniti.com/colleges
Unsubscribe: https://pathniti.com/unsubscribe
  `.trim();
}

/**
 * Get list of email subscribers for college notifications
 * This would typically come from a database
 */
export async function getCollegeNotificationSubscribers(): Promise<string[]> {
  // In a real implementation, this would query a database for subscribers
  // For now, return a placeholder list
  return ["admin@pathniti.com", "notifications@pathniti.com"];
}

const emailNotificationService = {
  sendEmailNotification,
  sendCollegeUpdateNotification,
  getCollegeNotificationSubscribers,
};

export default emailNotificationService;
