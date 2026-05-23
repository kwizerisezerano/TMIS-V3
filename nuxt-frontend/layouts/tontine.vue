<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Main Sidebar (collapsed on tontine pages) -->
    <aside class="fixed inset-y-0 left-0 z-50 w-16 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col"
      :class="{ '-translate-x-full': !sidebarOpen }"
      role="navigation"
      aria-label="Main navigation">
      <!-- Logo - Mini -->
      <NuxtLink to="/dashboard" class="flex items-center justify-center h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <img src="~/assets/logo/logo.png" alt="Logo" class="w-10 h-10 object-contain" />
      </NuxtLink>

      <!-- Mini Navigation -->
      <nav class="flex-1 overflow-y-auto py-6 space-y-2 px-2">
        <NuxtLink to="/dashboard" title="Dashboard"
                  class="flex items-center justify-center p-3 rounded-lg transition-colors duration-200"
                  :class="$route?.path === '/dashboard'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-home" class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink to="/tontines" title="My Tontines"
                  class="flex items-center justify-center p-3 rounded-lg transition-colors duration-200"
                  :class="$route?.path.startsWith('/tontine')
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-building-library" class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink to="/contributions" title="Contributions"
                  class="flex items-center justify-center p-3 rounded-lg transition-colors duration-200"
                  :class="$route?.path === '/contributions'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-banknotes" class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink to="/loans" title="Loans"
                  class="flex items-center justify-center p-3 rounded-lg transition-colors duration-200"
                  :class="$route?.path === '/loans'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-credit-card" class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink to="/meetings" title="Meetings"
                  class="flex items-center justify-center p-3 rounded-lg transition-colors duration-200"
                  :class="$route?.path === '/meetings'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-users" class="w-6 h-6" />
        </NuxtLink>
      </nav>

      <!-- Bottom Actions -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-2 space-y-2">
        <NuxtLink to="/login" @click="handleLogout" title="Logout"
                  class="flex items-center justify-center p-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Icon name="i-heroicons-arrow-right-on-rectangle" class="w-6 h-6" />
        </NuxtLink>
      </div>
    </aside>

    <!-- Tontine Sidebar (right side) -->
    <aside class="fixed inset-y-0 right-0 z-40 w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0"
      :class="tontineSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'"
      role="navigation"
      aria-label="Tontine navigation">
      <!-- Tontine Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-semibold text-gray-900 dark:text-white">Tontine Navigation</h2>
          <UButton @click="tontineSidebarOpen = false" icon="i-heroicons-x-mark" size="xs" color="gray" variant="ghost" />
        </div>
        <div v-if="currentTontine" class="text-sm">
          <p class="font-medium text-green-600 dark:text-green-400 truncate">{{ currentTontine.name }}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">{{ currentTontine.member_count || 0 }} members</p>
        </div>
      </div>

      <!-- Tontine Navigation -->
      <nav class="p-4 space-y-2">
        <NuxtLink v-if="currentTontineId" :to="`/tontine-details?id=${currentTontineId}`"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  :class="$route?.path === '/tontine-details'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-information-circle" class="w-5 h-5" />
          <span>Overview</span>
        </NuxtLink>
        <NuxtLink v-if="currentTontineId" :to="`/contributions?tontine=${currentTontineId}`"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  :class="$route?.path === '/contributions'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-banknotes" class="w-5 h-5" />
          <span>Contributions</span>
        </NuxtLink>
        <NuxtLink v-if="currentTontineId" :to="`/loans?tontine=${currentTontineId}`"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  :class="$route?.path === '/loans'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-credit-card" class="w-5 h-5" />
          <span>Loans</span>
        </NuxtLink>
        <NuxtLink v-if="currentTontineId" :to="`/payments?tontine=${currentTontineId}`"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  :class="$route?.path === '/payments'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-currency-dollar" class="w-5 h-5" />
          <span>Payments</span>
        </NuxtLink>
        <NuxtLink v-if="currentTontineId" :to="`/reports?tontine=${currentTontineId}`"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  :class="$route?.path === '/reports'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-chart-bar" class="w-5 h-5" />
          <span>Reports</span>
        </NuxtLink>
        <NuxtLink v-if="currentTontineId" :to="`/penalties?tontine=${currentTontineId}`"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  :class="$route?.path === '/penalties'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'">
          <Icon name="i-heroicons-scale" class="w-5 h-5" />
          <span>Penalties</span>
        </NuxtLink>
        
        <!-- Divider -->
        <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
        
        <!-- All Tontines Dashboard (Admin Only) -->
        <NuxtLink v-if="canOpenTontineDashboard" to="/tontines-dashboard"
                  class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          <Icon name="i-heroicons-building-office-2" class="w-5 h-5" />
          <span>All Tontines</span>
        </NuxtLink>
      </nav>

      <!-- Quick Stats -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-slate-400">My Shares</span>
            <span class="font-semibold text-blue-600">{{ currentTontine?.user_shares || 1 }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-slate-400">Monthly</span>
            <span class="font-semibold text-gray-700 dark:text-gray-300">RWF {{ ((currentTontine?.user_shares || 1) * (currentTontine?.contribution_amount || 0)).toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </aside>

      <!-- Main Content -->
    <div class="lg:pl-16 lg:pr-72">
      <!-- Mobile Header -->
      <header class="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div class="flex items-center justify-between px-4 py-3">
          <button @click="sidebarOpen = !sidebarOpen"
                  class="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Open menu">
            <Icon name="i-heroicons-bars-3" class="w-6 h-6 text-gray-600 dark:text-white" />
          </button>
          <div class="flex items-center gap-2">
            <span class="font-bold text-lg text-gray-900 dark:text-white">The Future</span>
          </div>
          <button @click="tontineSidebarOpen = !tontineSidebarOpen"
                  class="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Open tontine menu">
            <Icon name="i-heroicons-compass" class="w-6 h-6 text-gray-600 dark:text-white" />
          </button>
        </div>
      </header>

      <!-- Desktop Toggle for Tontine Sidebar -->
      <div class="hidden lg:flex items-center justify-end p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <UButton @click="tontineSidebarOpen = !tontineSidebarOpen" 
                 icon="i-heroicons-compass" 
                 color="gray" 
                 variant="outline"
                 size="sm">
          {{ tontineSidebarOpen ? 'Hide' : 'Show' }} Tontine Menu
        </UButton>
      </div>

      <!-- Page Content -->
      <main class="p-4 sm:p-6 bg-white dark:bg-gray-900 min-h-screen">
        <slot />
      </main>
    </div>

    <!-- Mobile Sidebar Overlays -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" 
         class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
         aria-hidden="true"></div>
    <div v-if="tontineSidebarOpen" @click="tontineSidebarOpen = false"
         class="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
         aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { canViewTontineDashboard } from '~/utils/authGuard'

const sidebarOpen = ref(false)
const tontineSidebarOpen = ref(false)
const { user, logout } = useAuth()
const currentTontine = ref(null)
const currentTontineId = ref(null)

// Get tontine ID from route
const route = useRoute()
const canOpenTontineDashboard = computed(() => canViewTontineDashboard(user.value))

const fetchCurrentTontine = async () => {
  if (!currentTontineId.value) return
  try {
    const { api } = useApi()
    const response = await api(`/v1/tontines/${currentTontineId.value}`)
    currentTontine.value = response.data || response
  } catch (error) {
    console.error('Failed to fetch current tontine:', error)
  }
}

onMounted(() => {
  currentTontineId.value = route.query.tontine || route.query.id
  
  // Fetch tontine details if ID exists
  if (currentTontineId.value) {
    fetchCurrentTontine()
  }
})

// Watch for route changes
watch(() => route.query, () => {
  currentTontineId.value = route.query.tontine || route.query.id
  if (currentTontineId.value) {
    fetchCurrentTontine()
  }
}, { immediate: true })

const handleLogout = () => {
  logout()
}

definePageMeta({
  // This layout is used for tontine-related pages
})
</script>
