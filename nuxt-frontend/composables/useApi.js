export const useApi = () => {
  const config = useRuntimeConfig()
  const { accessToken, refreshAccessToken } = useAuth()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest({ options }) {
      // Add authorization header if access token exists
      if (accessToken.value) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${accessToken.value}`
        }
      }
    },
    onResponseError({ response, options }) {
      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        return refreshAccessToken().then(success => {
          if (success) {
            // Retry the original request with new token
            if (accessToken.value) {
              options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${accessToken.value}`
              }
            }
            return $fetch(options.url, options)
          }
          throw new Error('Authentication failed')
        })
      }
    }
  })

  return { api }
}