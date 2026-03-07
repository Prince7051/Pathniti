# Authentication Utilities and Helpers

This document provides a comprehensive guide to the authentication utilities and helpers created for the PathNiti application. These utilities centralize authentication logic and provide reusable components for consistent authentication handling across the application.

## Overview

The authentication system consists of several layers:

1. **Core AuthProvider** - Central authentication state management
2. **Authentication Utilities** - Helper functions for common operations
3. **Authentication Components** - Reusable UI components
4. **Authentication Hooks** - Custom hooks for authentication logic
5. **Higher-Order Components** - Page-level authentication guards

## Core Components

### AuthProvider

The central authentication provider is located in `src/app/providers.tsx` and provides:

- User session management
- Profile data management
- Role-based access control
- Centralized redirect helpers (`requireAuth`, `requireRole`)

### Authentication Utilities (`src/lib/auth-utils.ts`)

Core utility functions for authentication operations:

```typescript
// Role checking
hasRole(profile, "admin"); // boolean
isAuthenticated(user, session); // boolean
hasCompleteProfile(profile); // boolean

// User information
getUserDisplayName(profile); // string
getUserInitials(profile); // string
getDashboardUrl(profile); // string

// Route protection
isProtectedRoute(pathname); // boolean
getRequiredRole(pathname); // 'student' | 'admin' | 'college' | null

// Error handling
parseAuthError(error); // AuthErrorType
getAuthErrorMessage(errorType); // string

// Validation
isValidEmail(email); // boolean
isValidPassword(password); // boolean
getPasswordStrength(password); // 'weak' | 'medium' | 'strong'
```

## Authentication Components

### AuthGuard (`src/components/AuthGuard.tsx`)

Component-based authentication guard that conditionally renders children:

```tsx
import { AuthGuard, AdminGuard, StudentGuard, CollegeGuard } from '@/components/AuthGuard'

// Basic authentication guard
<AuthGuard>
  <ProtectedContent />
</AuthGuard>

// Role-specific guards
<AdminGuard>
  <AdminOnlyContent />
</AdminGuard>

<StudentGuard>
  <StudentOnlyContent />
</StudentGuard>

<CollegeGuard>
  <CollegeOnlyContent />
</CollegeGuard>

// Custom fallback
<AuthGuard
  requiredRole="admin"
  fallback={<div>Access denied</div>}
  loadingComponent={<CustomLoader />}
>
  <ProtectedContent />
</AuthGuard>
```

### withAuth HOC (`src/components/withAuth.tsx`)

Higher-order component for page-level authentication:

```tsx
import {
  withAuth,
  withAdminAuth,
  withStudentAuth,
  withCollegeAuth,
} from "@/components/withAuth";

// Basic page protection
const ProtectedPage = withAuth(MyPage);

// Role-specific page protection
const AdminPage = withAdminAuth(MyAdminPage);
const StudentPage = withStudentAuth(MyStudentPage);
const CollegePage = withCollegeAuth(MyCollegePage);

// Custom options
const CustomProtectedPage = withAuth(MyPage, {
  requireAuth: true,
  requiredRole: "admin",
  loadingComponent: CustomLoader,
  fallbackComponent: CustomFallback,
});
```

### AuthLoading (`src/components/AuthLoading.tsx`)

Comprehensive loading components for different authentication states:

```tsx
import {
  AuthLoading,
  AuthInitialLoading,
  AuthSessionLoading,
  AuthProfileLoading,
  AuthPageLoading,
  AuthInlineLoading,
  AuthButtonLoading
} from '@/components/AuthLoading'

// Different loading variants
<AuthLoading variant="spinner" size="lg" />
<AuthLoading variant="skeleton" size="full" />
<AuthLoading variant="pulse" size="md" />
<AuthLoading variant="dots" size="sm" />

// Specific loading states
<AuthInitialLoading />      // Full page initial load
<AuthSessionLoading />      // Session verification
<AuthProfileLoading />      // Profile loading
<AuthPageLoading />         // Page-level loading
<AuthInlineLoading />       // Inline loading
<AuthButtonLoading />       // Button loading state
```

### AuthStatus (`src/components/AuthStatus.tsx`)

Authentication status display components:

```tsx
import { AuthStatus, AuthIndicator, AuthPanel, AuthDebugStatus } from '@/components/AuthStatus'

// Different status variants
<AuthStatus variant="compact" />
<AuthStatus variant="detailed" showActions={true} />
<AuthStatus variant="card" showActions={true} />

// Specific status components
<AuthIndicator />           // Simple indicator for headers
<AuthPanel />              // Detailed panel for settings
<AuthDebugStatus />        // Debug info (dev only)
```

### AuthErrorBoundary (`src/components/AuthErrorBoundary.tsx`)

Error boundary for authentication errors:

```tsx
import {
  AuthErrorBoundary,
  useAuthErrorHandler,
} from "@/components/AuthErrorBoundary";

// Wrap your app or components
<AuthErrorBoundary fallback={<CustomErrorUI />}>
  <MyApp />
</AuthErrorBoundary>;

// Use error handler hook
function MyComponent() {
  const { handleAuthError } = useAuthErrorHandler();

  try {
    // authentication operation
  } catch (error) {
    handleAuthError(error);
  }
}
```

## Authentication Hooks

### useAuthGuard (`src/hooks/useAuthGuard.ts`)

Basic authentication guard hook:

```tsx
import {
  useAuthGuard,
  useRequireAuth,
  useRequireRole,
  useRequireAdmin,
} from "@/hooks/useAuthGuard";

function MyComponent() {
  const { user, loading, isAuthenticated, isReady } = useAuthGuard({
    requireAuth: true,
    requiredRole: "admin",
  });

  // Or use specific hooks
  const auth = useRequireAuth();
  const adminAuth = useRequireAdmin();

  if (loading) return <Loading />;
  if (!isReady) return null;

  return <div>Protected content</div>;
}
```

### useAuthHelpers (`src/hooks/useAuthHelpers.ts`)

Enhanced authentication hook with additional helpers:

```tsx
import {
  useAuthHelpers,
  useRequireAuth,
  useRequireRole,
} from "@/hooks/useAuthHelpers";

function MyComponent() {
  const {
    // Authentication state
    isAuthenticated,
    hasCompleteProfile,
    isReady,

    // Role checks
    isAdmin,
    isStudent,
    isCollege,

    // User information
    displayName,
    initials,
    dashboardUrl,

    // Navigation helpers
    goToDashboard,
    goToLogin,

    // Error handling
    handleAuthError,

    // Guards
    requireAuthentication,
    requireAdmin,
  } = useAuthHelpers();

  useEffect(() => {
    if (!requireAuthentication()) return;
    // Component logic here
  }, [requireAuthentication]);

  return <div>Welcome, {displayName()}!</div>;
}
```

## Usage Patterns

### Page-Level Protection

```tsx
// Method 1: HOC (Recommended for pages)
import { withAuth } from "@/lib/auth";

function DashboardPage() {
  return <div>Dashboard content</div>;
}

export default withAuth(DashboardPage);

// Method 2: Hook-based
import { useRequireAuth } from "@/lib/auth";

function DashboardPage() {
  const { isReady } = useRequireAuth();

  if (!isReady) return null;

  return <div>Dashboard content</div>;
}
```

### Component-Level Protection

```tsx
// Method 1: AuthGuard component
import { AuthGuard } from "@/lib/auth";

function MyComponent() {
  return (
    <div>
      <PublicContent />
      <AuthGuard requiredRole="admin">
        <AdminOnlyContent />
      </AuthGuard>
    </div>
  );
}

// Method 2: Conditional rendering with hooks
import { useAuth } from "@/lib/auth";

function MyComponent() {
  const { isAdmin } = useAuth();

  return (
    <div>
      <PublicContent />
      {isAdmin() && <AdminOnlyContent />}
    </div>
  );
}
```

### Error Handling

```tsx
import { AuthErrorBoundary, useAuthErrorHandler } from "@/lib/auth";

// App-level error boundary
function App() {
  return (
    <AuthErrorBoundary>
      <Router>
        <Routes>{/* Your routes */}</Routes>
      </Router>
    </AuthErrorBoundary>
  );
}

// Component-level error handling
function MyComponent() {
  const { handleAuthError } = useAuthErrorHandler();

  const handleAction = async () => {
    try {
      await someAuthenticatedAction();
    } catch (error) {
      const { errorType, message } = handleAuthError(error);
      // Error is automatically handled (redirects, etc.)
      // You can also show user-friendly messages
      toast.error(message);
    }
  };
}
```

### Loading States

```tsx
import { AuthLoading, AuthInlineLoading } from "@/lib/auth";

function MyComponent() {
  const { loading } = useAuth();

  if (loading) {
    return <AuthLoading variant="skeleton" size="full" />;
  }

  return (
    <div>
      <h1>My Page</h1>
      {someCondition && <AuthInlineLoading message="Loading data..." />}
    </div>
  );
}
```

## Best Practices

### 1. Use HOCs for Page-Level Protection

```tsx
// ✅ Good - Use HOC for entire pages
export default withAuth(DashboardPage);

// ❌ Avoid - Manual authentication checks in pages
function DashboardPage() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user]);
}
```

### 2. Use AuthGuard for Component-Level Protection

```tsx
// ✅ Good - Use AuthGuard for conditional rendering
<AuthGuard requiredRole="admin">
  <AdminPanel />
</AuthGuard>;

// ❌ Avoid - Manual role checks everywhere
{
  isAdmin() && <AdminPanel />;
}
```

### 3. Centralize Error Handling

```tsx
// ✅ Good - Use error boundary at app level
<AuthErrorBoundary>
  <App />
</AuthErrorBoundary>;

// ✅ Good - Use error handler hook for specific errors
const { handleAuthError } = useAuthErrorHandler();
```

### 4. Use Appropriate Loading Components

```tsx
// ✅ Good - Use specific loading components
<AuthPageLoading />        // For full page loads
<AuthInlineLoading />      // For inline loading
<AuthButtonLoading />      // For button states
```

### 5. Leverage Authentication Utilities

```tsx
// ✅ Good - Use utility functions
const displayName = getUserDisplayName(profile);
const initials = getUserInitials(profile);
const isProtected = isProtectedRoute(pathname);

// ❌ Avoid - Reimplementing logic
const displayName = profile?.first_name + " " + profile?.last_name;
```

## Migration Guide

To migrate existing pages to use the new authentication utilities:

### Before (Manual Authentication)

```tsx
function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return <div>Dashboard</div>;
}
```

### After (Using Authentication Utilities)

```tsx
import { withAuth } from "@/lib/auth";

function DashboardPage() {
  return <div>Dashboard</div>;
}

export default withAuth(DashboardPage);
```

## Testing

The authentication utilities include comprehensive tests in `src/components/__tests__/AuthUtilities.test.tsx`. To run tests:

```bash
npm test AuthUtilities
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure to import from the correct paths
2. **TypeScript Errors**: Ensure all types are properly imported
3. **Infinite Redirects**: Check that redirect logic doesn't create loops
4. **Loading States**: Ensure loading states are properly handled

### Debug Mode

Use the `AuthDebugStatus` component in development to see authentication state:

```tsx
import { AuthDebugStatus } from "@/lib/auth";

function App() {
  return (
    <div>
      <AuthDebugStatus />
      {/* Your app */}
    </div>
  );
}
```

This component only renders in development mode and shows detailed authentication state information.
