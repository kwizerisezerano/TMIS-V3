<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Sidebar -->
        <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col"
          :class="{ '-translate-x-full': !sidebarOpen }"
          role="navigation"
          aria-label="Main navigation">

      <!-- Logo -->
      <NuxtLink to="/dashboard" class="flex items-center justify-between h-20 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div class="flex items-center gap-3">
          <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1783173071/logo_yfob25.png" alt="The Future Logo" class="w-12 h-12 object-contain" />
          <span class="font-bold text-xl text-gray-900 dark:text-white">The Future</span>
        </div>
      </NuxtLink>

      <!-- Navigation - wrapped in ClientOnly to prevent SSR hydration issues -->
      <ClientOnly>
        <nav v-if="navigation && navigation.length" class="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <NuxtLink v-for="(item, index) in navigation" :key="item?.name || index" :to="item?.href || '/'"
                    @click="sidebarOpen = false"
                    class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200"
                    :class="$route?.path === item?.href
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'">
            <Icon v-if="item?.icon" :name="item.icon" class="w-5 h-5 mr-3" />
            <span v-else class="w-5 h-5 mr-3"></span>
            {{ item?.name || '' }}
          </NuxtLink>
        </nav>

        <!-- Loading state for navigation -->
        <div v-else class="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <div v-for="n in 7" :key="n" class="flex items-center px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
            <div class="w-5 h-5 mr-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          </div>
        </div>

        <template #fallback>
          <div class="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            <div v-for="n in 7" :key="n" class="flex items-center px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
              <div class="w-5 h-5 mr-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
          </div>
        </template>
      </ClientOnly>

      <!-- Sidebar Footer with User Profile, Notifications, Theme Toggle, and Logout -->
      <ClientOnly>
        <div v-if="user" class="border-t border-gray-200 dark:border-gray-700">
          <!-- Notifications -->
          <div ref="notificationsContainer" class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 relative">
            <button @click="showNotifications = !showNotifications" class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <Icon name="i-heroicons-bell" class="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span class="text-gray-700 dark:text-gray-300">Notifications</span>
              </div>
              <div v-if="unreadCount > 0" class="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </div>
            </button>
            
            <!-- Notifications Dropdown -->
            <div v-if="showNotifications" class="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-96 overflow-y-auto">
              <div v-if="notifications.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications
              </div>
              <div v-else>
                <div v-for="notification in notifications" :key="notification.id" 
                     class="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                     :class="{ 'bg-emerald-50 dark:bg-emerald-900/20': !notification.is_read }"
                     @click="markAsRead(notification.id)">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">
                      <div class="w-2.5 h-2.5 rounded-full" :class="notification.is_read ? 'bg-gray-300 dark:bg-gray-500' : 'bg-emerald-500 animate-pulse'"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-sm text-gray-900 dark:text-white">{{ notification.title }}</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">{{ notification.message }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatDate(notification.created_at) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Theme Toggle -->
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <button @click="toggleTheme" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Icon :name="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'" class="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span class="text-gray-700 dark:text-gray-300">{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
            </button>
          </div>

          <!-- User Profile -->
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-emerald-600 dark:text-emerald-300 font-semibold text-sm">{{ getUserInitials() }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ user.names }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user.email }}</p>
              </div>
            </div>
          </div>

          <!-- Logout Link -->
          <div class="px-4 py-3">
            <NuxtLink to="/login" @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Icon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5" />
              <span>Logout</span>
            </NuxtLink>
          </div>
        </div>

        <template #fallback>
          <div class="border-t border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
              <div class="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div class="ml-3 flex-1 min-w-0">
                <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1"></div>
                <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              </div>
            </div>
          </div>
        </template>
      </ClientOnly>
    </aside>

      <!-- Main Content -->
    <div class="lg:pl-64">
      <!-- Mobile Header (only visible on mobile) -->
      <header class="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div class="flex items-center justify-between px-4 py-3">
          <button @click="sidebarOpen = !sidebarOpen" 
                  class="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Open menu">
            <Icon name="i-heroicons-bars-3" class="w-6 h-6 text-gray-600 dark:text-white" />
          </button>
          <div class="flex items-center gap-2">
            <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1783173071/logo_yfob25.png" alt="Logo" class="w-8 h-8 object-contain" />
            <span class="font-bold text-lg text-gray-900 dark:text-white">The Future</span>
          </div>
          <div class="w-10"></div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 sm:p-6 bg-white dark:bg-gray-900 min-h-screen">
        <slot />
      </main>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" 
         class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
         aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { isAdminLevel } from '~/utils/authGuard'

const sidebarOpen = ref(false)
const showUserDropdown = ref(false)
const showNotifications = ref(false)
const { user } = useAuth()
const notifications = ref([])
const unreadCount = ref(0)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const notificationsContainer = ref(null)

// Get user data and initialize notifications
let notificationInterval = null

onMounted(async () => {
  if (!process.client) return

  // Wait for user data to be available
  await nextTick()

  if (user?.value) {
    await fetchNotifications()

    // Set up periodic refresh for notifications
    notificationInterval = setInterval(fetchNotifications, 30000) // Refresh every 30 seconds

    // Set up auto-refresh listener
    setupAutoRefresh()
  }

  // Close dropdown when clicking outside notifications container
  const handleClickOutside = (e) => {
    if (notificationsContainer.value && !notificationsContainer.value.contains(e.target)) {
      showNotifications.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)

  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    if (notificationInterval) {
      clearInterval(notificationInterval)
    }
  })
})

const setupAutoRefresh = () => {
  // Listen for storage events (cross-tab communication)
  window.addEventListener('storage', (e) => {
    if (e.key === 'auto-refresh-trigger') {
      console.log('Auto-refresh triggered by storage event')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  })
  
  // Listen for custom events
  window.addEventListener('auto-refresh', () => {
    console.log('Auto-refresh triggered by custom event')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  })
}

const handleLogout = () => {
  const { logout } = useAuth()
  logout()
  showUserDropdown.value = false
}

const getUserInitials = () => {
  if (!user.value?.names) return 'U'
  const names = user.value.names.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase()
  }
  return user.value.names[0].toUpperCase()
}

const fetchNotifications = async () => {
  try {
    const { api } = useApi()
    // Pass userId to filter notifications for current user only
    const userId = user.value?.id
    if (!userId) return
    
    const result = await api('/v1/notifications/', { params: { userId } })
    const data = result.data || result
    notifications.value = data
    unreadCount.value = Array.isArray(data) ? data.filter(n => !n.is_read).length : 0
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  }
}

const markAsRead = async (notificationId) => {
  try {
    const { api } = useApi()
    await api(`/v1/notifications/${notificationId}/read`, { method: 'PUT' })
    
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.is_read) {
      notification.is_read = true
      unreadCount.value--
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  
  // Handle MySQL datetime format: "YYYY-MM-DD HH:MM:SS"
  // Backend stores in UTC, so we need to parse it correctly
  let date
  
  if (dateString.includes('T')) {
    // ISO format
    date = new Date(dateString)
  } else {
    // MySQL format - treat as UTC
    date = new Date(dateString.replace(' ', 'T') + 'Z')
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  const now = new Date()
  const diff = now - date
  
  if (diff < 0) return 'Just now' // Future date
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return date.toLocaleDateString()
}

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const isAdmin = computed(() => isAdminLevel(user.value))

  const navigation = computed(() => {
  // Base navigation available to all roles
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'i-heroicons-home' },
    { name: 'My Tontines', href: '/tontines', icon: 'i-heroicons-building-library' },
    { name: 'Contributions', href: '/contributions', icon: 'i-heroicons-banknotes' },
    { name: 'Loans', href: '/loans', icon: 'i-heroicons-credit-card' },
    { name: 'Payments', href: '/payments', icon: 'i-heroicons-banknotes' },
    { name: 'Reports', href: '/reports', icon: 'i-heroicons-chart-bar' },
    { name: 'Meetings', href: '/meetings', icon: 'i-heroicons-users' },
    { name: 'Penalties', href: '/penalties', icon: 'i-heroicons-scale' },
    { name: 'My Surplus', href: '/surplus', icon: 'i-heroicons-gift' }
  ]

  // If no user yet, show a safe default (hide admin-only reports)
  if (!user.value) {
    return baseNavigation.filter(item => item.name !== 'Reports')
  }

  // Admins see full navigation
  if (isAdmin.value) {
    return baseNavigation
  }

  // Members also see all navigation items including Reports
  return baseNavigation
})

</script>
