export const useAdminUsers = () => {
  const { api } = useApi()
  const adminUsers = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchAdminUsers = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api('/auth/admins')
      adminUsers.value = response
      console.log('Admin users fetched:', adminUsers.value)
    } catch (err) {
      error.value = err.message || 'Failed to fetch admin users'
      console.error('Error fetching admin users:', err)
    } finally {
      loading.value = false
    }
  }

  const isAdminEmail = (email) => {
    return adminUsers.value.some(admin => admin.email === email)
  }

  const getAdminUsers = () => {
    return adminUsers.value
  }

  return {
    adminUsers: readonly(adminUsers),
    loading: readonly(loading),
    error: readonly(error),
    fetchAdminUsers,
    isAdminEmail,
    getAdminUsers
  }
}
