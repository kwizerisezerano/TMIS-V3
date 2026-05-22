<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">The Future Dashboard</h1>
          <p class="text-gray-600 dark:text-white/80">Welcome back, {{ userName }}!</p>
        </div>
      </div>

      <!-- Financial Overview -->
      <div class="mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Financial Overview</h2>
          <!-- Simple Filter -->
          <div class="flex items-center gap-3">
            <USelect
              v-model="selectedMonth"
              :options="monthOptions"
              placeholder="Select Month"
              class="w-40"
              @change="applyFilters"
            />
            <USelect
              v-model="selectedYear"
              :options="yearOptions"
              placeholder="Select Year"
              class="w-32"
              @change="applyFilters"
            />
            <UButton variant="ghost" color="gray" size="sm" @click="resetFilters">
              Reset
            </UButton>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Summary Cards -->
          <div class="bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-700 dark:to-emerald-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-50 text-sm font-medium">Total Savings</p>
                <p class="text-2xl font-bold mt-1">RWF {{ stats.totalContributions.toLocaleString() }}</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-banknotes" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-emerald-50 text-sm font-medium">Active Tontines</p>
                <p class="text-2xl font-bold mt-1">{{ userTontines.length }}</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-building-library" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-700 to-green-800 dark:from-emerald-800 dark:to-green-900 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-emerald-50 text-sm font-medium">Outstanding Loans</p>
                <p class="text-2xl font-bold mt-1">RWF {{ stats.totalLoans.toLocaleString() }}</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-credit-card" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-teal-600 to-cyan-700 dark:from-teal-700 dark:to-cyan-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-teal-50 text-sm font-medium">Net Worth</p>
                <p class="text-2xl font-bold mt-1">RWF {{ Math.max(0, (stats.totalContributions - stats.totalLoans - stats.penalties.pending)).toLocaleString() }}</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-chart-pie" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- All Charts on Same Line -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <!-- Savings by Tontine -->
          <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
            <div class="p-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Savings by Tontine</h3>
              <div class="h-60">
                <canvas ref="savingsChartCanvas"></canvas>
              </div>
            </div>
          </UCard>

          <!-- Financial Distribution -->
          <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
            <div class="p-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Financial Distribution</h3>
              <div class="h-60">
                <canvas ref="distributionChartCanvas"></canvas>
              </div>
            </div>
          </UCard>

          <!-- Complete Financial Overview -->
          <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
            <div class="p-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Financial Overview</h3>
              <div class="h-60">
                <canvas ref="comprehensiveChartCanvas"></canvas>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Penalties Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600 dark:text-white/70">Pending Penalties</span>
                <Icon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-500" />
              </div>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">RWF {{ stats.penalties.pending.toLocaleString() }}</p>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div class="bg-red-500 h-2 rounded-full" :style="{ width: Math.min((stats.penalties.pending / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' }"></div>
              </div>
            </div>
          </UCard>

          <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600 dark:text-white/70">Paid Penalties</span>
                <Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              </div>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">RWF {{ stats.penalties.paid.toLocaleString() }}</p>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div class="bg-green-500 h-2 rounded-full" :style="{ width: Math.min((stats.penalties.paid / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' }"></div>
              </div>
            </div>
          </UCard>

          <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600 dark:text-white/70">Loan Repayment</span>
                <Icon name="i-heroicons-arrow-path" class="w-5 h-5 text-blue-500" />
              </div>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.totalLoanRequested > 0 ? ((stats.totalLoanPaid / stats.totalLoanRequested) * 100).toFixed(1) : 0 }}%</p>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div class="bg-blue-500 h-2 rounded-full" :style="{ width: stats.totalLoanRequested > 0 ? ((stats.totalLoanPaid / stats.totalLoanRequested) * 100) + '%' : '0%' }"></div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
          <div class="p-4 sm:p-6">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Recent Activity</h3>
            <div v-if="loading" class="text-center py-4">
              <div class="text-gray-500 dark:text-gray-400">Loading activity...</div>
            </div>
            <div v-else class="space-y-3">
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-white">Total Contributions</p>
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">All time</p>
                </div>
                <div class="text-gray-600 dark:text-gray-400 font-semibold text-sm sm:text-base flex-shrink-0 ml-2">RWF {{ stats.totalContributions.toLocaleString() }}</div>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-white">Loan Requests</p>
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total requested</p>
                </div>
                <div class="text-orange-600 dark:text-orange-400 font-semibold text-sm sm:text-base flex-shrink-0 ml-2">RWF {{ stats.totalLoanRequested.toLocaleString() }}</div>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-white">My Tontines</p>
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Joined tontines</p>
                </div>
                <div class="text-blue-600 dark:text-blue-400 font-semibold text-sm sm:text-base flex-shrink-0 ml-2">{{ userTontines.length }}</div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
          <div class="p-4 sm:p-6">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Constitution Highlights</h3>
            <div class="space-y-3">
              <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p class="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Maximum 20 Members</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Article 7.a - Member limit</p>
              </div>
              <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p class="font-medium text-gray-900 dark:text-white text-sm sm:text-base">20% Retention on Resignation</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Article 8 - Resignation terms</p>
              </div>
              <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p class="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Penalties Apply</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Article 36 - Late payments & absences</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
// Chart.js imports - only load on client side
let Chart = null
let registerables = null

if (process.client) {
  const chartjs = await import('chart.js')
  Chart = chartjs.Chart
  registerables = chartjs.registerables
  Chart.register(...registerables)
}

const userName = ref('Member')
const stats = ref({
  totalContributions: 0,
  activeTontines: 0,
  totalLoans: 0,
  totalLoanPaid: 0,
  totalLoanRequested: 0,
  memberCount: 0,
  penalties: {
    pending: 0,
    paid: 0,
    total: 0
  }
})
const loading = ref(true)
const user = ref(null)
const userTontines = ref([])
const contributionsByTontine = ref({})

// Raw data storage for filtering
const allContributions = ref([])
const allLoans = ref([])
const allPayments = ref([])
const allPenalties = ref([])

// Simple filter state
const selectedMonth = ref(null)
const selectedYear = ref(null)

// Month options
const monthOptions = [
  { label: 'All Months', value: null },
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 }
]

// Year options - from 2024 to current year + 1
const currentYear = new Date().getFullYear()
const yearOptions = [{ label: 'All Years', value: null }]
for (let year = 2024; year <= currentYear + 1; year++) {
  yearOptions.push({ label: String(year), value: year })
}

// Chart refs
const savingsChartCanvas = ref(null)
const distributionChartCanvas = ref(null)
const comprehensiveChartCanvas = ref(null)

// Chart instances
let savingsChart = null
let distributionChart = null
let comprehensiveChart = null

// Get user data and fetch dashboard data
onMounted(async () => {
  if (process.client) {
    const { user: authUser, initAuth, logout } = useAuth()
    initAuth()
    await new Promise(resolve => setTimeout(resolve, 100))
    if (authUser.value) {
      user.value = authUser.value
      try {
        const { api } = useApi()
        await api(`/v1/users/${user.value.id}`)
        userName.value = user.value.names || 'Member'
        await fetchDashboardData()
      } catch (error) {
        console.error('User validation failed:', error)
        logout()
      }
    } else {
      await navigateTo('/login')
    }
  }
})

onUnmounted(() => {
  if (savingsChart) savingsChart.destroy()
  if (distributionChart) distributionChart.destroy()
  if (comprehensiveChart) comprehensiveChart.destroy()
})

const fetchDashboardData = async () => {
  const { api } = useApi()
  try {
    // Fetch tontines
    const tontinesRes = await api('/v1/tontines', { params: { userId: user.value.id, limit: 100 } })
    userTontines.value = extractArrayData(tontinesRes)
    stats.value.activeTontines = userTontines.value.length
    
    // Fetch contributions
    const contribRes = await api('/v1/contributions', { params: { userId: user.value.id, includeStats: 'true', limit: 10000 } })
    console.log('=== Contribution API Response ===', contribRes)
    let contribData = extractObjectData(contribRes)
    allContributions.value = Array.isArray(contribData) 
      ? contribData 
      : (contribData.contributions || (contribData.data?.contributions) || extractArrayData(contribRes))
    console.log('Fetched contributions:', allContributions.value.length)
    console.log('All contributions data:', JSON.stringify(allContributions.value, null, 2))

    // Fetch loans
    const loansRes = await api('/v1/loans', { params: { userId: user.value.id, includeStats: 'true', limit: 10000 } })
    let loansData = extractObjectData(loansRes)
    allLoans.value = Array.isArray(loansData) 
      ? loansData 
      : (loansData.loans || (loansData.data?.loans) || extractArrayData(loansRes))
    console.log('Fetched loans:', allLoans.value.length)

    // Fetch payments
    const paymentsRes = await api('/v1/payments', { params: { userId: user.value.id, limit: 10000 } })
    allPayments.value = extractArrayData(paymentsRes)
    console.log('Fetched payments:', allPayments.value.length)
    
    // Fetch penalties
    try {
      const penaltiesRes = await api(`/v1/penalties/user/${user.value.id}`)
      allPenalties.value = extractArrayData(penaltiesRes)
      console.log('Fetched penalties:', allPenalties.value.length)
    } catch (e) {
      allPenalties.value = []
    }
    
    applyFilters()
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    loading.value = false
  }
}

const extractArrayData = (response) => {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (response.data && Array.isArray(response.data)) return response.data
  if (response.data && response.data.data && Array.isArray(response.data.data)) return response.data.data
  if (response.ok && response.data && Array.isArray(response.data)) return response.data
  if (response.ok && response.data && response.data.data && Array.isArray(response.data.data)) return response.data.data
  return []
}

const extractObjectData = (response) => {
  if (!response) return {}
  if (response.data) return response.data
  if (response.ok && response.data) return response.data
  return response
}

const applyFilters = () => {
  console.log('=== Applying Filters ===')
  console.log('Selected:', { selectedMonth: selectedMonth.value, selectedYear: selectedYear.value })
  
  // Filter contributions
  let filteredContribs = allContributions.value.filter(c => {
    console.log('=== Checking contribution ===', c)
    console.log('Payment status:', c.payment_status)
    
    if (c.payment_status !== 'Approved') return false
    
    const dateStr = c.contribution_date || c.created_at
    console.log('Date string:', dateStr)
    if (!dateStr) return true
    
    try {
      const d = new Date(dateStr)
      console.log('Parsed date object:', d)
      const contribYear = d.getFullYear()
      const contribMonth = d.getMonth() + 1 // getMonth() is 0-based, convert to 1-12
      
      // Convert selected values to numbers for comparison
      const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
      const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
      
      console.log('Checking contrib:', { 
        amount: c.amount, 
        dateStr, 
        contribYear, 
        contribMonth,
        selectedYear,
        selectedMonth,
        filterYear,
        filterMonth,
        matchesYear: filterYear === null || contribYear === filterYear,
        matchesMonth: filterMonth === null || contribMonth === filterMonth
      })
      
      if (filterYear !== null && contribYear !== filterYear) {
        return false
      }
      if (filterMonth !== null && contribMonth !== filterMonth) {
        return false
      }
      return true
    } catch (e) {
      console.log('Date parse error:', dateStr, e)
      return true
    }
  })
  
  console.log('Filtered contributions count:', filteredContribs.length)

  // Filter loans
  let filteredLoans = allLoans.value.filter(l => {
    const dateStr = l.created_at
    if (!dateStr) return true
    
    try {
      const d = new Date(dateStr)
      const loanYear = d.getFullYear()
      const loanMonth = d.getMonth() + 1
      
      // Convert selected values to numbers for comparison
      const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
      const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
      
      if (filterYear !== null && loanYear !== filterYear) return false
      if (filterMonth !== null && loanMonth !== filterMonth) return false
      
      const status = (l.status || '').toLowerCase()
      return ['approved', 'disbursed', 'waiting', 'received', 'repaid', 'completed'].includes(status)
    } catch (e) {
      return true
    }
  })
  
  // Filter payments
  let filteredPayments = allPayments.value.filter(p => {
    const dateStr = p.created_at || p.payment_date
    if (!dateStr) return true
    
    try {
      const d = new Date(dateStr)
      const paymentYear = d.getFullYear()
      const paymentMonth = d.getMonth() + 1
      
      // Convert selected values to numbers for comparison
      const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
      const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
      
      if (filterYear !== null && paymentYear !== filterYear) return false
      if (filterMonth !== null && paymentMonth !== filterMonth) return false
      
      return p.payment_type === 'loan_payment'
    } catch (e) {
      return true
    }
  })
  
  // Filter and calculate penalties
  const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
  const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
  
  let filteredPenalties = allPenalties.value.filter(p => {
    const dateStr = p.created_at || p.paid_at
    if (!dateStr) return true
    
    try {
      const d = new Date(dateStr)
      const penaltyYear = d.getFullYear()
      const penaltyMonth = d.getMonth() + 1
      
      if (filterYear !== null && penaltyYear !== filterYear) return false
      if (filterMonth !== null && penaltyMonth !== filterMonth) return false
      
      return true
    } catch (e) {
      return true
    }
  })
  
  console.log('Fetched penalties:', allPenalties.value.length, 'Filtered penalties:', filteredPenalties.length)
  console.log('All penalties data:', allPenalties.value)
  
  stats.value.penalties.pending = filteredPenalties
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  
  stats.value.penalties.paid = filteredPenalties
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  
  // Update stats
  stats.value.totalContributions = filteredContribs.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  stats.value.totalLoanRequested = filteredLoans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
  
  const totalPaid = filteredPayments
    .filter(p => {
      const s = (p.status || p.payment_status || '').toLowerCase()
      return s === 'completed' || s === 'approved'
    })
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  
  stats.value.totalLoanPaid = totalPaid
  stats.value.totalLoans = stats.value.totalLoanRequested - totalPaid
  
  console.log('=== Full Stats After Applying Filters ===')
  console.log('stats.value:', stats.value)
  
  // Update contributions by tontine for charts
  contributionsByTontine.value = filteredContribs.reduce((acc, c) => {
    if (!acc[c.tontine_id]) acc[c.tontine_id] = []
    acc[c.tontine_id].push(c)
    return acc
  }, {})
  
  console.log('=== Filtered Stats ===')
  console.log({ 
    totalContributions: stats.value.totalContributions,
    penalties: stats.value.penalties 
  })
  
  updateCharts()
}

const resetFilters = () => {
  selectedMonth.value = null
  selectedYear.value = null
  applyFilters()
}

const getTontineSavings = (tontineId) => {
  const contribs = contributionsByTontine.value[tontineId] || []
  return contribs
    .filter(c => c.payment_status === 'Approved')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
}

const updateCharts = () => {
  console.log('=== updateCharts() CALLED in dashboard.vue ===')
  console.log('savingsChartCanvas.value:', savingsChartCanvas.value)
  console.log('distributionChartCanvas.value:', distributionChartCanvas.value)
  console.log('comprehensiveChartCanvas.value:', comprehensiveChartCanvas.value)
  
  nextTick(() => {
    console.log('=== updateCharts() first nextTick ===')
    nextTick(() => {
      console.log('=== updateCharts() second nextTick, calling createCharts() ===')
      createCharts()
    })
  })
}

const createCharts = () => {
  console.log('=== createCharts CALLED in dashboard.vue ===')
  console.log('stats.value at createCharts start:', JSON.parse(JSON.stringify(stats.value)))
  console.log('colorMode.value:', colorMode.value)
  console.log('document.documentElement.classList:', Array.from(document.documentElement.classList))
  if (!Chart) return
  
  console.log('Destroying existing charts...')
  if (savingsChart) {
    console.log('Destroying savingsChart')
    savingsChart.destroy()
  }
  if (distributionChart) {
    console.log('Destroying distributionChart')
    distributionChart.destroy()
  }
  if (comprehensiveChart) {
    console.log('Destroying comprehensiveChart')
    comprehensiveChart.destroy()
  }

  const isDark = document.documentElement.classList.contains('dark')
  console.log('isDark value in createCharts:', isDark)
  const textColor = isDark ? '#ffffff' : '#4b5563'
  const gridColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.5)'
  const titleColor = isDark ? '#ffffff' : '#1f2937'

  const chartColors = {
    primary: isDark ? '#34d399' : '#059669',
    secondary: isDark ? '#6ee7b7' : '#10b981',
    tertiary: isDark ? '#a7f3d0' : '#34d399',
    quaternary: isDark ? '#d1fae5' : '#6ee7b7',
    warning: isDark ? '#fbbf24' : '#f59e0b',
    danger: isDark ? '#f87171' : '#ef4444',
    darkGreen: isDark ? '#065f46' : '#047857',
    lightGreen: isDark ? '#d1fae5' : '#a7f3d0'
  }

  const tontineLabels = userTontines.value.map(t => t.name.substring(0, 12) + (t.name.length > 12 ? '...' : ''))
  const tontineSavings = userTontines.value.map(t => getTontineSavings(t.id))
  const barColors = [
    chartColors.primary, chartColors.secondary, chartColors.tertiary,
    chartColors.quaternary, chartColors.darkGreen, chartColors.lightGreen,
    '#065f46', '#047857'
  ].slice(0, Math.max(tontineLabels.length, 1))

  if (savingsChartCanvas.value) {
    savingsChart = new Chart(savingsChartCanvas.value, {
      type: 'bar',
      data: {
        labels: tontineLabels,
        datasets: [{
          label: 'Savings (RWF)',
          data: tontineSavings,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, chartColors.primary);
            gradient.addColorStop(1, chartColors.secondary);
            return gradient;
          },
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 'flex',
          maxBarThickness: 35,
          hoverBackgroundColor: chartColors.tertiary
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeInOutQuart' },
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          titleColor: titleColor,
          bodyColor: textColor,
          borderColor: chartColors.primary,
          borderWidth: 2,
          callbacks: { label: ctx => ['RWF ' + ctx.parsed.y.toLocaleString()] }
        }},
        scales: {
          y: { beginAtZero: true, ticks: {
            color: textColor,
            callback: v => v >= 1e6 ? (v/1e6).toFixed(1) + 'M' : v >= 1e3 ? (v/1e3).toFixed(0) + 'K' : v
          }, grid: { color: gridColor } },
          x: { ticks: { color: textColor, maxRotation: 45 }, grid: { display: false } }
        }
      }
    })
  }

  const outstanding = Math.max(0, Number(stats.value.totalLoans || 0))
  const totalContribs = Number(stats.value.totalContributions || 0)
  const pendingPenalties = Number(stats.value.penalties.pending || 0)
  const netWorth = Math.max(0, totalContribs - outstanding - pendingPenalties)
  
  console.log('=== Personal Dashboard Net Worth Calculation ===')
  console.log({
    totalContribs,
    outstanding,
    pendingPenalties,
    netWorth
  })
  
  const doughnutSegments = []
  const doughnutLabels = []
  const doughnutColors = []
  
  if (stats.value.totalContributions > 0) {
    doughnutSegments.push(stats.value.totalContributions)
    doughnutLabels.push('Total Savings')
    doughnutColors.push(chartColors.primary)
  }
  
  if (outstanding > 0) {
    doughnutSegments.push(outstanding)
    doughnutLabels.push('Outstanding Loans')
    doughnutColors.push(chartColors.warning)
  }
  
  if (stats.value.penalties.pending > 0) {
    doughnutSegments.push(stats.value.penalties.pending)
    doughnutLabels.push('Pending Penalties')
    doughnutColors.push(chartColors.danger)
  }
  
  if (doughnutSegments.length === 0) {
    doughnutSegments.push(1)
    doughnutLabels.push('No Data')
    doughnutColors.push('#9ca3af')
  }

  if (distributionChartCanvas.value) {
    distributionChart = new Chart(distributionChartCanvas.value, {
      type: 'doughnut',
      data: { labels: doughnutLabels, datasets: [{
        data: doughnutSegments,
        backgroundColor: doughnutColors,
        borderWidth: 0,
        hoverOffset: 12
      }]},
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: { legend: { position: 'bottom' }, tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0'
              return ['RWF ' + ctx.parsed.toLocaleString(), pct + '%']
            }
          }
        }}
      }
    })
  }

  console.log('=== Personal Dashboard Comprehensive Chart ===')
  console.log('comprehensiveChartCanvas.value:', comprehensiveChartCanvas.value)
  console.log('comprehensive chart data:', [totalContribs, outstanding, pendingPenalties, netWorth])
  if (comprehensiveChartCanvas.value) {
    comprehensiveChart = new Chart(comprehensiveChartCanvas.value, {
      type: 'bar',
      data: {
        labels: ['Savings', 'Loans', 'Penalties', 'Net Worth'],
        datasets: [{
          label: 'Amount (RWF)',
          data: [totalContribs, outstanding, pendingPenalties, netWorth],
          backgroundColor: [
            chartColors.primary + 'CC',
            chartColors.warning + 'CC',
            chartColors.danger + 'CC',
            chartColors.secondary + 'CC'
          ],
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          callbacks: { label: ctx => ['RWF ' + ctx.parsed.y.toLocaleString()] }
        }},
        scales: { y: { beginAtZero: true, ticks: { color: textColor } }, x: { ticks: { color: textColor }, grid: { display: false } } }
      }
    })
  }
}

watch([userTontines, stats, contributionsByTontine], () => {
  if (!loading.value) updateCharts()
}, { deep: true })

const colorMode = useColorMode()
watch(() => colorMode.value, () => {
  console.log('=== Color mode changed in dashboard.vue, updating charts ===')
  updateCharts()
})

definePageMeta({ layout: 'default' })
</script>
