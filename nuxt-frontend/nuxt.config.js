// https://nuxt.com/docs/api/configuration/nuxt-config
export default {
  compatibilityDate: '2026-01-17',
  devtools: { enabled: true },
  experimental: {
    appManifest: false
  },
  
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt'
  ],
  
  css: ['~/assets/css/main.css', '~/assets/css/dark-mode.css'],
  
  // App configuration for responsiveness
  app: {
    head: {
      meta: [
        // Responsive viewport settings
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes' },
        // Mobile browser settings
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#10b981', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#111827', media: '(prefers-color-scheme: dark)' }
      ],
      link: [
        // Preconnect for performance
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ]
    }
  },
  
  runtimeConfig: {
    // Private keys (only available on server-side)
    // public: {
    //   apiSecret: process.env.API_SECRET
    // }
    
    // Public keys (exposed to client-side)
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3300/api',
      socketBase: process.env.SOCKET_BASE_URL || process.env.API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3300'
    }
  },
  
  ui: {
    global: true
  },
  
  colorMode: {
    preference: 'light',
    classSuffix: ''
  }
}
