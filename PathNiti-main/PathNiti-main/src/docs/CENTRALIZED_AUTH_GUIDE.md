# Centralized Authentication Guide

This guide explains how to use the enhanced centralized authentication system in PathNiti.

## Overview

The authentication system has been enhanced with centralized redirect helpers and error handling to eliminate duplicate authentication logic across pages. All pages should now use the central authentication provider instead of performing individual authentication checks.

## Key Features

### 1. Centralized Redirect Helpers

- `requireAuth()`: Ensures user is authenticated and has a profile
- `requireRole(role)`: Ensures user has a specific role

### 2. Authentication Hooks

- `useAuthGuard()`: Flexible hook for authentication requirements
- `useRequireAuth()`: Convenience hook for pages requiring authentication
- `useRequireAdmin()`: Convenience hook for admin-only pages
- `useRequireStudent()`: Convenience hook for student-only pages
- `useRequireCollege()`: Convenience hook for college-only pages

### 3. Higher-Order Components (HOCs)

- `withAuth()`: Wraps components with authentication requirements
- `withAdminAuth()`: Wraps components with admin-only access
- `withStudentAuth()`: Wraps components with student-only access
- `withCollegeAuth()`: Wraps components with college-only access

### 4. UI Components

- `AuthGate`: Conditional rendering based on authentication state
- `AuthStatusIndicator`: Shows current authentication status
- `AuthPageLoading`: Loading component for authentication checks
- `AuthErrorBoundary`: Error boundary for authentication failures

## Usage Patterns

### Pattern 1: Direct requireAuth() Usage

```tsx
export default function ProtectedPage() {
  const { user, profile, loading, requireAuth } = useAuth();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  if (loading) return <AuthPageLoading />;

  return <div>Protected content</div>;
}
```

### Pattern 2: Using Authentication Hooks

```tsx
export default function DashboardPage() {
  const { user, profile, loading, isReady } = useRequireAuth();

  if (loading) return <AuthPageLoading />;

  return <div>Welcome, {profile?.first_name}!</div>;
}
```

### Pattern 3: Using Higher-Order Components

```tsx
const ProtectedPage = withAuth(() => {
  const { profile } = useAuth();
  return <div>Welcome, {profile?.first_name}!</div>;
});

export default ProtectedPage;
```

### Pattern 4: Role-Based Access

```tsx
// Admin-only page
export default function AdminPage() {
  const { profile, loading } = useRequireAdmin();

  if (loading) return <AuthPageLoading />;

  return <div>Admin Dashboard</div>;
}

// Or using HOC
const AdminPage = withAdminAuth(() => {
  return <div>Admin Dashboard</div>;
});
```

### Pattern 5: Conditional Rendering

```tsx
export default function MixedPage() {
  return (
    <div>
      <h1>Public Content</h1>

      <AuthGate fallback={<p>Please log in</p>}>
        <div>Protected content</div>
      </AuthGate>

      <AuthGate requireRole="admin" fallback={<p>Admin only</p>}>
        <div>Admin content</div>
      </AuthGate>
    </div>
  );
}
```

## Migration Guide

### Before (Old Pattern)

```tsx
export default function OldDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setUser(user);
      setProfile(profile);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <div>Dashboard content</div>;
}
```

### After (New Pattern)

```tsx
export default function NewDashboard() {
  const { user, profile, loading } = useRequireAuth();

  if (loading) return <AuthPageLoading />;

  return <div>Dashboard content</div>;
}
```

## Error Handling

The system includes an `AuthErrorBoundary` that automatically catches and handles authentication errors:

- Network errors during authentication
- Session validation failures
- Critical authentication failures

The error boundary provides:

- User-friendly error messages
- Retry functionality
- Automatic redirect to login for critical errors

## Best Practices

1. **Use the appropriate hook for your needs**:
   - `useRequireAuth()` for general protected pages
   - `useRequireAdmin()` for admin-only pages
   - `useAuthGuard()` for custom requirements

2. **Prefer hooks over direct requireAuth() calls**:
   - Hooks handle the useEffect logic for you
   - More declarative and easier to test

3. **Use HOCs for simple page protection**:
   - Good for pages that just need authentication
   - Keeps component logic clean

4. **Use AuthGate for mixed content**:
   - When you have both public and protected content
   - Better user experience than redirecting

5. **Always handle loading states**:
   - Use `AuthPageLoading` for consistency
   - Don't render protected content while loading

## Testing

The authentication system is designed to be testable:

```tsx
// Mock the auth context for testing
jest.mock("@/app/providers", () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockProfile,
    loading: false,
    requireAuth: jest.fn(),
    requireRole: jest.fn(),
  }),
}));
```

## Performance Benefits

The centralized system provides:

1. **Eliminated duplicate API calls**: No more individual `getUser()` calls
2. **Cached authentication state**: Shared across all components
3. **Optimized re-renders**: Context updates only when necessary
4. **Reduced bundle size**: Less duplicate authentication logic

## Security Considerations

- Server-side middleware still enforces authentication at the request level
- Client-side helpers are for UX only, not security
- Role checks are validated server-side in API routes
- Session validation happens centrally in the AuthProvider
