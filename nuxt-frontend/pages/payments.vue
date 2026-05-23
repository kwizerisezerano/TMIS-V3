<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Payment History</h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">Track all your contributions and loan payments</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-white whitespace-nowrap">Filter by Tontine:</label>
            <select v-model="selectedTontine" @change="filterByTontine" 
                    class="w-48 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
              <option :value="null">All Tontines</option>
              <option v-for="tontine in userTontines" :key="tontine.id" :value="tontine.id">
                {{ tontine.name }}
              </option>
            </select>
          </div>
          <UButton @click="navigateTo('/dashboard')" color="gray" variant="outline" class="dark:border-gray-600 dark:text-white">
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
            Back to Dashboard
          </UButton>
        </div>
      </div>

      <!-- Payment Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="text-center p-4">
            <div v-if="loading" class="text-xl text-gray-400">Loading...</div>
            <div v-else class="text-2xl font-bold text-green-600 dark:text-green-400">RWF {{ totalContributions.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Contributions</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="text-center p-4">
            <div v-if="loading" class="text-xl text-gray-400">Loading...</div>
            <div v-else class="text-2xl font-bold text-blue-600 dark:text-blue-400">RWF {{ totalLoanPayments.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Loan Payments</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="text-center p-4">
            <div v-if="loading" class="text-xl text-gray-400">Loading...</div>
            <div v-else class="text-2xl font-bold text-red-600 dark:text-red-400">RWF {{ totalPenaltyPayments.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Penalty Payments</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="text-center p-4">
            <div v-if="loading" class="text-xl text-gray-400">Loading...</div>
            <div v-else class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ totalTransactions }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Transactions</div>
          </div>
        </UCard>
      </div>

      <!-- Payment Tabs -->
      <div class="mb-6">
        <div class="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
          <button 
            @click="activeTab = 'penalties'" 
            :class="activeTab === 'penalties' ? 'bg-green-600 dark:bg-green-700 text-white shadow-md font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'"
            class="flex-1 py-2.5 px-4 rounded-lg text-sm transition-all duration-200"
          >
            Penalty Payments
          </button>
          <button 
            @click="activeTab = 'contributions'" 
            :class="activeTab === 'contributions' ? 'bg-green-600 dark:bg-green-700 text-white shadow-md font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'"
            class="flex-1 py-2.5 px-4 rounded-lg text-sm transition-all duration-200"
          >
            Contributions
          </button>
          <button 
            @click="activeTab = 'loans'" 
            :class="activeTab === 'loans' ? 'bg-green-600 dark:bg-green-700 text-white shadow-md font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'"
            class="flex-1 py-2.5 px-4 rounded-lg text-sm transition-all duration-200"
          >
            Loan Payments
          </button>
        </div>
      </div>

      <!-- Penalty Payments Tab -->
      <div v-if="activeTab === 'penalties'">
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="p-4 sm:p-6">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Penalty Payment History
            </h2>
            <div v-if="loading" class="text-center py-8">
              <div class="text-gray-500 dark:text-gray-400">Loading penalty payments...</div>
            </div>
            <div v-else-if="penaltyPayments.length === 0" class="text-center py-8">
              <div class="text-gray-500 dark:text-gray-400">No penalty payments found</div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="payment in penaltyPayments" :key="payment.id" 
                   class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div class="mb-2 sm:mb-0">
                  <div class="font-semibold text-gray-900 dark:text-white">{{ payment.tontine_name || 'Penalty Payment' }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(payment.created_at) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Reason: {{ payment.reason || 'N/A' }}</div>
                </div>
                <div class="text-left sm:text-right">
                  <div class="text-lg font-bold text-red-600 dark:text-red-400">RWF {{ parseFloat(payment.amount).toLocaleString() }}</div>
                  <div class="flex items-center gap-2 justify-start sm:justify-end mt-1">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      Paid
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Contributions Tab -->
      <div v-if="activeTab === 'contributions'">
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="p-4 sm:p-6">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Contribution History
            </h2>
            <div v-if="loading" class="text-center py-8">
              <div class="text-gray-500 dark:text-gray-400">Loading contributions...</div>
            </div>
            <div v-else-if="contributions.length === 0" class="text-center py-8">
              <div class="text-gray-500 dark:text-gray-400">No contributions found</div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="contribution in contributions" :key="contribution.id" 
                   class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div class="mb-2 sm:mb-0">
                  <div class="font-semibold text-gray-900 dark:text-white">{{ contribution.tontine_name }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(contribution.created_at) }}</div>
                </div>
                <div class="text-left sm:text-right">
                  <div class="text-lg font-bold text-green-600 dark:text-green-400">RWF {{ parseFloat(contribution.amount).toLocaleString() }}</div>
                  <div class="flex items-center gap-2 justify-start sm:justify-end mt-1">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      Completed
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatPaymentMethod(contribution.payment_method) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Loan Payments Tab -->
      <div v-if="activeTab === 'loans'">
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="p-4 sm:p-6">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Loan Payment History
            </h2>
            <div v-if="loading" class="text-center py-8">
              <div class="text-gray-500 dark:text-gray-400">Loading loan payments...</div>
            </div>
            <div v-else-if="loanPayments.length === 0" class="text-center py-8">
              <div class="text-gray-500 dark:text-gray-400">No loan payments found</div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="payment in loanPayments" :key="payment.id" 
                   class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div class="mb-2 sm:mb-0">
                  <div class="font-semibold text-gray-900 dark:text-white">{{ payment.tontine_name }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(payment.created_at) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Loan: RWF {{ parseFloat(payment.loan_amount || payment.amount).toLocaleString() }}</div>
                </div>
                <div class="text-left sm:text-right">
                  <div class="text-lg font-bold" :class="{
                    'text-green-600 dark:text-green-400': isPaymentApproved(payment.payment_status),
                    'text-yellow-600 dark:text-yellow-400': isPaymentPending(payment.payment_status), 
                    'text-red-600 dark:text-red-400': isPaymentFailed(payment.payment_status)
                  }">RWF {{ parseFloat(payment.amount).toLocaleString() }}</div>
                  <div class="flex items-center gap-2 justify-start sm:justify-end mt-1">
                    <span class="text-xs px-2 py-0.5 rounded-full" :class="getStatusClass(payment.payment_status)">
                      {{ formatPaymentStatus(payment.payment_status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Export Options -->
      <div class="mt-8 text-center">
        <UButton @click="exportPaymentHistory" color="gray" variant="outline" size="sm" class="dark:text-white dark:border-gray-600">
          <UIcon name="i-heroicons-download" class="w-4 h-4 mr-2" />
          Export Payment History (CSV)
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
const { user, initAuth } = useAuth()

const activeTab = ref('contributions')
const loading = ref(true)
const contributions = ref([])
const loanPayments = ref([])
const penaltyPayments = ref([])
const userTontines = ref([])
const selectedTontine = ref(null)

// All data (unfiltered)
const allContributions = ref([])
const allLoanPayments = ref([])
const allPenaltyPayments = ref([])

const tontineOptions = computed(() => {
  return [{ id: null, name: 'All Tontines' }, ...userTontines.value.map(t => ({ id: t.id, name: t.name }))]
})

const totalContributions = computed(() => {
  return contributions.value.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
})

const totalLoanPayments = computed(() => {
  return loanPayments.value.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
})

const totalPenaltyPayments = computed(() => {
  return penaltyPayments.value.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
})

const totalTransactions = computed(() => {
  return contributions.value.length + loanPayments.value.length + penaltyPayments.value.length
})

onMounted(async () => {
  if (process.client) {
    initAuth()
    if (user.value) {
      await fetchPaymentHistory()
    }
  }
})

const fetchPaymentHistory = async () => {
  const { api } = useApi()
  try {
    // Fetch user's tontines for filter dropdown
    const tontinesRes = await api('/v1/tontines', { params: { userId: user.value.id, limit: 100 } })
    const tontinesData = tontinesRes.data || tontinesRes || {}
    userTontines.value = tontinesData.data || tontinesData || []

    // Fetch payment history from the dedicated history endpoint
    const historyRes = await api('/v1/payments/history', { params: { userId: user.value.id } })
    const historyData = historyRes.data || historyRes || {}
    
    // Get contributions, loan payments, and penalty payments from the history endpoint
    allContributions.value = historyData.contributions || []
    allLoanPayments.value = historyData.loanPayments || []
    allPenaltyPayments.value = historyData.penaltyPayments || []

    // Apply initial filter
    filterByTontine()

  } catch (error) {
    console.error('Failed to fetch payment history:', error)
    allContributions.value = []
    allLoanPayments.value = []
    allPenaltyPayments.value = []
    contributions.value = []
    loanPayments.value = []
    penaltyPayments.value = []
    const toast = useToast()
    toast.add({
      title: '❌ Error',
      description: 'Failed to load payment history',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const filterByTontine = () => {
  const tontineId = selectedTontine.value
  
  if (!tontineId) {
    // Show all data
    contributions.value = [...allContributions.value]
    loanPayments.value = [...allLoanPayments.value]
    penaltyPayments.value = [...allPenaltyPayments.value]
  } else {
    // Filter by tontine
    contributions.value = allContributions.value.filter(c => c.tontine_id === tontineId)
    loanPayments.value = allLoanPayments.value.filter(p => p.tontine_id === tontineId)
    penaltyPayments.value = allPenaltyPayments.value.filter(p => p.tontine_id === tontineId)
  }
}

const formatPaymentMethod = (method) => {
  if (!method) return 'N/A'
  
  const methodMap = {
    'mobile_money': 'Mobile Money',
    'bank_transfer': 'Bank Transfer',
    'cash': 'Cash',
    'card': 'Card Payment',
    'stripe': 'Stripe',
    'paypal': 'PayPal'
  }
  
  return methodMap[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const isPaymentApproved = (status) => {
  const s = (status || '').toLowerCase()
  return s === 'completed' || s === 'approved'
}

const isPaymentPending = (status) => {
  const s = (status || '').toLowerCase()
  return s === 'pending'
}

const isPaymentFailed = (status) => {
  const s = (status || '').toLowerCase()
  return s === 'failed'
}

const formatPaymentStatus = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'completed' || s === 'approved') return 'Completed'
  if (s === 'pending') return 'Pending'
  if (s === 'failed') return 'Failed'
  return status || 'N/A'
}

const getStatusClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'completed' || s === 'approved') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
  if (s === 'pending') return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
  if (s === 'failed') return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const exportPaymentHistory = () => {
  try {
    let csvContent = 'Type,Tontine,Date,Amount,Status,Payment Method\n'
    
    contributions.value.forEach(c => {
      csvContent += `Contribution,"${c.tontine_name}",${c.created_at},Completed,${formatPaymentMethod(c.payment_method)}\n`
    })
    
    loanPayments.value.forEach(p => {
      csvContent += `Loan Payment,"${p.tontine_name}",${p.created_at},${p.amount},${p.payment_status},${formatPaymentMethod(p.payment_method)}\n`
    })
    
    penaltyPayments.value.forEach(p => {
      csvContent += `Penalty Payment,"${p.tontine_name || 'N/A'}",${p.created_at},${p.amount},Paid,Mobile Money\n`
    })
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    
    const toast = useToast()
    toast.add({
      title: '✅ Export Complete',
      description: 'Payment history downloaded successfully',
      color: 'green'
    })
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Export Failed',
      description: 'Failed to export payment history',
      color: 'red'
    })
  }
}

definePageMeta({
  layout: 'default'
})
</script>
