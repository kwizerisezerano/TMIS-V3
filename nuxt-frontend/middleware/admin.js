export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (!userData) {
      return navigateTo('/login')
    }
    
    const user = JSON.parse(userData)
    if (user.role !== 'admin' && user.role !== 'president' && user.role !== 'accountant') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. Admin privileges required.'
      })
    }
  }
})