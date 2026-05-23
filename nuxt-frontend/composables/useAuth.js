export const useAuth = () => {
  const user = useState('user', () => null)
  const accessToken = useState('accessToken', () => null)
  const refreshToken = useState('refreshToken', () => null)
  const refreshPromise = useState('refreshPromise', () => null)
  const isAuthenticated = computed(() => !!accessToken.value)

  const setAuthData = (authData) => {
    accessToken.value = authData.accessToken
    refreshToken.value = authData.refreshToken
    user.value = authData.user

    if (process.client) {
      localStorage.setItem('accessToken', authData.accessToken)
      localStorage.setItem('refreshToken', authData.refreshToken)
      localStorage.setItem('user', JSON.stringify(authData.user))
    }
  }

  const login = async (email, password) => {
    const { api } = useApi()

    try {
      const response = await api('/v1/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      const authData = response.data || response
      if (!authData.accessToken || !authData.refreshToken || !authData.user) {
        throw new Error('Invalid login response')
      }

      setAuthData(authData)

      return authData
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    refreshPromise.value = null

    if (process.client) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }

    navigateTo('/login')
  }

  const register = async (userData) => {
    const { api } = useApi()

    try {
      const response = await api('/v1/auth/register', {
        method: 'POST',
        body: userData
      })

      return response
    } catch (error) {
      throw error
    }
  }

  const verifyEmail = async (verificationKey, verificationCode) => {
    const { api } = useApi()

    try {
      // TODO: Backend endpoint /api/v1/auth/verify-email does not exist
      // This feature requires backend implementation
      console.warn('verifyEmail endpoint not implemented in backend')
      throw new Error('Email verification not available')
    } catch (error) {
      throw error
    }
  }

  const resendOtp = async (verificationKey) => {
    const { api } = useApi()

    try {
      // TODO: Backend endpoint /api/v1/auth/resend-otp does not exist
      // This feature requires backend implementation
      console.warn('resendOtp endpoint not implemented in backend')
      throw new Error('Resend OTP not available')
    } catch (error) {
      throw error
    }
  }

  // Refresh access token
  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      logout()
      return false
    }

    if (refreshPromise.value) {
      return refreshPromise.value
    }

    try {
      const config = useRuntimeConfig()
      refreshPromise.value = $fetch(`${config.public.apiBase}/v1/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          refreshToken: refreshToken.value
        }
      }).then((response) => {
        const authData = response.data || response
        if (!authData.accessToken || !authData.refreshToken || !authData.user) {
          throw new Error('Invalid refresh response')
        }

        setAuthData(authData)
        return true
      })

      return await refreshPromise.value
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    } finally {
      refreshPromise.value = null
    }
  }

  // Initialize auth state from localStorage on client side
  const initAuth = () => {
    if (process.client) {
      const storedAccessToken = localStorage.getItem('accessToken')
      const storedRefreshToken = localStorage.getItem('refreshToken')
      const storedUser = localStorage.getItem('user')

      if (storedAccessToken && storedRefreshToken && storedUser) {
        accessToken.value = storedAccessToken
        refreshToken.value = storedRefreshToken
        user.value = JSON.parse(storedUser)
      }
    }
  }

  // Call initAuth when composable is used
  if (process.client) {
    initAuth()
  }

  return {
    user,
    accessToken: readonly(accessToken),
    refreshToken: readonly(refreshToken),
    isAuthenticated,
    login,
    logout,
    register,
    verifyEmail,
    resendOtp,
    refreshAccessToken,
    initAuth
  }
}
