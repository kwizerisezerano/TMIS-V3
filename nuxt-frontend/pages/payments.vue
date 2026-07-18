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
            <div v-else class="text-2xl font-bold text-green-600 dark:text-green-400">{{ formatDashboardAmount(totalContributions) }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Contributions</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="text-center p-4">
            <div v-if="loading" class="text-xl text-gray-400">Loading...</div>
            <div v-else class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ formatDashboardAmount(totalLoanPayments) }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Loan Payments</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="text-center p-4">
            <div v-if="loading" class="text-xl text-gray-400">Loading...</div>
            <div v-else class="text-2xl font-bold text-red-600 dark:text-red-400">{{ formatDashboardAmount(totalPenaltyPayments) }}</div>
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
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Penalty Payment History</h2>
            <div v-if="loading" class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">Loading...</div></div>
            <div v-else-if="payments.length === 0" class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">No penalty payments found</div></div>
            <div v-else class="space-y-3">
              <div v-for="payment in payments" :key="payment.id"
                   class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div class="mb-2 sm:mb-0">
                  <div class="font-semibold text-gray-900 dark:text-white">{{ payment.tontine_name || 'Penalty Payment' }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(payment.created_at) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Reason: {{ payment.reason || 'N/A' }}</div>
                </div>
                <div class="text-left sm:text-right">
                  <div class="text-lg font-bold text-red-600 dark:text-red-400">RWF {{ parseFloat(payment.amount).toLocaleString() }}</div>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Paid</span>
                </div>
              </div>
              <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <span class="text-sm text-gray-500 dark:text-gray-400">Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} total)</span>
                <div class="flex gap-2">
                  <UButton size="xs" variant="outline" :disabled="currentPage === 1" @click="currentPage--; fetchPage()">Previous</UButton>
                  <UButton size="xs" variant="outline" :disabled="currentPage === totalPages" @click="currentPage++; fetchPage()">Next</UButton>
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
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Contribution History</h2>
            <div v-if="loading" class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">Loading...</div></div>
            <div v-else-if="payments.length === 0" class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">No contributions found</div></div>
            <div v-else class="space-y-3">
              <div v-for="contribution in payments" :key="contribution.id"
                   class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div class="mb-2 sm:mb-0">
                  <div class="font-semibold text-gray-900 dark:text-white">{{ contribution.tontine_name }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(contribution.created_at) }}</div>
                </div>
                <div class="text-left sm:text-right">
                  <div class="text-lg font-bold text-green-600 dark:text-green-400">RWF {{ parseFloat(contribution.amount).toLocaleString() }}</div>
                  <div class="flex items-center gap-2 justify-start sm:justify-end mt-1">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Completed</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatPaymentMethod(contribution.payment_method) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <span class="text-sm text-gray-500 dark:text-gray-400">Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} total)</span>
                <div class="flex gap-2">
                  <UButton size="xs" variant="outline" :disabled="currentPage === 1" @click="currentPage--; fetchPage()">Previous</UButton>
                  <UButton size="xs" variant="outline" :disabled="currentPage === totalPages" @click="currentPage++; fetchPage()">Next</UButton>
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
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Loan Payment History</h2>
            <div v-if="loading" class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">Loading...</div></div>
            <div v-else-if="payments.length === 0" class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">No loan payments found</div></div>
            <div v-else class="space-y-3">
              <div v-for="payment in payments" :key="payment.id"
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
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="getStatusClass(payment.payment_status)">{{ formatPaymentStatus(payment.payment_status) }}</span>
                </div>
              </div>
              <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <span class="text-sm text-gray-500 dark:text-gray-400">Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} total)</span>
                <div class="flex gap-2">
                  <UButton size="xs" variant="outline" :disabled="currentPage === 1" @click="currentPage--; fetchPage()">Previous</UButton>
                  <UButton size="xs" variant="outline" :disabled="currentPage === totalPages" @click="currentPage++; fetchPage()">Next</UButton>
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
const { formatDashboardAmount } = useCurrency()
const { user, initAuth } = useAuth()

const activeTab = ref('contributions')
const loading = ref(true)
const payments = ref([])
const userTontines = ref([])
const selectedTontine = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const pageSize = 10

// Summary totals (fetched separately per tab switch)
const totalContributions = ref(0)
const totalLoanPayments = ref(0)
const totalPenaltyPayments = ref(0)
const totalTransactions = ref(0)

const tontineOptions = computed(() => {
  return [{ id: null, name: 'All Tontines' }, ...userTontines.value.map(t => ({ id: t.id, name: t.name }))]
})

onMounted(async () => {
  if (process.client) {
    initAuth()
    if (user.value) {
      await fetchTontines()
      await Promise.all([fetchSummary(), fetchPage()])
    }
  }
})

watch(activeTab, () => {
  currentPage.value = 1
  fetchPage()
})

const fetchTontines = async () => {
  const { api } = useApi()
  try {
    const res = await api('/v1/tontines', { params: { userId: user.value.id, limit: 100 } })
    const d = res.data || res || {}
    userTontines.value = d.data || d || []
  } catch {}
}

const fetchSummary = async () => {
  const { api } = useApi()
  try {
    const params = { userId: user.value.id, type: 'summary' }
    if (selectedTontine.value) params.tontineId = selectedTontine.value
    const res = await api('/v1/payments/history', { params })
    const d = res.data || res || {}
    totalContributions.value = d.totalContributions || 0
    totalLoanPayments.value = d.totalLoanPayments || 0
    totalPenaltyPayments.value = d.totalPenaltyPayments || 0
    totalTransactions.value = d.totalTransactions || 0
  } catch {}
}

const fetchPage = async () => {
  const { api } = useApi()
  loading.value = true
  try {
    const typeMap = { contributions: 'contributions', loans: 'loans', penalties: 'penalties' }
    const params = {
      userId: user.value.id,
      type: typeMap[activeTab.value],
      page: currentPage.value,
      limit: pageSize
    }
    if (selectedTontine.value) params.tontineId = selectedTontine.value

    const res = await api('/v1/payments/history', { params })
    const d = res.data || res || {}
    payments.value = d.data || []
    totalPages.value = d.pagination?.pages || 1
    totalItems.value = d.pagination?.total || 0
  } catch (error) {
    console.error('Failed to fetch payment history:', error)
    payments.value = []
    const toast = useToast()
    toast.add({ title: '❌ Error', description: 'Failed to load payment history', color: 'red' })
  } finally {
    loading.value = false
  }
}

const filterByTontine = () => {
  currentPage.value = 1
  fetchSummary()
  fetchPage()
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
    payments.value.forEach(p => {
      const type = activeTab.value === 'contributions' ? 'Contribution' : activeTab.value === 'loans' ? 'Loan Payment' : 'Penalty Payment'
      csvContent += `${type},"${p.tontine_name || 'N/A'}",${p.created_at},${p.amount},${p.payment_status || p.status || 'N/A'},${formatPaymentMethod(p.payment_method)}\n`
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
