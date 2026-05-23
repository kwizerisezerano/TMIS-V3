import { AUTH_ROUTES, PUBLIC_ROUTES, getStoredAuthState } from '~/utils/authGuard'

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server side
  if (process.server) return

  const { isAuthenticated } = getStoredAuthState()

  console.log(`[Auth Middleware] Route: ${to.path}, Authenticated: ${isAuthenticated}`)

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(to.path)) {
    console.log('[Auth Middleware] Not authenticated, redirecting to login')
    return navigateTo('/login')
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && AUTH_ROUTES.includes(to.path)) {
    console.log('[Auth Middleware] Already authenticated, redirecting to dashboard')
    return navigateTo('/dashboard')
  }
})
