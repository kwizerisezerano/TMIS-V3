import { AUTH_ROUTES, PUBLIC_ROUTES, getStoredAuthState } from '~/utils/authGuard'

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server side
  if (process.server) return

  const { isAuthenticated } = getStoredAuthState()

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(to.path)) {
    return navigateTo('/login')
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && AUTH_ROUTES.includes(to.path)) {
    return navigateTo('/dashboard')
  }
})
