<template>
  <div class="max-w-3xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ unreadCount }} unread</p>
      </div>
      <UButton v-if="unreadCount > 0" variant="outline" size="sm" @click="markAllRead" :loading="markingAll">
        Mark all as read
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 6" :key="n" class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 animate-pulse flex gap-3">
        <div class="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-1.5 flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!notifications.length" class="text-center py-20">
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon name="i-heroicons-bell-slash" class="w-8 h-8 text-gray-400" />
      </div>
      <p class="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
    </div>

    <!-- Notifications list -->
    <div v-else class="space-y-2">
      <div
        v-for="n in notifications"
        :key="n.id"
        @click="handleClick(n)"
        class="bg-white dark:bg-gray-800 rounded-xl p-4 border transition-colors cursor-pointer flex gap-3"
        :class="n.is_read
          ? 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          : 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'">

        <!-- Dot -->
        <div class="mt-1.5 flex-shrink-0">
          <div class="w-2.5 h-2.5 rounded-full" :class="n.is_read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-emerald-500'"></div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ n.title }}</p>
            <div class="flex items-center gap-2 flex-shrink-0">
              <!-- Type badge -->
              <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="typeBadge(n.type)">{{ n.type || 'info' }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{{ formatDate(n.created_at) }}</span>
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">{{ n.message }}</p>
        </div>
      </div>

      <!-- Load more -->
      <div v-if="hasMore" class="pt-2 text-center">
        <UButton variant="ghost" color="gray" size="sm" @click="loadMore" :loading="loadingMore">
          Load more
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
const { api } = useApi()
const { user } = useAuth()

const notifications = ref([])
const loading = ref(true)
const markingAll = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(false)

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

const extractList = (res) => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.data?.data)) return res.data.data
  return []
}

const fetchNotifications = async (append = false) => {
  try {
    const res = await api('/v1/notifications/', { params: { userId: user.value?.id, limit: 20, page: page.value } })
    const list = extractList(res)
    // normalize is_read field (backend uses `read` column)
    const normalized = list.map(n => ({ ...n, is_read: n.is_read ?? n.read ?? false }))
    if (append) notifications.value.push(...normalized)
    else notifications.value = normalized
    // check if more pages
    const total = res?.pagination?.total ?? res?.data?.pagination?.total ?? list.length
    hasMore.value = notifications.value.length < total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  page.value++
  await fetchNotifications(true)
}

const handleClick = async (n) => {
  if (!n.is_read) {
    try {
      await api(`/v1/notifications/${n.id}/read`, { method: 'PUT' })
      n.is_read = true
    } catch {}
  }
}

const markAllRead = async () => {
  markingAll.value = true
  try {
    await api('/v1/notifications/mark-all-read', { method: 'POST' })
    notifications.value.forEach(n => { n.is_read = true })
  } catch {}
  markingAll.value = false
}

const typeBadge = (type) => {
  const map = {
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    loan: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    contribution: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    penalty: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    payment: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return map[type] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString.replace(' ', 'T') + 'Z')
  if (isNaN(date.getTime())) return ''
  const diff = Date.now() - date
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  fetchNotifications()
  if (process.client) {
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
})
definePageMeta({ layout: 'default' })
</script>
