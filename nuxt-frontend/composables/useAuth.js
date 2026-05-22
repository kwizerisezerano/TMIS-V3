export const useAuth = () => {
  const user = useState('user', () => null)
  const accessToken = useState('accessToken', () => null)
  const refreshToken = useState('refreshToken', () => null)
  const isAuthenticated = computed(() => !!accessToken.value)

  const login = async (email, password) => {
    const { api } = useApi()

    try {
      const response = await api('/v1/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      // Store tokens and user data
      accessToken.value = response.accessToken
      refreshToken.value = response.refreshToken
      user.value = response.user

      // Store in localStorage for persistence
      if (process.client) {
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('refreshToken', response.refreshToken)
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null

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

    try {
      // TODO: Backend endpoint /api/v1/auth/refresh-token does not exist
      // Token refresh feature requires backend implementation
      console.warn('Token refresh endpoint not implemented in backend')
      throw new Error('Token refresh not available')
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
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