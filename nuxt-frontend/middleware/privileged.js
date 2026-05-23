import { getStoredAuthState, isAdminLevel } from '~/utils/authGuard'

export default defineNuxtRouteMiddleware(() => {
  if (process.server) return

  const { isAuthenticated, user } = getStoredAuthState()

  if (!isAuthenticated || !user) {
    return navigateTo('/login')
  }

  if (!isAdminLevel(user)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Privileged access required.'
    })
  }
})
