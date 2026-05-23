<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">My Penalties</h1>
    </div>

    <!-- Tontine Selection -->
    <div v-if="!selectedTontine" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard v-for="tontine in userTontines" :key="tontine.id" class="hover:shadow-lg transition-shadow cursor-pointer" @click="selectTontine(tontine)">
        <div class="text-center p-4">
          <div class="text-4xl mb-4">🏦</div>
          <h3 class="text-lg font-semibold mb-2">{{ tontine.name }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{{ tontine.description }}</p>
          <div class="text-sm">
            <p><span class="font-medium">Members:</span> {{ tontine.member_count }}/{{ tontine.max_members }}</p>
            <p><span class="font-medium">Contribution:</span> RWF {{ tontine.contribution_amount?.toLocaleString() }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Selected Tontine Penalties -->
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-semibold">{{ selectedTontine.name }} - Penalties</h2>
          <p class="text-gray-600 dark:text-gray-400">{{ selectedTontine.description }}</p>
        </div>
        <UButton @click="selectedTontine = null" variant="outline">
          Back to Tontines
        </UButton>
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading penalties...</p>
      </div>

      <div v-else-if="penalties.length === 0" class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400">No penalties found for this tontine.</p>
      </div>

      <div v-else>
        <div class="overflow-x-auto mb-6">
          <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="penalty in penalties" :key="penalty.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4">
                  <div class="font-medium text-red-600 dark:text-red-400">RWF {{ penalty.amount.toLocaleString() }}</div>
                  <div v-if="penalty.loan_amount" class="text-xs text-gray-500 dark:text-gray-400">Loan: RWF {{ penalty.loan_amount.toLocaleString() }}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {{ penalty.reason }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div>{{ formatDate(penalty.created_at) }}</div>
                  <div v-if="penalty.paid_at" class="text-xs text-green-600 dark:text-green-400">Paid: {{ formatDate(penalty.paid_at) }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs" :class="getStatusClass(penalty.status)">
                      {{ penalty.status }}
                    </span>
                    <div class="text-xs text-gray-500 italic">
                      Penalty payments are recorded by the administrator.
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Penalty Summary -->
        <UCard class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Penalty Summary</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Total Penalties -->
            <div class="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ totalPenalties }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Penalties</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                  <span class="text-gray-600 dark:text-gray-300">📋</span>
                </div>
              </div>
            </div>
            
            <!-- Pending Penalties -->
            <div class="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-600">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ pendingPenalties }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <span class="text-yellow-600 dark:text-yellow-400">⏳</span>
                </div>
              </div>
            </div>
            
            <!-- Paid Penalties -->
            <div class="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-600">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ paidPenalties }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Paid</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span class="text-green-600 dark:text-green-400">✓</span>
                </div>
              </div>
            </div>
            
            <!-- Outstanding Amount -->
            <div class="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-600">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xl font-bold text-red-600 dark:text-red-400">RWF {{ outstandingAmount.toLocaleString() }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Outstanding</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span class="text-red-600 dark:text-red-400">💰</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const { user, initAuth } = useAuth()
const penalties = ref([])
const userTontines = ref([])
const selectedTontine = ref(null)
const loading = ref(false)

const fetchUserTontines = async () => {
  const { api } = useApi()
  try {
    initAuth()
    if (!user.value) {
      userTontines.value = []
      return
    }
    // TODO: Backend endpoint /api/v1/tontines/user/:userId does not exist
    const response = await api('/v1/tontines', { params: { userId: user.value.id } })
    const data = response.data || response
    userTontines.value = Array.isArray(data) ? data : (data.data || [])
  } catch (error) {
    console.error('Error fetching user tontines:', error)
    userTontines.value = []
  }
}

const selectTontine = (tontine) => {
  selectedTontine.value = tontine
  fetchPenalties(tontine.id)
}

const fetchPenalties = async (tontineId) => {
  loading.value = true
  const { api } = useApi()
  try {
    // TODO: Backend endpoint /api/v1/penalties/user does not exist
    // Using /api/v1/penalties/user/:userId as alternative
    if (!user.value) {
      penalties.value = []
      return
    }
    const response = await api(`/v1/penalties/user/${user.value.id}`)
    const data = response.data || response
    const allPenalties = Array.isArray(data) ? data : (data.data || [])
    penalties.value = allPenalties.filter(p => p.tontine_id === tontineId)
  } catch (error) {
    console.error('Error fetching penalties:', error)
    penalties.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'pending':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const totalPenalties = computed(() => penalties.value.length)
const pendingPenalties = computed(() => penalties.value.filter(p => p.status === 'pending').length)
const paidPenalties = computed(() => penalties.value.filter(p => p.status === 'paid').length)
const totalAmount = computed(() => penalties.value.reduce((sum, p) => sum + parseFloat(p.amount), 0))
const outstandingAmount = computed(() => 
  penalties.value.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0)
)

onMounted(() => {
  fetchUserTontines()
})
</script>
