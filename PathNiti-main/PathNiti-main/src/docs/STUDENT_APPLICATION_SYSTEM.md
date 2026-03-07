# Student Application System

## Overview

The Student Application System allows students to apply to colleges through their profile pages with document upload capabilities. This system implements task 5 from the dynamic college profiles specification.

## Components Implemented

### 1. StudentApplicationForm Component

- **Location**: `src/components/StudentApplicationForm.tsx`
- **Features**:
  - Personal information form (name, email, phone, class/stream)
  - Document upload for 10th and 12th marksheets (required)
  - Optional additional document uploads
  - File validation (PDF, JPEG, PNG up to 5MB)
  - Upload progress indicators
  - Form validation with error messages
  - Integration with Supabase Storage

### 2. API Endpoint

- **Location**: `src/app/api/colleges/[slug]/apply/route.ts`
- **Method**: POST
- **Features**:
  - Authentication validation
  - College existence verification
  - Form data validation (email format, phone format, required fields)
  - Document requirement validation
  - Duplicate application prevention
  - Application record creation
  - Notification system integration

### 3. File Validation Utilities

- **Location**: `src/lib/utils/file-validation.ts`
- **Features**:
  - File type validation (PDF, JPEG, PNG)
  - File size validation (5MB limit)
  - Unique filename generation
  - File size formatting utilities
  - Image/PDF type detection

### 4. College Profile Integration

- **Location**: `src/app/colleges/[slug]/page.tsx` (modified)
- **Features**:
  - Application form modal integration
  - Role-based access control (students only)
  - Authentication state handling
  - Success/error feedback

### 5. Supabase Storage Setup

- **Location**: `src/lib/setup-storage.sql`
- **Features**:
  - Storage bucket creation for student documents
  - Row Level Security (RLS) policies
  - Public access for college administrators
  - File size and type restrictions

## Database Schema

The system uses the existing `student_applications` table with the following structure:

```sql
student_applications (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  college_id UUID REFERENCES colleges(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  class_stream TEXT NOT NULL,
  documents JSONB NOT NULL, -- {marksheet_10th, marksheet_12th, other_documents}
  status TEXT DEFAULT 'pending',
  feedback TEXT,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## File Storage Structure

Documents are stored in Supabase Storage with the following structure:

```
student-documents/
├── marksheets/{college_id}/
│   ├── {timestamp}-{random}.pdf
│   └── {timestamp}-{random}.jpg
└── other-documents/{college_id}/
    ├── {timestamp}-{random}.pdf
    └── {timestamp}-{random}.png
```

## Validation Rules

### Form Validation

- **Full Name**: Required, non-empty string
- **Email**: Required, valid email format
- **Phone**: Required, 10-digit Indian mobile number (6-9 prefix)
- **Class/Stream**: Required, non-empty string
- **10th Marksheet**: Required file upload
- **12th Marksheet**: Required file upload
- **Other Documents**: Optional file uploads

### File Validation

- **Allowed Types**: PDF, JPEG, PNG, JPG
- **Size Limit**: 5MB per file
- **Required Documents**: 10th and 12th marksheets must be uploaded
- **Security**: Files are validated on both client and server side

## API Responses

### Success Response (200)

```json
{
  "success": true,
  "application": {
    "id": "uuid",
    "status": "pending",
    "submitted_at": "2024-01-01T00:00:00Z",
    "college_name": "College Name",
    "college_slug": "college-slug"
  }
}
```

### Error Responses

- **401**: Authentication required
- **404**: College not found
- **400**: Validation errors (missing fields, invalid format, missing documents)
- **409**: Duplicate application exists
- **500**: Internal server error

## Security Features

1. **Authentication**: Users must be logged in to submit applications
2. **Authorization**: Only students can submit applications
3. **File Validation**: Server-side file type and size validation
4. **Input Sanitization**: All form inputs are validated and sanitized
5. **Duplicate Prevention**: Prevents multiple pending/approved applications to same college
6. **RLS Policies**: Database-level security for document access

## Testing

### Test Files

- `src/__tests__/student-application-form.test.tsx` - Component unit tests
- `src/__tests__/student-application-integration.test.tsx` - Integration tests
- `src/__tests__/api-college-apply.test.ts` - API endpoint tests

### Test Coverage

- Form rendering and validation
- File upload functionality
- API endpoint validation
- Error handling
- Integration workflows

## Usage

### For Students

1. Navigate to a college profile page
2. Click "Apply Now" button (requires student login)
3. Fill out the application form
4. Upload required documents (10th and 12th marksheets)
5. Optionally upload additional documents
6. Submit the application

### For Developers

```tsx
import StudentApplicationForm from "@/components/StudentApplicationForm";

<StudentApplicationForm
  collegeId="college-uuid"
  collegeName="College Name"
  onSuccess={() => console.log("Application submitted")}
  onCancel={() => console.log("Application cancelled")}
/>;
```

## Requirements Fulfilled

This implementation fulfills all requirements from task 5:

- ✅ **4.1**: Student registration form on college profile pages
- ✅ **4.2**: Form validation for all required fields
- ✅ **4.3**: Document upload functionality (PDF files for marksheets)
- ✅ **4.4**: Application data saved to database
- ✅ **4.5**: Dashboard entry with "Pending" status
- ✅ **4.6**: Notification system for college administrators

## Future Enhancements

1. **File Preview**: Add document preview functionality
2. **Drag & Drop**: Implement drag-and-drop file upload
3. **Progress Tracking**: Enhanced upload progress with cancel functionality
4. **Bulk Upload**: Support for multiple file selection
5. **Document Templates**: Provide document format guidelines
6. **Auto-save**: Save form data as draft while filling
