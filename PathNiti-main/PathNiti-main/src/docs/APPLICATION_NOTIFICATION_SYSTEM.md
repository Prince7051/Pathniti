# Application Notification System Documentation

## Overview

The Application Notification System provides comprehensive notification capabilities for student application status changes in the PathNiti platform. It includes both in-app notifications and email notifications for students and colleges.

## Features

### 1. Student Notifications

- **Application Status Changes**: Notifications when applications are approved, rejected, or under review
- **Email Notifications**: Detailed email notifications with next steps and feedback
- **In-App Notifications**: Real-time notifications in the student dashboard
- **Notification Management**: Mark notifications as read, refresh notifications

### 2. College Notifications

- **New Applications**: Notifications when students submit new applications
- **Document Updates**: Notifications when students update their application documents
- **Email Notifications**: Email alerts to college administrators
- **In-App Notifications**: Real-time notifications in the college dashboard

### 3. Email Templates

- **Professional Design**: HTML email templates with responsive design
- **Status-Specific Content**: Different templates for approved, rejected, and pending applications
- **Actionable Content**: Direct links to relevant dashboard sections
- **Branding**: Consistent PathNiti branding and styling

## Architecture

### Core Service: `application-notification-service.ts`

The main service handles all notification logic:

```typescript
// Main functions
handleApplicationStatusChange(data: ApplicationStatusChangeData)
handleNewApplicationNotification(data: CollegeNotificationData)
createStudentNotification(data: ApplicationStatusChangeData)
createCollegeNotification(data: CollegeNotificationData, adminIds: string[])
sendStudentEmailNotification(data: ApplicationStatusChangeData)
sendCollegeEmailNotification(data: CollegeNotificationData, emails: string[])
```

### API Endpoints

#### Student Notifications

- `GET /api/student/notifications` - Fetch student notifications
- `PUT /api/student/notifications/[id]/read` - Mark notification as read

#### College Notifications

- `GET /api/colleges/notifications` - Fetch college notifications
- `PUT /api/colleges/notifications/[id]/read` - Mark notification as read
- `PUT /api/colleges/notifications` - Bulk operations (mark all as read)

### UI Components

#### ApplicationNotifications Component

- Displays student notifications with status indicators
- Supports marking notifications as read
- Automatic refresh functionality
- Error handling and loading states

#### CollegeNotifications Component

- Displays college notifications with application details
- Shows student information and action types
- Bulk notification management
- Real-time updates

## Integration Points

### 1. Application Status Updates

The notification system is integrated into the application status update API:

```typescript
// In /api/colleges/admin/applications/[id]/status/route.ts
const notificationResult = await handleApplicationStatusChange({
  applicationId,
  studentId,
  collegeId,
  collegeName,
  studentName,
  studentEmail,
  oldStatus,
  newStatus,
  feedback,
  reviewedBy,
});
```

### 2. New Application Submissions

Integrated into the application submission API:

```typescript
// In /api/colleges/[slug]/apply/route.ts
const notificationResult = await handleNewApplicationNotification({
  collegeId,
  collegeName,
  studentName,
  studentEmail,
  applicationId,
  action: "new_application",
});
```

### 3. Document Updates

Integrated into the document update API:

```typescript
// In /api/student/applications/[id]/documents/route.ts
const notificationResult = await handleNewApplicationNotification({
  collegeId,
  collegeName,
  studentName,
  studentEmail,
  applicationId,
  action: "document_updated",
});
```

## Database Schema

### Notifications Table

```sql
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Notification Types

- `admission_deadline` - Admission deadline reminders
- `scholarship` - Scholarship opportunities
- `exam_reminder` - Exam reminders
- `general` - General notifications (used for application updates)

## Email Templates

### Student Email Templates

#### Application Approved

- Congratulatory message with success styling
- Feedback from college (if provided)
- Next steps and contact information
- Link to student dashboard

#### Application Rejected/Update Required

- Constructive messaging with update instructions
- Specific feedback from college
- Encouragement to resubmit
- Link to update application

#### Application Under Review

- Status update confirmation
- Expected timeline information
- Link to track application status

### College Email Templates

#### New Application

- Student details and application information
- Link to college dashboard for review
- Reminder about timely review

#### Document Updated

- Notification of document updates
- Student information
- Link to review updated application

## Error Handling

### Graceful Degradation

- Notifications failures don't block main operations
- Errors are logged but don't cause API failures
- Multiple notification channels provide redundancy

### Error Collection

```typescript
interface NotificationResult {
  success: boolean;
  errors: string[];
}
```

### Retry Logic

- Email notifications have built-in retry through Resend API
- Database operations use Supabase's built-in retry mechanisms

## Security Considerations

### Access Control

- Row Level Security (RLS) policies ensure users only see their notifications
- College administrators only receive notifications for their college
- API endpoints verify user roles and permissions

### Data Privacy

- Notification data includes only necessary information
- Email addresses are validated before sending
- Sensitive information is not included in notification metadata

## Performance Optimizations

### Database Queries

- Indexed queries on user_id and sent_at
- Pagination support (limit 50 notifications)
- Efficient filtering by read status

### Caching

- Notification counts cached in UI components
- Automatic refresh on user actions
- Optimistic updates for better UX

### Email Delivery

- Asynchronous email sending
- Batch processing for multiple recipients
- Rate limiting through Resend API

## Usage Examples

### Handling Application Approval

```typescript
const result = await handleApplicationStatusChange({
  applicationId: "app-123",
  studentId: "student-456",
  collegeId: "college-789",
  collegeName: "Example College",
  studentName: "John Doe",
  studentEmail: "john@example.com",
  oldStatus: "pending",
  newStatus: "approved",
  feedback: "Congratulations! Please check your email for next steps.",
  reviewedBy: "admin-123",
});

if (!result.success) {
  console.error("Notification errors:", result.errors);
}
```

### Handling New Application

```typescript
const result = await handleNewApplicationNotification({
  collegeId: "college-789",
  collegeName: "Example College",
  studentName: "Jane Smith",
  studentEmail: "jane@example.com",
  applicationId: "app-456",
  action: "new_application",
});
```

## Testing

### Unit Tests

- Comprehensive test suite in `application-notification-system.test.ts`
- Tests for all notification scenarios
- Error handling and edge cases
- Integration with existing APIs

### Test Coverage

- Notification content generation
- Email template rendering
- Database operations
- API endpoint functionality
- UI component behavior

## Monitoring and Analytics

### Notification Metrics

- Delivery success rates
- Read rates for in-app notifications
- Email open rates (through Resend analytics)
- Response times for notification processing

### Error Tracking

- Failed notification attempts logged
- Email delivery failures tracked
- Database operation errors monitored

## Future Enhancements

### Planned Features

1. **Push Notifications**: Browser push notifications for real-time alerts
2. **SMS Notifications**: SMS alerts for critical updates
3. **Notification Preferences**: User-configurable notification settings
4. **Digest Notifications**: Daily/weekly notification summaries
5. **Rich Notifications**: Embedded actions in notifications

### Scalability Improvements

1. **Queue System**: Background job processing for notifications
2. **Template Engine**: Dynamic template generation
3. **Multi-language Support**: Localized notification content
4. **Advanced Analytics**: Detailed notification performance metrics

## Troubleshooting

### Common Issues

#### Notifications Not Received

1. Check user permissions and roles
2. Verify email addresses are valid
3. Check Resend API configuration
4. Review database RLS policies

#### Email Delivery Issues

1. Verify Resend API key configuration
2. Check email template rendering
3. Review recipient email validation
4. Monitor Resend dashboard for delivery status

#### Database Errors

1. Check Supabase connection
2. Verify table permissions
3. Review RLS policy configuration
4. Check for database constraint violations

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
NOTIFICATION_DEBUG=true
EMAIL_DEBUG=true
```

## Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key

# Optional
NEXT_PUBLIC_SITE_URL=https://pathniti.com
NOTIFICATION_DEBUG=false
EMAIL_DEBUG=false
```

### Resend Configuration

The system uses Resend for email delivery. Configure your Resend account:

1. Add your domain to Resend
2. Verify DNS settings
3. Configure sender email address
4. Set up webhooks for delivery tracking

## Support

For issues or questions about the notification system:

1. Check the troubleshooting section
2. Review test cases for usage examples
3. Check Supabase and Resend service status
4. Contact the development team

## Changelog

### Version 1.0.0 (Current)

- Initial implementation of notification system
- Student and college notification support
- Email template system
- In-app notification components
- Comprehensive test suite
- Integration with existing APIs

### Planned Updates

- Push notification support
- SMS integration
- Advanced notification preferences
- Performance optimizations
- Enhanced analytics
