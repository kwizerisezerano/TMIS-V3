<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">

    <!-- Sidebar: logo + nav links only -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col"
      :class="{ '-translate-x-full': !sidebarOpen }"
      role="navigation"
      aria-label="Main navigation">

      <!-- Logo -->
      <NuxtLink to="/dashboard" class="flex items-center gap-3 h-16 px-6 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
        <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1783173071/logo_yfob25.png" alt="The Future Logo" class="w-10 h-10 object-contain" />
        <span class="font-bold text-xl text-gray-900 dark:text-white">The Future</span>
      </NuxtLink>

      <!-- Navigation -->
      <ClientOnly>
        <nav v-if="navigation && navigation.length" class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <NuxtLink
            v-for="(item, index) in navigation"
            :key="item?.name || index"
            :to="item?.href || '/'"
            @click="sidebarOpen = false"
            class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200"
            :class="$route?.path === item?.href
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-600'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'">
            <Icon v-if="item?.icon" :name="item.icon" class="w-5 h-5 mr-3 flex-shrink-0" />
            <span v-else class="w-5 h-5 mr-3"></span>
            {{ item?.name || '' }}
            <span v-if="item.href === '/notifications' && unreadCount > 0" class="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center leading-none">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </NuxtLink>
        </nav>
        <div v-else class="flex-1 px-4 py-4 space-y-1">
          <div v-for="n in 9" :key="n" class="flex items-center px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
            <div class="w-5 h-5 mr-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          </div>
        </div>
        <template #fallback>
          <div class="flex-1 px-4 py-4 space-y-1">
            <div v-for="n in 9" :key="n" class="flex items-center px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
              <div class="w-5 h-5 mr-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
          </div>
        </template>
      </ClientOnly>
    </aside>

    <!-- Main area -->
    <div class="lg:pl-64 flex flex-col min-h-screen">

      <!-- Top Navbar -->
      <header class="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between px-4 h-16">

          <!-- Mobile: hamburger + logo -->
          <div class="flex items-center gap-3">
            <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Open menu">
              <Icon name="i-heroicons-bars-3" class="w-6 h-6 text-gray-600 dark:text-white" />
            </button>
            <div class="lg:hidden flex items-center gap-2">
              <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1783173071/logo_yfob25.png" alt="Logo" class="w-7 h-7 object-contain" />
              <span class="font-bold text-gray-900 dark:text-white">The Future</span>
            </div>
          </div>

          <div class="hidden lg:block"></div>

          <!-- Right side actions -->
          <ClientOnly>
            <div class="flex items-center gap-2">

              <!-- Theme toggle -->
              <button @click="toggleTheme" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" :title="isDark ? 'Light Mode' : 'Dark Mode'">
                <Icon :name="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <!-- Notifications -->
              <div ref="notificationsContainer" class="relative">
                <button @click="showNotifications = !showNotifications" class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Icon name="i-heroicons-bell" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span v-if="unreadCount > 0" class="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center leading-none">
                    {{ unreadCount > 9 ? '9+' : unreadCount }}
                  </span>
                </button>
                <div v-if="showNotifications" class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50">
                  <!-- Header -->
                  <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <span class="font-semibold text-sm text-gray-900 dark:text-white">Unread ({{ unreadNotifications.length }})</span>
                  </div>
                  <!-- Unread list -->
                  <div class="max-h-72 overflow-y-auto">
                    <div v-if="unreadNotifications.length === 0" class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No unread notifications</div>
                    <div v-else>
                      <div v-for="notification in unreadNotifications" :key="notification.id"
                           class="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 cursor-pointer transition-colors bg-emerald-50/50 dark:bg-emerald-900/10"
                           @click="markAsRead(notification.id)">
                        <div class="flex items-start gap-3">
                          <div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-emerald-500"></div>
                          <div class="flex-1 min-w-0">
                            <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ notification.title }}</p>
                            <p class="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">{{ notification.message }}</p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatDate(notification.created_at) }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- Footer: View All -->
                  <div class="border-t border-gray-100 dark:border-gray-700">
                    <NuxtLink to="/notifications" @click="showNotifications = false"
                      class="flex items-center justify-center gap-1 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-b-xl">
                      View all notifications
                      <Icon name="i-heroicons-arrow-right" class="w-4 h-4" />
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <!-- User info — click to logout -->
              <button v-if="user"
                @click="showLogoutConfirm = true"
                class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors"
                title="Click to logout">
                <div class="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-emerald-600 dark:text-emerald-300 font-semibold text-xs">{{ getUserInitials() }}</span>
                </div>
                <div class="hidden sm:block text-left">
                  <p class="text-sm font-medium text-gray-900 dark:text-white leading-tight">{{ user.names }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">{{ user.email }}</p>
                </div>
              </button>
            </div>
          </ClientOnly>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-6 bg-white dark:bg-gray-900">
        <slot />
      </main>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false"
         class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
         aria-hidden="true"></div>

    <!-- Logout Confirmation Modal -->
    <div v-if="showLogoutConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 mx-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Icon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">Sign out</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ user?.names }}</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to logout?</p>
        <div class="flex gap-3">
          <button @click="showLogoutConfirm = false" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button @click="confirmLogout" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { isAdminLevel } from '~/utils/authGuard'

const sidebarOpen = ref(false)
const showNotifications = ref(false)
const showLogoutConfirm = ref(false)
const { user } = useAuth()
const notifications = ref([])
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const notificationsContainer = ref(null)

const unreadNotifications = computed(() => notifications.value.filter(n => !n.is_read))
const unreadCount = computed(() => unreadNotifications.value.length)

onMounted(async () => {
  if (!process.client) return
  await nextTick()
  if (user?.value) {
    await fetchNotifications()
    // Real-time: connect socket and listen for new notifications
    const { connect, on } = useSocket()
    connect()
    on('notification-new', (data) => {
      notifications.value.unshift({
        id: Date.now(),
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        is_read: false,
        created_at: new Date().toISOString()
      })
    })
  }
  const handleClickOutside = (e) => {
    if (notificationsContainer.value && !notificationsContainer.value.contains(e.target)) {
      showNotifications.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

const confirmLogout = () => {
  const { logout } = useAuth()
  showLogoutConfirm.value = false
  logout()
}

const getUserInitials = () => {
  if (!user.value?.names) return 'U'
  const names = user.value.names.split(' ')
  return names.length >= 2 ? (names[0][0] + names[1][0]).toUpperCase() : user.value.names[0].toUpperCase()
}

const fetchNotifications = async () => {
  try {
    const { api } = useApi()
    const userId = user.value?.id
    if (!userId) return
    const result = await api('/v1/notifications/', { params: { userId } })
    const raw = result.data || result
    const data = Array.isArray(raw) ? raw : []
    notifications.value = data.map(n => ({ ...n, is_read: !!(n.is_read ?? n.read) }))
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
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString.replace(' ', 'T') + 'Z')
  if (isNaN(date.getTime())) return 'Invalid date'
  const diff = Date.now() - date
  if (diff < 0 || diff < 60000) return 'Just now'
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
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'i-heroicons-home' },
    { name: 'My Tontines', href: '/tontines', icon: 'i-heroicons-building-library' },
    { name: 'Contributions', href: '/contributions', icon: 'i-heroicons-banknotes' },
    { name: 'Loans', href: '/loans', icon: 'i-heroicons-credit-card' },
    { name: 'Payments', href: '/payments', icon: 'i-heroicons-banknotes' },
    { name: 'Reports', href: '/reports', icon: 'i-heroicons-chart-bar' },
    { name: 'Meetings', href: '/meetings', icon: 'i-heroicons-users' },
    { name: 'Penalties', href: '/penalties', icon: 'i-heroicons-scale' },
    { name: 'My Surplus', href: '/surplus', icon: 'i-heroicons-gift' },
    { name: 'Notifications', href: '/notifications', icon: 'i-heroicons-bell' }
  ]
  if (!user.value) return baseNavigation.filter(item => item.name !== 'Reports')
  return baseNavigation
})
</script>
