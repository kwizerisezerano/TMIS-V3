export const useApi = () => {
  const config = useRuntimeConfig()
  const { accessToken, refreshAccessToken } = useAuth()
  const authExcludedPaths = ['/v1/auth/login', '/v1/auth/refresh-token']

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest({ options }) {
      const clientUserAgent = process.client ? window.navigator.userAgent : null

      if (clientUserAgent) {
        options.headers = {
          ...options.headers,
          'X-Client-User-Agent': clientUserAgent
        }
      }

      // Add authorization header if access token exists
      if (accessToken.value) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${accessToken.value}`
        }
      }
    },
    onResponseError({ response, options }) {
      const requestUrl = String(options.url || '')
      const isAuthExcluded = authExcludedPaths.some(path => requestUrl.includes(path))

      // Handle 401 Unauthorized - try to refresh token once for non-auth endpoints
      if (response.status === 401 && !isAuthExcluded && !options._retriedAfterRefresh) {
        return refreshAccessToken().then(success => {
          if (success) {
            // Retry the original request with new token
            const retryOptions = {
              ...options,
              _retriedAfterRefresh: true
            }

            if (accessToken.value) {
              retryOptions.headers = {
                ...options.headers,
                'Authorization': `Bearer ${accessToken.value}`
              }
            }

            return $fetch(requestUrl, {
              ...retryOptions,
              baseURL: config.public.apiBase
            })
          }
          throw new Error('Authentication failed')
        })
      }
    }
  })

  return { api }
}
