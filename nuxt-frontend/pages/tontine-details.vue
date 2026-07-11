<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-4xl mx-auto">

      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p class="text-gray-500 dark:text-gray-400">Loading tontine details...</p>
        </div>
      </div>

      <div v-else-if="!tontine" class="text-center py-24">
        <Icon name="i-heroicons-exclamation-circle" class="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400">Tontine not found.</p>
        <UButton @click="navigateTo('/dashboard')" class="mt-4" variant="outline">Back to Dashboard</UButton>
      </div>

      <div v-else>
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
              <Icon name="i-heroicons-building-library" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ tontine.name }}</h1>
                <UBadge v-if="tontine.tontine_type === 'main'" color="emerald" size="sm">Main</UBadge>
                <UBadge v-else-if="tontine.tontine_type === 'branch'" color="blue" size="sm" variant="subtle">Branch</UBadge>
              </div>
              <p v-if="tontine.parent_tontine_name" class="text-sm text-gray-500 dark:text-gray-400">Part of {{ tontine.parent_tontine_name }}</p>
            </div>
          </div>
          <UButton @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">Dashboard</UButton>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-gray-100 dark:border-gray-700 text-center">
            <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">RWF {{ Number(tontine.contribution_amount).toLocaleString() }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Monthly Contribution</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-gray-100 dark:border-gray-700 text-center">
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Members</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-gray-100 dark:border-gray-700 text-center">
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">RWF {{ Number(tontine.total_contributions || 0).toLocaleString() }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Contributions</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-gray-100 dark:border-gray-700 text-center">
            <p class="text-2xl font-bold" :class="(tontine.status||'').toLowerCase() === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
              {{ (tontine.status || 'N/A').toUpperCase() }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Status</p>
          </div>
        </div>

        <!-- Info card -->
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800 mb-6">
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description</p>
              <p class="text-gray-700 dark:text-gray-300">{{ tontine.description || 'No description provided.' }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Duration</p>
              <p class="text-gray-700 dark:text-gray-300">
                {{ formatDate(tontine.start_date) }} — {{ formatDate(tontine.end_date) || 'Ongoing' }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Action buttons -->
        <div class="flex flex-wrap gap-3 mb-6">
          <UButton @click="navigateTo(`/contributions?tontine=${tontine.id}`)" color="emerald" icon="i-heroicons-banknotes">
            Make Contribution
          </UButton>
          <UButton @click="navigateTo(`/loans?tontine=${tontine.id}`)" color="blue" icon="i-heroicons-credit-card">
            Request Loan
          </UButton>
          <UButton @click="navigateTo(`/surplus`)" color="purple" icon="i-heroicons-gift">
            My Overpayments
          </UButton>
        </div>

        <!-- Members -->
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="p-6">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Members ({{ members.length }})</h2>
            <div v-if="members.length === 0" class="text-center py-8 text-gray-400">No members found.</div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div v-for="member in (showAll ? members : members.slice(0, 6))" :key="member.id"
                   class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div class="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-emerald-700 dark:text-emerald-300 font-semibold text-xs">{{ getInitials(member.names) }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ member.names }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ member.shares || 1 }} share(s)</p>
                </div>
              </div>
            </div>
            <div v-if="members.length > 6" class="mt-4 text-center">
              <UButton @click="showAll = !showAll" variant="ghost" size="sm" color="gray">
                {{ showAll ? 'Show Less' : `View All ${members.length} Members` }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const tontineId = route.query.id
const tontine = ref(null)
const members = ref([])
const loading = ref(true)
const showAll = ref(false)

onMounted(async () => {
  if (tontineId) await fetchTontineDetails()
})

const fetchTontineDetails = async () => {
  const { api } = useApi()
  try {
    const res = await api(`/v1/tontines/${tontineId}`)
    const data = res?.data || res
    tontine.value = data
    if (data?.members) members.value = data.members
  } catch (e) {
    tontine.value = null
  } finally {
    loading.value = false
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null
const getInitials = (name) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name[0].toUpperCase()
}

definePageMeta({ layout: 'default' })
</script>
