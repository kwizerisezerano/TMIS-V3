import { getStoredAuthState, isAdminOnly } from '~/utils/authGuard'

export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    const { isAuthenticated, user } = getStoredAuthState()

    if (!isAuthenticated || !user) {
      return navigateTo('/login')
    }

    if (!isAdminOnly(user)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. Admin privileges required.'
      })
    }
  }
})
