export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server side
  if (process.server) return
  
  // Check localStorage for authentication using new token system
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  const user = localStorage.getItem('user')
  const isAuthenticated = !!(accessToken && refreshToken && user)

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !['/login', '/register', '/verify-email', '/', '/landing', '/apply', '/forgot-password', '/verify-reset-code', '/reset-password'].includes(to.path)) {
    return navigateTo('/login')
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && ['/login', '/register'].includes(to.path)) {
    return navigateTo('/dashboard')
  }
})