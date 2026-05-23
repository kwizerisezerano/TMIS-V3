<template>
  <div class="space-y-6 bg-white min-h-screen p-6">
    <div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-lg">
      <h1 class="text-3xl font-bold">The Future Digital Tontine</h1>
      <p class="text-green-100">Modern savings and investment platform</p>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div class="bg-white/20 p-3 rounded">
          <p class="text-sm">Total Tontines</p>
          <p class="text-xl font-bold">{{ userTontines.length }}</p>
        </div>
        <div class="bg-white/20 p-3 rounded">
          <p class="text-sm">Total Shares</p>
          <p class="text-xl font-bold">{{ totalShares }}</p>
        </div>
        <div class="bg-white/20 p-3 rounded">
          <p class="text-sm">Role</p>
          <p class="text-xl font-bold uppercase">{{ user?.role || 'Member' }}</p>
        </div>
        <div class="bg-white/20 p-3 rounded">
          <p class="text-sm">Total Saved (All Tontines)</p>
          <p class="text-xl font-bold">{{ formatDashboardAmount(totalSaved) }}</p>
        </div>
      </div>
    </div>

    <!-- My Tontines -->
    <UCard>
      <template #header>
        <h3 class="text-xl font-semibold">My Tontines</h3>
      </template>
      
      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-500">Loading tontines...</div>
      </div>
      
      <div v-else-if="userTontines.length === 0" class="text-center py-8">
        <div class="text-gray-500">No tontines joined yet</div>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="tontine in userTontines" :key="tontine.id" class="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-3">
            <h4 class="font-semibold text-lg">{{ tontine.name }}</h4>
            <UBadge :color="tontine.status === 'active' ? 'green' : 'gray'" size="xs">
              {{ tontine.status }}
            </UBadge>
          </div>
          
          <p class="text-sm text-gray-600 mb-3">{{ tontine.description }}</p>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Monthly Contribution:</span>
              <span class="font-semibold">{{ (tontine.user_shares * tontine.contribution_amount).toLocaleString() }} RWF</span>
            </div>
            <div class="flex justify-between">
              <span>Members:</span>
              <span>{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</span>
            </div>
            <div class="flex justify-between">
              <span>Frequency:</span>
              <span class="capitalize">{{ tontine.contribution_frequency }}</span>
            </div>
          </div>
          
          <div class="mt-4 flex gap-2">
            <UButton @click="navigateTo(`/tontine-details?id=${tontine.id}`)" size="xs" class="flex-1">
              View Details
            </UButton>
            <UButton @click="navigateTo(`/manage?tontine=${tontine.id}`)" v-if="canManageSelectedTontine" size="xs" color="green" variant="outline">
              Manage
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Tontine-Specific Stats -->
    <div v-if="userTontines.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="tontine in userTontines" :key="tontine.id" class="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border">
        <h4 class="font-semibold text-lg mb-3 text-blue-800">{{ tontine.name }}</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">My Contribution:</span>
            <span class="font-semibold text-blue-700">{{ (tontine.user_shares * tontine.contribution_amount).toLocaleString() }} RWF/month</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Total Saved:</span>
            <span class="font-semibold text-green-600">{{ formatCurrency(getTontineSavings(tontine.id)) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Available Loan:</span>
            <span class="font-semibold text-purple-600">{{ formatCurrency(Math.floor(getTontineSavings(tontine.id) * 2 / 3)) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Performance:</span>
            <span class="font-semibold text-orange-600">{{ getTontinePerformance(tontine.id) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard>
        <template #header>
          <h3 class="font-semibold flex items-center gap-2">
            <Icon name="i-heroicons-chart-bar" class="w-5 h-5 text-green-600" />
            Performance
          </h3>
        </template>
        
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ performanceScore }}%</p>
          <p class="text-sm text-gray-600">Overall Rate (All Tontines)</p>
        </div>
      </UCard>

      <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border flex flex-col items-center justify-center">
        <p class="text-sm text-green-700 font-medium">Max Loan Eligibility</p>
        <p class="text-xl font-bold text-blue-600">{{ formatDashboardAmount(maxLoanAmount) }}</p>
        <p class="text-sm text-gray-600">Max Available (All Tontines)</p>
      </div>

      <UCard>
        <template #header>
          <h3 class="font-semibold flex items-center gap-2">
            <Icon name="i-heroicons-calendar" class="w-5 h-5 text-yellow-600" />
            Next Payment
          </h3>
        </template>
        
        <div class="text-center">
          <p class="text-lg font-bold text-yellow-600">Jan 17, 2025</p>
          <p class="text-sm text-gray-600">Due Date</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { canManageTontine } from '~/utils/authGuard'

const { user, initAuth } = useAuth()
const { api } = useApi()
const { formatDashboardAmount, formatCurrency } = useCurrency()

const loading = ref(true)
const userTontines = ref([])
const totalSaved = ref(0)
const contributionsByTontine = ref({})

const maxLoanAmount = computed(() => {
  return (totalSaved.value * 2) / 3
})

const performanceScore = computed(() => {
  return 85
})

const totalShares = computed(() => {
  return userTontines.value.reduce((sum, tontine) => sum + (tontine.user_shares || 1), 0)
})

const canManageSelectedTontine = computed(() => canManageTontine(user.value))

onMounted(async () => {
  await fetchUserTontines()
  await fetchTotalSaved()
})

const fetchUserTontines = async () => {
  try {
    const response = await api(`/tontines/user/${user.value?.id}`)
    userTontines.value = response
    console.log('User tontines with shares:', response)
  } catch (error) {
    console.error('Failed to fetch user tontines:', error)
  } finally {
    loading.value = false
  }
}

const fetchTotalSaved = async () => {
  try {
    const contributions = await api(`/contributions/user/${user.value?.id}`)
    totalSaved.value = contributions
      .filter(c => c.payment_status === 'Approved')
      .reduce((sum, c) => sum + c.amount, 0)
    
    // Group contributions by tontine
    contributionsByTontine.value = contributions.reduce((acc, contrib) => {
      if (!acc[contrib.tontine_id]) {
        acc[contrib.tontine_id] = []
      }
      acc[contrib.tontine_id].push(contrib)
      return acc
    }, {})
  } catch (error) {
    console.error('Failed to fetch total saved:', error)
  }
}

const getTontineSavings = (tontineId) => {
  const tontineContribs = contributionsByTontine.value[tontineId] || []
  return tontineContribs
    .filter(c => c.payment_status === 'Approved')
    .reduce((sum, c) => sum + c.amount, 0)
}

const getTontinePerformance = (tontineId) => {
  const tontineContribs = contributionsByTontine.value[tontineId] || []
  if (tontineContribs.length === 0) return 0
  const approvedCount = tontineContribs.filter(c => c.payment_status === 'Approved').length
  return Math.round((approvedCount / tontineContribs.length) * 100)
}

definePageMeta({
  layout: 'default'
})
</script>
