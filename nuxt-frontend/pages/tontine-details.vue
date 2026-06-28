<template>
  <div class="min-h-screen bg-white dark:bg-slate-900 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-green-600">{{ tontine?.name }}</h1>
            <UBadge v-if="tontine?.tontine_type === 'main'" color="green" size="sm" variant="solid">
              <Icon name="i-heroicons-building-office" class="w-4 h-4" />
              Main
            </UBadge>
            <UBadge v-else-if="tontine?.tontine_type === 'branch'" color="blue" size="sm" variant="subtle">
              <Icon name="i-heroicons-building-library" class="w-4 h-4" />
              Branch
            </UBadge>
          </div>
          <p v-if="tontine?.parent_tontine_name" class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Part of {{ tontine.parent_tontine_name }}
          </p>
          <p class="text-gray-600 dark:text-slate-400">Tontine Details</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">
          Back to Dashboard
        </UButton>
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-500">Loading tontine details...</div>
      </div>

      <div v-else-if="!tontine" class="text-center py-8">
        <div class="text-red-500">Tontine not found</div>
      </div>

      <div v-else class="space-y-6">
        <!-- Tontine Info -->
        <UCard class="shadow-lg">
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="text-center">
                <div class="text-3xl font-bold text-green-600">RWF {{ Number(tontine.contribution_amount).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Monthly Contribution</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-blue-600">{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Members</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-purple-600">RWF {{ Number(tontine.total_contributions || 0).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Total Contributions</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold" :class="tontine.status?.toString().toLowerCase() === 'active' ? 'text-green-600' : 'text-red-600'">
                  {{ tontine.status?.toString().toUpperCase() }}
                </div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Status</div>
              </div>
            </div>
            
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p class="text-gray-600 dark:text-slate-400">{{ tontine.description || 'No description provided' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Duration</h3>
                  <p class="text-gray-600 dark:text-slate-400">
                    {{ formatDate(tontine.start_date) }} - {{ formatDate(tontine.end_date) || 'Ongoing' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <UButton @click="navigateTo(`/contributions?tontine=${tontine.id}`)" color="green" icon="i-heroicons-banknotes">
            Make Contribution
          </UButton>
          <UButton @click="navigateTo(`/loans?tontine=${tontine.id}`)" color="blue" icon="i-heroicons-credit-card">
            Request Loan
          </UButton>
          <UButton @click="navigateTo(`/reports?tontine=${tontine.id}`)" color="purple" icon="i-heroicons-chart-bar">
            View Reports
          </UButton>
        </div>

        <!-- Recent Members -->
        <UCard class="shadow-lg">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-green-600 mb-4">Recent Members</h2>
            <div v-if="members.length === 0" class="text-center py-8">
              <div class="text-gray-500">No members found</div>
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="member in (showAllMembers ? members : members.slice(0, 6))" :key="member.id"
                   class="flex items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div class="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
                  <span class="text-green-600 dark:text-green-300 font-semibold text-sm">
                    {{ getInitials(member.names) }}
                  </span>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ member.names }}</div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">{{ member.shares || 1 }} shares</div>
                </div>
              </div>
            </div>
            <div v-if="members.length > 6" class="mt-4 text-center">
              <UButton @click="showAllMembers = !showAllMembers" variant="outline" size="sm">
                {{ showAllMembers ? 'Show Less' : `View All ${members.length} Members` }}
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
const showAllMembers = ref(false)

onMounted(async () => {
  if (tontineId) {
    await fetchTontineDetails()
  }
})

const fetchTontineDetails = async () => {
  const { api } = useApi()
  try {
    const response = await api(`/v1/tontines/${tontineId}`)
    // API returns { status, success, message, data }
    // Handle both direct data and wrapped response structures
    const data = response?.data || response
    tontine.value = data
    // Extract members if available
    if (data?.members) {
      members.value = data.members
    }
  } catch (error) {
    console.error('Failed to fetch tontine details:', error)
    tontine.value = null
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getInitials = (name) => {
  if (!name) return 'U'
  const names = name.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

definePageMeta({
  layout: 'tontine'
})
</script>