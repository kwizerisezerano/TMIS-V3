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
        
        <!-- Row 1: 3 main financial cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div class="bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-700 dark:to-emerald-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-50 text-sm font-medium">Total Savings</p>
                <p class="text-2xl font-bold mt-1">{{ formatDashboardAmount(stats.totalContributions) }}</p>
                <p class="text-xs text-green-200 mt-1">{{ userTontines.length }} active tontine(s)</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-banknotes" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-amber-50 text-sm font-medium">Outstanding Loans</p>
                <p class="text-2xl font-bold mt-1">{{ formatDashboardAmount(stats.totalLoans) }}</p>
                <p class="text-xs text-amber-200 mt-1">{{ stats.totalLoanRequested > 0 ? ((stats.totalLoanPaid / stats.totalLoanRequested) * 100).toFixed(0) : 0 }}% repaid</p>
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
                <p class="text-2xl font-bold mt-1">{{ formatDashboardAmount(Math.max(0, stats.totalContributions - stats.totalLoans - stats.penalties.pending)) }}</p>
                <p class="text-xs text-teal-200 mt-1">Savings minus loans &amp; penalties</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-chart-pie" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: 3 detail cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Penalties</span>
              <Icon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-500" />
            </div>
            <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ formatDashboardAmount(stats.penalties.pending) }}</p>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div class="bg-red-500 h-1.5 rounded-full transition-all" :style="{ width: Math.min((stats.penalties.pending / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' }"></div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Penalties</span>
              <Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
            </div>
            <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatDashboardAmount(stats.penalties.paid) }}</p>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div class="bg-green-500 h-1.5 rounded-full transition-all" :style="{ width: Math.min((stats.penalties.paid / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' }"></div>
            </div>
          </div>

          <NuxtLink to="/surplus" class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors block">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Overpayments</span>
              <Icon name="i-heroicons-gift" class="w-5 h-5 text-purple-500" />
            </div>
            <p class="text-xl font-bold text-purple-600 dark:text-purple-400">{{ formatDashboardAmount(stats.surplus.total) }}</p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                <span v-if="stats.surplus.pending > 0" class="text-amber-600 dark:text-amber-400 font-medium">{{ formatDashboardAmount(stats.surplus.pending) }} unallocated</span>
                <span v-else class="text-green-600 dark:text-green-400">All allocated ✓</span>
              </span>
              <span class="text-xs text-purple-500 dark:text-purple-400">View →</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Pending surplus alert banner -->
        <div v-if="stats.surplus.pending > 0" class="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <Icon name="i-heroicons-gift" class="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div>
              <p class="font-semibold text-purple-800 dark:text-purple-200 text-sm">You have {{ formatDashboardAmount(stats.surplus.pending) }} in unallocated overpayments</p>
              <p class="text-xs text-purple-600 dark:text-purple-400">Allocate your surplus so the accountant can apply it to your contributions, loans, or penalties.</p>
            </div>
          </div>
          <NuxtLink to="/surplus">
            <UButton color="purple" size="sm">Allocate Now</UButton>
          </NuxtLink>
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

const { formatDashboardAmount } = useCurrency()
const userName = ref('Member')
const stats = ref({
  totalContributions: 0,
  activeTontines: 0,
  totalLoans: 0,
  totalLoanPaid: 0,
  totalLoanRequested: 0,
  memberCount: 0,
  penalties: { pending: 0, paid: 0, total: 0 },
  surplus: { pending: 0, allocated: 0, total: 0 }
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

        // Real-time: refresh dashboard on any data change
        const { connect, on } = useSocket()
        connect()
        on('contributions-updated', () => fetchDashboardData())
        on('loans-updated', () => fetchDashboardData())
        on('penalties-updated', () => fetchDashboardData())
        on('contribution-status-updated', () => fetchDashboardData())
        on('loan-status-updated', () => fetchDashboardData())
        on('penalty-status-updated', () => fetchDashboardData())
      } catch (error) {
        console.error('User validation failed:', error)
        if (error?.response?.status === 401 || error?.status === 401 || error?.data?.status === 401) {
          logout()
        } else {
          loading.value = false
        }
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
    const tontinesRes = await api('/v1/tontines', { params: { userId: user.value.id, limit: 100 } })
    userTontines.value = extractArrayData(tontinesRes)
    stats.value.activeTontines = userTontines.value.length

    const contribRes = await api('/v1/contributions', { params: { userId: user.value.id, includeStats: 'true', limit: 10000 } })
    let contribData = extractObjectData(contribRes)
    allContributions.value = Array.isArray(contribData)
      ? contribData
      : (contribData.contributions || contribData.data?.contributions || extractArrayData(contribRes))

    const loansRes = await api('/v1/loans', { params: { userId: user.value.id, includeStats: 'true', limit: 10000 } })
    let loansData = extractObjectData(loansRes)
    allLoans.value = Array.isArray(loansData)
      ? loansData
      : (loansData.loans || loansData.data?.loans || extractArrayData(loansRes))

    const paymentsRes = await api('/v1/payments', { params: { userId: user.value.id, limit: 10000 } })
    allPayments.value = extractArrayData(paymentsRes)

    try {
      const penaltiesRes = await api(`/v1/penalties/user/${user.value.id}`)
      allPenalties.value = extractArrayData(penaltiesRes)
    } catch { allPenalties.value = [] }

    try {
      const surplusRes = await api('/v1/surplus/my')
      const surplusList = extractArrayData(surplusRes)
      stats.value.surplus.pending = surplusList.filter(s => s.status === 'pending').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)
      stats.value.surplus.allocated = surplusList.filter(s => s.status === 'allocated').reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)
      stats.value.surplus.total = stats.value.surplus.pending + stats.value.surplus.allocated
    } catch { stats.value.surplus = { pending: 0, allocated: 0, total: 0 } }

    applyFilters()
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
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
  let filteredContribs = allContributions.value.filter(c => {
    if (c.payment_status !== 'Approved') return false
    const dateStr = c.contribution_date || c.created_at
    if (!dateStr) return true
    try {
      const d = new Date(dateStr)
      const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
      const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
      if (filterYear !== null && d.getFullYear() !== filterYear) return false
      if (filterMonth !== null && d.getMonth() + 1 !== filterMonth) return false
      return true
    } catch { return true }
  })

  let filteredLoans = allLoans.value.filter(l => {
    const dateStr = l.created_at
    if (!dateStr) return true
    try {
      const d = new Date(dateStr)
      const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
      const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
      if (filterYear !== null && d.getFullYear() !== filterYear) return false
      if (filterMonth !== null && d.getMonth() + 1 !== filterMonth) return false
      const status = (l.status || '').toLowerCase()
      return ['approved', 'disbursed', 'waiting', 'received', 'repaid', 'completed'].includes(status)
    } catch { return true }
  })

  let filteredPayments = allPayments.value.filter(p => {
    const dateStr = p.created_at || p.payment_date
    if (!dateStr) return true
    try {
      const d = new Date(dateStr)
      const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
      const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
      if (filterYear !== null && d.getFullYear() !== filterYear) return false
      if (filterMonth !== null && d.getMonth() + 1 !== filterMonth) return false
      return p.payment_type === 'loan_payment'
    } catch { return true }
  })

  const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
  const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
  let filteredPenalties = allPenalties.value.filter(p => {
    const dateStr = p.created_at || p.paid_at
    if (!dateStr) return true
    try {
      const d = new Date(dateStr)
      if (filterYear !== null && d.getFullYear() !== filterYear) return false
      if (filterMonth !== null && d.getMonth() + 1 !== filterMonth) return false
      return true
    } catch { return true }
  })

  stats.value.penalties.pending = filteredPenalties.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  stats.value.penalties.paid = filteredPenalties.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  stats.value.totalContributions = filteredContribs.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  stats.value.totalLoanRequested = filteredLoans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)

  const totalPaid = filteredPayments
    .filter(p => ['completed', 'approved'].includes((p.status || p.payment_status || '').toLowerCase()))
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  stats.value.totalLoanPaid = totalPaid
  stats.value.totalLoans = stats.value.totalLoanRequested - totalPaid

  contributionsByTontine.value = filteredContribs.reduce((acc, c) => {
    if (!acc[c.tontine_id]) acc[c.tontine_id] = []
    acc[c.tontine_id].push(c)
    return acc
  }, {})

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
  nextTick(() => nextTick(() => createCharts()))
}

const createCharts = () => {
  if (!Chart) return
  if (savingsChart) savingsChart.destroy()
  if (distributionChart) distributionChart.destroy()
  if (comprehensiveChart) comprehensiveChart.destroy()

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
          backgroundColor: '#1f2937',
          titleColor: '#f9fafb',
          bodyColor: '#f9fafb',
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

  if (stats.value.surplus.total > 0) {
    doughnutSegments.push(stats.value.surplus.total)
    doughnutLabels.push('Overpayments')
    doughnutColors.push(isDark ? '#c084fc' : '#9333ea')
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
        plugins: { legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } }, tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#f9fafb',
          bodyColor: '#f9fafb',
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

  if (comprehensiveChartCanvas.value) {
    comprehensiveChart = new Chart(comprehensiveChartCanvas.value, {
      type: 'bar',
      data: {
        labels: ['Savings', 'Loans', 'Penalties', 'Overpayments', 'Net Worth'],
        datasets: [{
          label: 'Amount (RWF)',
          data: [totalContribs, outstanding, pendingPenalties, Number(stats.value.surplus.total || 0), netWorth],
          backgroundColor: [
            chartColors.primary + 'CC',
            chartColors.warning + 'CC',
            chartColors.danger + 'CC',
            (isDark ? '#c084fc' : '#9333ea') + 'CC',
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
          backgroundColor: '#1f2937',
          titleColor: '#f9fafb',
          bodyColor: '#f9fafb',
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
watch(() => colorMode.value, () => updateCharts())

definePageMeta({ layout: 'default' })
</script>
