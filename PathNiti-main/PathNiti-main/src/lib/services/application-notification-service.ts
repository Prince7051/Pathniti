/**
 * Application Notification Service
 * Handles notifications for student application status changes
 */

import { createServiceClient } from "@/lib/supabase/service";
import { Database } from "@/lib/supabase/types";
import { sendEmailNotification } from "./email-notification-service";

const supabase = createServiceClient();

export interface ApplicationStatusChangeData {
  applicationId: string;
  studentId: string;
  collegeId: string;
  collegeName: string;
  studentName: string;
  studentEmail: string;
  oldStatus: "pending" | "approved" | "rejected";
  newStatus: "pending" | "approved" | "rejected";
  feedback?: string;
  reviewedBy: string;
}

export interface CollegeNotificationData {
  collegeId: string;
  collegeName: string;
  studentName: string;
  studentEmail: string;
  applicationId: string;
  action: "new_application" | "document_updated";
}

/**
 * Create in-app notification for student
 */
export async function createStudentNotification(
  data: ApplicationStatusChangeData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { title, message, type } = generateStudentNotificationContent(data);

    const { error } = await (supabase as any).from("notifications").insert({
      user_id: data.studentId,
      title,
      message,
      type,
      data: {
        application_id: data.applicationId,
        college_id: data.collegeId,
        college_name: data.collegeName,
        status: data.newStatus,
        feedback: data.feedback,
      },
    } as never);

    if (error) {
      console.error("Error creating student notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error creating student notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create in-app notification for college
 */
export async function createCollegeNotification(
  data: CollegeNotificationData,
  collegeAdminIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const { title, message, type } = generateCollegeNotificationContent(data);

    const notifications = collegeAdminIds.map((adminId) => ({
      user_id: adminId,
      title,
      message,
      type,
      data: {
        application_id: data.applicationId,
        college_id: data.collegeId,
        student_name: data.studentName,
        student_email: data.studentEmail,
        action: data.action,
      },
    }));

    const { error } = await supabase
      .from("notifications")
      .insert(notifications as never);

    if (error) {
      console.error("Error creating college notifications:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error creating college notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email notification to student about status change
 */
export async function sendStudentEmailNotification(
  data: ApplicationStatusChangeData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, html, text } = generateStudentEmailContent(data);

    return await sendEmailNotification({
      to: [data.studentEmail],
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error("Error sending student email notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email notification to college about new application
 */
export async function sendCollegeEmailNotification(
  data: CollegeNotificationData,
  collegeEmails: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    if (collegeEmails.length === 0) {
      return { success: true };
    }

    const { subject, html, text } = generateCollegeEmailContent(data);

    return await sendEmailNotification({
      to: collegeEmails,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error("Error sending college email notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handle complete application status change notification flow
 */
export async function handleApplicationStatusChange(
  data: ApplicationStatusChangeData,
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Create in-app notification for student
  const studentNotificationResult = await createStudentNotification(data);
  if (!studentNotificationResult.success) {
    errors.push(`Student notification: ${studentNotificationResult.error}`);
  }

  // Send email notification to student
  const studentEmailResult = await sendStudentEmailNotification(data);
  if (!studentEmailResult.success) {
    errors.push(`Student email: ${studentEmailResult.error}`);
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Handle new application notification to college
 */
export async function handleNewApplicationNotification(
  data: CollegeNotificationData,
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Get college admin user IDs
    const { data: collegeAdmins, error: adminError } = await supabase
      .from("college_profiles")
      .select("id")
      .eq("college_id", data.collegeId);

    if (adminError) {
      errors.push(`Failed to get college admins: ${adminError.message}`);
      return { success: false, errors };
    }

    const adminIds = collegeAdmins?.map((admin: { id: string }) => admin.id) || [];

    if (adminIds.length > 0) {
      // Create in-app notifications for college admins
      const collegeNotificationResult = await createCollegeNotification(
        data,
        adminIds,
      );
      if (!collegeNotificationResult.success) {
        errors.push(`College notification: ${collegeNotificationResult.error}`);
      }
    }

    // Get college email addresses
    const { data: college, error: collegeError } = await supabase
      .from("colleges")
      .select("email")
      .eq("id", data.collegeId)
      .single();

    if (collegeError) {
      errors.push(`Failed to get college email: ${collegeError.message}`);
    } else if ((college as { email?: string })?.email) {
      // Send email notification to college
      const collegeEmailResult = await sendCollegeEmailNotification(data, [
        (college as { email: string }).email,
      ]);
      if (!collegeEmailResult.success) {
        errors.push(`College email: ${collegeEmailResult.error}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(
      `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return { success: false, errors };
  }
}

/**
 * Generate notification content for student
 */
function generateStudentNotificationContent(data: ApplicationStatusChangeData) {
  switch (data.newStatus) {
    case "approved":
      return {
        title: "🎉 Application Approved!",
        message: `Congratulations! Your application to ${data.collegeName} has been approved. ${data.feedback ? `Feedback: ${data.feedback}` : "Please check your email for next steps."}`,
        type: "general" as const,
      };
    case "rejected":
      return {
        title: "📋 Application Update",
        message: `Your application to ${data.collegeName} requires attention. ${data.feedback || "Please review and update your documents if needed."}`,
        type: "general" as const,
      };
    case "pending":
      return {
        title: "🔄 Application Under Review",
        message: `Your updated application to ${data.collegeName} is now under review. We'll notify you once there's an update.`,
        type: "general" as const,
      };
    default:
      return {
        title: "Application Status Update",
        message: `Your application status to ${data.collegeName} has been updated.`,
        type: "general" as const,
      };
  }
}

/**
 * Generate notification content for college
 */
function generateCollegeNotificationContent(data: CollegeNotificationData) {
  switch (data.action) {
    case "new_application":
      return {
        title: "📝 New Application Received",
        message: `${data.studentName} (${data.studentEmail}) has submitted a new application to ${data.collegeName}.`,
        type: "general" as const,
      };
    case "document_updated":
      return {
        title: "📄 Application Documents Updated",
        message: `${data.studentName} (${data.studentEmail}) has updated their application documents for ${data.collegeName}.`,
        type: "general" as const,
      };
    default:
      return {
        title: "Application Update",
        message: `There's an update for an application to ${data.collegeName}.`,
        type: "general" as const,
      };
  }
}

/**
 * Generate email content for student
 */
function generateStudentEmailContent(data: ApplicationStatusChangeData) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pathniti.com";

  switch (data.newStatus) {
    case "approved":
      return {
        subject: `🎉 Application Approved - ${data.collegeName}`,
        html: generateApprovedEmailHTML(data, baseUrl),
        text: generateApprovedEmailText(data, baseUrl),
      };
    case "rejected":
      return {
        subject: `📋 Application Update Required - ${data.collegeName}`,
        html: generateRejectedEmailHTML(data, baseUrl),
        text: generateRejectedEmailText(data, baseUrl),
      };
    case "pending":
      return {
        subject: `🔄 Application Under Review - ${data.collegeName}`,
        html: generatePendingEmailHTML(data, baseUrl),
        text: generatePendingEmailText(data, baseUrl),
      };
    default:
      return {
        subject: `Application Status Update - ${data.collegeName}`,
        html: `<p>Your application status has been updated.</p>`,
        text: "Your application status has been updated.",
      };
  }
}

/**
 * Generate email content for college
 */
function generateCollegeEmailContent(data: CollegeNotificationData) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pathniti.com";

  switch (data.action) {
    case "new_application":
      return {
        subject: `📝 New Application - ${data.collegeName}`,
        html: generateNewApplicationEmailHTML(data, baseUrl),
        text: generateNewApplicationEmailText(data, baseUrl),
      };
    case "document_updated":
      return {
        subject: `📄 Application Documents Updated - ${data.collegeName}`,
        html: generateDocumentUpdatedEmailHTML(data, baseUrl),
        text: generateDocumentUpdatedEmailText(data, baseUrl),
      };
    default:
      return {
        subject: `Application Update - ${data.collegeName}`,
        html: `<p>There's an update for an application.</p>`,
        text: "There's an update for an application.",
      };
  }
}

// Email HTML templates
function generateApprovedEmailHTML(
  data: ApplicationStatusChangeData,
  baseUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Approved - PathNiti</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .feedback { background: #dcfce7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <p>Your application has been approved</p>
        </div>
        <div class="content">
          <div class="success-badge">✅ APPROVED</div>
          <h2>Dear ${data.studentName},</h2>
          <p>We're excited to inform you that your application to <strong>${data.collegeName}</strong> has been approved!</p>
          
          ${
            data.feedback
              ? `
            <div class="feedback">
              <strong>Message from ${data.collegeName}:</strong><br>
              ${data.feedback}
            </div>
          `
              : ""
          }
          
          <p>This is a significant step forward in your educational journey. Please check your email regularly for further instructions and next steps.</p>
          
          <a href="${baseUrl}/dashboard/student" class="button">View Application Status</a>
          
          <p>If you have any questions, please don't hesitate to contact the college directly.</p>
          
          <p>Best wishes for your future studies!</p>
          <p><strong>The PathNiti Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateApprovedEmailText(
  data: ApplicationStatusChangeData,
  baseUrl: string,
): string {
  return `
🎉 CONGRATULATIONS! - Your Application Has Been Approved

Dear ${data.studentName},

We're excited to inform you that your application to ${data.collegeName} has been APPROVED!

${data.feedback ? `Message from ${data.collegeName}:\n${data.feedback}\n\n` : ""}

This is a significant step forward in your educational journey. Please check your email regularly for further instructions and next steps.

View your application status: ${baseUrl}/dashboard/student

If you have any questions, please don't hesitate to contact the college directly.

Best wishes for your future studies!

The PathNiti Team
  `.trim();
}

function generateRejectedEmailHTML(
  data: ApplicationStatusChangeData,
  baseUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Update Required - PathNiti</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
        .update-badge { background: #f59e0b; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .feedback { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Application Update Required</h1>
          <p>Your application needs attention</p>
        </div>
        <div class="content">
          <div class="update-badge">📄 UPDATE REQUIRED</div>
          <h2>Dear ${data.studentName},</h2>
          <p>Thank you for your application to <strong>${data.collegeName}</strong>. After review, we need you to update some information or documents.</p>
          
          ${
            data.feedback
              ? `
            <div class="feedback">
              <strong>Feedback from ${data.collegeName}:</strong><br>
              ${data.feedback}
            </div>
          `
              : ""
          }
          
          <p>Don't worry - this is a common part of the application process. Please review the feedback above and update your application accordingly.</p>
          
          <a href="${baseUrl}/dashboard/student" class="button">Update Application</a>
          
          <p>Once you've made the necessary updates, your application will be reviewed again promptly.</p>
          
          <p>If you have any questions about the required updates, please contact the college directly.</p>
          
          <p>Best regards,</p>
          <p><strong>The PathNiti Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateRejectedEmailText(
  data: ApplicationStatusChangeData,
  baseUrl: string,
): string {
  return `
📋 APPLICATION UPDATE REQUIRED

Dear ${data.studentName},

Thank you for your application to ${data.collegeName}. After review, we need you to update some information or documents.

${data.feedback ? `Feedback from ${data.collegeName}:\n${data.feedback}\n\n` : ""}

Don't worry - this is a common part of the application process. Please review the feedback above and update your application accordingly.

Update your application: ${baseUrl}/dashboard/student

Once you've made the necessary updates, your application will be reviewed again promptly.

If you have any questions about the required updates, please contact the college directly.

Best regards,
The PathNiti Team
  `.trim();
}

function generatePendingEmailHTML(
  data: ApplicationStatusChangeData,
  baseUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Under Review - PathNiti</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #eff6ff; padding: 30px; border-radius: 0 0 8px 8px; }
        .pending-badge { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Application Under Review</h1>
          <p>Your updated application is being processed</p>
        </div>
        <div class="content">
          <div class="pending-badge">⏳ UNDER REVIEW</div>
          <h2>Dear ${data.studentName},</h2>
          <p>Thank you for updating your application to <strong>${data.collegeName}</strong>. Your application is now under review.</p>
          
          <p>We'll notify you as soon as there's an update on your application status. This typically takes 3-5 business days.</p>
          
          <a href="${baseUrl}/dashboard/student" class="button">Check Application Status</a>
          
          <p>Thank you for your patience during the review process.</p>
          
          <p>Best regards,</p>
          <p><strong>The PathNiti Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePendingEmailText(
  data: ApplicationStatusChangeData,
  baseUrl: string,
): string {
  return `
🔄 APPLICATION UNDER REVIEW

Dear ${data.studentName},

Thank you for updating your application to ${data.collegeName}. Your application is now under review.

We'll notify you as soon as there's an update on your application status. This typically takes 3-5 business days.

Check application status: ${baseUrl}/dashboard/student

Thank you for your patience during the review process.

Best regards,
The PathNiti Team
  `.trim();
}

function generateNewApplicationEmailHTML(
  data: CollegeNotificationData,
  baseUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Application Received - PathNiti</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #faf5ff; padding: 30px; border-radius: 0 0 8px 8px; }
        .new-badge { background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .student-info { background: #f3e8ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 New Application Received</h1>
          <p>A student has applied to your college</p>
        </div>
        <div class="content">
          <div class="new-badge">🆕 NEW APPLICATION</div>
          <h2>Dear ${data.collegeName} Team,</h2>
          <p>You have received a new application that requires your review.</p>
          
          <div class="student-info">
            <strong>Student Details:</strong><br>
            <strong>Name:</strong> ${data.studentName}<br>
            <strong>Email:</strong> ${data.studentEmail}
          </div>
          
          <p>Please log in to your college dashboard to review the application and supporting documents.</p>
          
          <a href="${baseUrl}/colleges/dashboard" class="button">Review Application</a>
          
          <p>We recommend reviewing applications promptly to provide students with timely feedback.</p>
          
          <p>Best regards,</p>
          <p><strong>The PathNiti Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateNewApplicationEmailText(
  data: CollegeNotificationData,
  baseUrl: string,
): string {
  return `
📝 NEW APPLICATION RECEIVED

Dear ${data.collegeName} Team,

You have received a new application that requires your review.

Student Details:
Name: ${data.studentName}
Email: ${data.studentEmail}

Please log in to your college dashboard to review the application and supporting documents.

Review application: ${baseUrl}/colleges/dashboard

We recommend reviewing applications promptly to provide students with timely feedback.

Best regards,
The PathNiti Team
  `.trim();
}

function generateDocumentUpdatedEmailHTML(
  data: CollegeNotificationData,
  baseUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Documents Updated - PathNiti</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ecfeff; padding: 30px; border-radius: 0 0 8px 8px; }
        .update-badge { background: #06b6d4; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .student-info { background: #cffafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Documents Updated</h1>
          <p>A student has updated their application documents</p>
        </div>
        <div class="content">
          <div class="update-badge">🔄 DOCUMENTS UPDATED</div>
          <h2>Dear ${data.collegeName} Team,</h2>
          <p>A student has updated their application documents and the application is ready for re-review.</p>
          
          <div class="student-info">
            <strong>Student Details:</strong><br>
            <strong>Name:</strong> ${data.studentName}<br>
            <strong>Email:</strong> ${data.studentEmail}
          </div>
          
          <p>Please log in to your college dashboard to review the updated application and documents.</p>
          
          <a href="${baseUrl}/colleges/dashboard" class="button">Review Updated Application</a>
          
          <p>The student is waiting for your feedback on their updated submission.</p>
          
          <p>Best regards,</p>
          <p><strong>The PathNiti Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDocumentUpdatedEmailText(
  data: CollegeNotificationData,
  baseUrl: string,
): string {
  return `
📄 APPLICATION DOCUMENTS UPDATED

Dear ${data.collegeName} Team,

A student has updated their application documents and the application is ready for re-review.

Student Details:
Name: ${data.studentName}
Email: ${data.studentEmail}

Please log in to your college dashboard to review the updated application and documents.

Review updated application: ${baseUrl}/colleges/dashboard

The student is waiting for your feedback on their updated submission.

Best regards,
The PathNiti Team
  `.trim();
}

const applicationNotificationService = {
  createStudentNotification,
  createCollegeNotification,
  sendStudentEmailNotification,
  sendCollegeEmailNotification,
  handleApplicationStatusChange,
  handleNewApplicationNotification,
};

export default applicationNotificationService;
