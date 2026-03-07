/**
 * Authentication utilities and helpers
 * Centralized exports for all authentication-related functionality
 */

// Core authentication utilities
export * from "../auth-utils";

// Authentication hooks
export {
  useAuthGuard,
  useRequireAuth,
  useRequireRole,
  useRequireAdmin,
  useRequireStudent,
  useRequireCollege,
} from "../../hooks/useAuthGuard";
export { useAuthHelpers } from "../../hooks/useAuthHelpers";

// Authentication components
export {
  withAuth,
  withAdminAuth,
  withStudentAuth,
  withCollegeAuth,
} from "../../components/withAuth";
export {
  AuthErrorBoundary,
  useAuthErrorHandler,
} from "../../components/AuthErrorBoundary";
export {
  AuthStatusIndicator,
  AuthLoadingSpinner,
  AuthPageLoading,
  AuthGate,
} from "../../components/AuthStatusIndicator";
export {
  AuthGuard,
  AdminGuard,
  StudentGuard,
  CollegeGuard,
} from "../../components/AuthGuard";
export {
  AuthLoading,
  AuthInitialLoading,
  AuthSessionLoading,
  AuthProfileLoading,
  AuthInlineLoading,
  AuthButtonLoading,
} from "../../components/AuthLoading";
export {
  AuthStatus,
  AuthIndicator,
  AuthPanel,
  AuthDebugStatus,
} from "../../components/AuthStatus";

// Main authentication provider and hook
export { useAuth } from "../../app/providers";

/**
 * Common authentication patterns and examples
 */

// Example: Page with authentication requirement
export const withAuthExample = `
import { withAuth } from '@/lib/auth'

function MyPage() {
  return <div>Protected content</div>
}

export default withAuth(MyPage)
`;

// Example: Component with role-based access
export const authGuardExample = `
import { AuthGuard } from '@/lib/auth'

function MyComponent() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminOnlyContent />
    </AuthGuard>
  )
}
`;

// Example: Using authentication hooks
export const authHookExample = `
import { useAuthHelpers } from '@/lib/auth'

function MyComponent() {
  const { isAuthenticated, requireAdmin, displayName } = useAuthHelpers()
  
  useEffect(() => {
    requireAdmin()
  }, [requireAdmin])
  
  if (!isAuthenticated()) return null
  
  return <div>Welcome, {displayName()}!</div>
}
`;

// Example: Error handling
export const errorHandlingExample = `
import { AuthErrorBoundary } from '@/lib/auth'

function App() {
  return (
    <AuthErrorBoundary>
      <MyAuthenticatedApp />
    </AuthErrorBoundary>
  )
}
`;
