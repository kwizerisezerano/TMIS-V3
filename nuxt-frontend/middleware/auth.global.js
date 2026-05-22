export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server side
  if (process.server) return
  
  // Check localStorage for authentication using new token system
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  const user = localStorage.getItem('user')
  const isAuthenticated = !!(accessToken && refreshToken && user)

  console.log(`[Auth Middleware] Route: ${to.path}, Authenticated: ${isAuthenticated}`)

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/verify-email', '/', '/landing', '/terms', '/apply', '/forgot-password', '/verify-reset-code', '/reset-password']

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !publicRoutes.includes(to.path)) {
    console.log('[Auth Middleware] Not authenticated, redirecting to login')
    return navigateTo('/login')
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && ['/login', '/register'].includes(to.path)) {
    console.log('[Auth Middleware] Already authenticated, redirecting to dashboard')
    return navigateTo('/dashboard')
  }
})