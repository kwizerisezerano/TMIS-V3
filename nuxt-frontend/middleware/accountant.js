import { getStoredAuthState, isAccountant } from '~/utils/authGuard'

export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) return

  const { isAuthenticated, user } = getStoredAuthState()

  if (!isAuthenticated || !user) {
    return navigateTo('/login')
  }

  if (!isAccountant(user)) {
    return navigateTo('/tontines')
  }
})
