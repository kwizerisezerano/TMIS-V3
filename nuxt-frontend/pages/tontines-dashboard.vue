<template>
  <div class="min-h-screen bg-white dark:bg-slate-900 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-blue-600">
            <Icon name="i-heroicons-building-office-2" class="w-8 h-8 inline mr-2" />
            All Tontines Dashboard
          </h1>
          <p class="text-gray-600 dark:text-slate-400 mt-1">
            Comprehensive overview of all tontines and members
          </p>
        </div>
        <UButton @click="navigateTo('/tontines')" variant="outline" icon="i-heroicons-arrow-left">
          Back to Tontines
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="text-gray-500">Loading dashboard data...</div>
      </div>

      <div v-else>
        <!-- Filters -->
        <div class="mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Financial Overview</h2>
            <div class="flex flex-wrap items-center gap-3">
              <!-- Simple Filters -->
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
        </div>

      <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div class="bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-700 dark:to-emerald-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-50 text-sm font-medium">Total Tontines</p>
                <p class="text-2xl font-bold mt-1">{{ stats.totalTontines }}</p>
                <p class="text-xs text-green-100 mt-1">{{ stats.mainTontines }} main, {{ stats.branchTontines }} branches</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-building-library" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-emerald-50 text-sm font-medium">Total Members</p>
                <p class="text-2xl font-bold mt-1">{{ stats.totalMembers }}</p>
                <p class="text-xs text-emerald-100 mt-1">Across all tontines</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-users" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-700 to-green-800 dark:from-emerald-800 dark:to-green-900 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-emerald-50 text-sm font-medium">Total Savings</p>
                <p class="text-2xl font-bold mt-1">{{ formatDashboardAmount(stats.totalContributions) }}</p>
                <p class="text-xs text-emerald-100 mt-1">All time</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-banknotes" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-teal-600 to-cyan-700 dark:from-teal-700 dark:to-cyan-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-teal-50 text-sm font-medium">Outstanding Loans</p>
                <p class="text-2xl font-bold mt-1">{{ formatDashboardAmount(stats.totalLoans) }}</p>
                <p class="text-xs text-teal-100 mt-1">{{ stats.activeLoans }} active loans</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-credit-card" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-red-600 to-rose-700 dark:from-red-700 dark:to-rose-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-red-50 text-sm font-medium">Pending Penalties</p>
                <p class="text-2xl font-bold mt-1">{{ formatDashboardAmount(stats.penalties.pending) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-amber-600 to-yellow-700 dark:from-amber-700 dark:to-yellow-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-amber-50 text-sm font-medium">Paid Penalties</p>
                <p class="text-2xl font-bold mt-1">{{ formatDashboardAmount(stats.penalties.paid) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-check-badge" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Overview Section -->
        <div class="mb-6 sm:mb-8">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Financial Overview</h2>
          
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

        <!-- All Tontines Table -->
        <UCard class="border-0 shadow-lg mb-8">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">All Tontines</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200 dark:border-slate-600">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Members</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Contribution</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Total</th>
                    <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tontine in allTontinesList" :key="tontine.id" class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 px-4">
                      <div class="font-medium text-gray-900 dark:text-white">{{ tontine.name }}</div>
                      <div v-if="tontine.parent_tontine_name" class="text-xs text-gray-500">of {{ tontine.parent_tontine_name }}</div>
                    </td>
                    <td class="py-3 px-4">
                      <UBadge v-if="tontine.tontine_type === 'main'" color="emerald" size="xs">Main</UBadge>
                      <UBadge v-else color="blue" size="xs" variant="subtle">Branch</UBadge>
                    </td>
                    <td class="py-3 px-4 text-gray-900 dark:text-white">{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</td>
                    <td class="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">RWF {{ Number(tontine.contribution_amount || 0).toLocaleString() }}</td>
                    <td class="py-3 px-4 text-right font-semibold text-green-600">RWF {{ Number(getTontineSavings(tontine.id)).toLocaleString() }}</td>
                    <td class="py-3 px-4 text-center">
                      <StatusBadge :status="tontine.status" />
                    </td>
                    <td class="py-3 px-4 text-center">
                      <UButton @click="viewTontine(tontine.id)" color="blue" variant="ghost" size="xs" icon="i-heroicons-eye">
                        View
                      </UButton>
                    </td>
                  </tr>
                </tbody>
              </table>
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
const loading = ref(true)
const allTontinesList = ref([])
const stats = ref({
  totalTontines: 0,
  mainTontines: 0,
  branchTontines: 0,
  totalMembers: 0,
  totalContributions: 0,
  activeLoans: 0,
  totalLoans: 0,
  totalLoanRequested: 0,
  totalLoanPaid: 0,
  penalties: {
    pending: 0,
    paid: 0
  }
})

// Raw data storage for filtering
const allContributions = ref([])
const allLoans = ref([])
const allPayments = ref([])
const allPenalties = ref([])

// Simple filter state
const selectedMonth = ref(null)
const selectedYear = ref(null)

// Month options (1-12)
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

// Year options
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

onMounted(async () => {
  await fetchDashboardData()
})

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

const fetchDashboardData = async () => {
  const { api } = useApi()
  try {
    const tontinesRes = await api('/v1/tontines', { params: { limit: 100 } })
    allTontinesList.value = extractArrayData(tontinesRes)
    
    const contributionsRes = await api('/v1/contributions', { params: { limit: 10000 } })
    let contribData = extractObjectData(contributionsRes)
    allContributions.value = Array.isArray(contribData) ? contribData : (contribData.contributions || extractArrayData(contributionsRes))
    
    const loansRes = await api('/v1/loans', { params: { limit: 10000 } })
    let loansData = extractObjectData(loansRes)
    allLoans.value = Array.isArray(loansData) ? loansData : (loansData.loans || extractArrayData(loansRes))
    
    const paymentsRes = await api('/v1/payments', { params: { limit: 10000 } })
    allPayments.value = extractArrayData(paymentsRes)
    
    // Fetch penalties
    try {
      console.log('=== Fetching penalties for all tontines ===')
      const penaltiesRes = await api('/v1/penalties', { params: { limit: 10000 } })
      console.log('Penalties API Response:', penaltiesRes)
      allPenalties.value = penaltiesRes.data || penaltiesRes.penalties || extractArrayData(penaltiesRes)
      console.log('Fetched penalties (all tontines):', allPenalties.value.length)
      console.log('All penalties data:', JSON.stringify(allPenalties.value, null, 2))
    } catch (e) {
      console.error('Failed to fetch penalties:', e)
      allPenalties.value = []
    }
    
    applyFilters()
    
    loading.value = false
    
    nextTick(() => {
      nextTick(() => {
        createCharts()
      })
    })
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    loading.value = false
  }
}

const getTontineSavings = (tontineId) => {
  const tontineContribs = allContributions.value.filter(c => c.tontine_id === tontineId)
  const total = tontineContribs
    .filter(c => c.payment_status === 'Approved')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  return total || 0
}

const createCharts = () => {
  if (!Chart) return
  
  if (savingsChart) savingsChart.destroy()
  if (distributionChart) distributionChart.destroy()
  if (comprehensiveChart) comprehensiveChart.destroy()

  const isDark = document.documentElement.classList.contains('dark')
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
    lightGreen: isDark ? '#d1fae5' : '#a7f3d0',
  }

  const tontineLabels = allTontinesList.value.map(t => t.name.substring(0, 12) + (t.name.length > 12 ? '...' : ''))
  const tontineSavings = allTontinesList.value.map(t => getTontineSavings(t.id))
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
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: titleColor,
            bodyColor: textColor,
            borderColor: chartColors.primary,
            borderWidth: 2,
            padding: 14,
            cornerRadius: 12,
            callbacks: {
              label: function(context) {
                return ['RWF ' + context.parsed.y.toLocaleString()];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              font: { size: 12, weight: '600' },
              padding: 10,
              callback: function(value) {
                if (value >= 1000000) return (value/1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value/1000).toFixed(0) + 'K';
                return value;
              }
            },
            grid: { color: gridColor, drawBorder: false, lineWidth: 1 },
            border: { display: false }
          },
          x: {
            ticks: { color: textColor, font: { size: 12, weight: '600' }, padding: 10, maxRotation: 45 },
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    })
  }

  const outstandingLoanBalance = Math.max(0, Number(stats.value.totalLoans || 0))
  const totalContribs = Number(stats.value.totalContributions || 0)
  const pendingPenalties = Number(stats.value.penalties.pending || 0)
  const netWorth = Math.max(0, totalContribs - outstandingLoanBalance - pendingPenalties)
  console.log('Net Worth calculation breakdown:', {
    totalContribs,
    outstandingLoanBalance,
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
  
  if (outstandingLoanBalance > 0) {
    doughnutSegments.push(outstandingLoanBalance)
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

  console.log('=== Comprehensive Chart Debug ===')
  console.log('stats.value.totalContributions:', stats.value.totalContributions)
  console.log('outstandingLoanBalance:', outstandingLoanBalance)
  console.log('stats.value.penalties.pending:', stats.value.penalties.pending)
  console.log('netWorth:', netWorth)
  console.log('comprehensiveChartCanvas.value:', comprehensiveChartCanvas.value)
  if (comprehensiveChartCanvas.value) {
    comprehensiveChart = new Chart(comprehensiveChartCanvas.value, {
      type: 'bar',
      data: {
        labels: ['Savings', 'Loans', 'Penalties', 'Net Worth'],
        datasets: [{
          label: 'Amount (RWF)',
          data: [
            totalContribs,
            outstandingLoanBalance,
            pendingPenalties,
            netWorth
          ],
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
        scales: { 
          y: { 
            beginAtZero: true, 
            ticks: { 
              color: textColor,
              font: { size: 12, weight: '600' },
              padding: 10,
              callback: function(value) {
                if (value >= 1000000) return (value/1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value/1000).toFixed(0) + 'K';
                return value;
              }
            },
            grid: { color: gridColor, drawBorder: false, lineWidth: 1 },
            border: { display: false }
          }, 
          x: { 
            ticks: { 
              color: textColor, 
              font: { size: 12, weight: '600' }
            }, 
            grid: { display: false } 
          } 
        }
      }
    })
  }
}

const applyFilters = () => {
  console.log('=== All Tontines Dashboard: Applying Filters ===')
  
  stats.value.totalTontines = allTontinesList.value.length
  stats.value.mainTontines = allTontinesList.value.filter(t => t.tontine_type === 'main').length
  stats.value.branchTontines = allTontinesList.value.filter(t => t.tontine_type === 'branch').length
  stats.value.totalMembers = allTontinesList.value.reduce((sum, t) => sum + (parseInt(t.member_count) || 0), 0)
  
  const filterYear = selectedYear.value !== null ? Number(selectedYear.value) : null
  const filterMonth = selectedMonth.value !== null ? Number(selectedMonth.value) : null
  
  const filteredContributions = allContributions.value.filter(c => {
    if (c.payment_status !== 'Approved') return false
    const dateStr = c.contribution_date || c.created_at
    if (!dateStr) return true
    
    try {
      const d = new Date(dateStr)
      const contribYear = d.getFullYear()
      const contribMonth = d.getMonth() + 1
      
      if (filterYear !== null && contribYear !== filterYear) return false
      if (filterMonth !== null && contribMonth !== filterMonth) return false
      
      return true
    } catch (e) {
      return true
    }
  })
  
  const filteredLoans = allLoans.value.filter(l => {
    const dateStr = l.created_at
    if (!dateStr) return true
    
    try {
      const d = new Date(dateStr)
      const loanYear = d.getFullYear()
      const loanMonth = d.getMonth() + 1
      
      if (filterYear !== null && loanYear !== filterYear) return false
      if (filterMonth !== null && loanMonth !== filterMonth) return false
      
      const status = (l.status || '').toLowerCase()
      return ['approved', 'disbursed', 'waiting', 'received', 'repaid', 'completed'].includes(status)
    } catch (e) {
      return true
    }
  })
  
  const filteredPayments = allPayments.value.filter(p => {
    const dateStr = p.created_at || p.payment_date
    if (!dateStr) return true
    
    try {
      const d = new Date(dateStr)
      const paymentYear = d.getFullYear()
      const paymentMonth = d.getMonth() + 1
      
      if (filterYear !== null && paymentYear !== filterYear) return false
      if (filterMonth !== null && paymentMonth !== filterMonth) return false
      
      return p.payment_type === 'loan_payment'
    } catch (e) {
      return true
    }
  })
  
  // Filter and calculate penalties
  console.log('=== All Tontines Dashboard: Processing Penalties ===')
  console.log('All penalties before filtering:', allPenalties.value.length, allPenalties.value)
  
  const filteredPenalties = allPenalties.value.filter(p => {
    console.log('Checking penalty:', p)
    
    const dateStr = p.created_at || p.paid_at
    if (!dateStr) return true
    
    try {
      const d = new Date(dateStr)
      const penaltyYear = d.getFullYear()
      const penaltyMonth = d.getMonth() + 1
      
      console.log('Penalty date:', { dateStr, penaltyYear, penaltyMonth, filterYear, filterMonth })
      
      if (filterYear !== null && penaltyYear !== filterYear) return false
      if (filterMonth !== null && penaltyMonth !== filterMonth) return false
      
      return true
    } catch (e) {
      console.log('Penalty date parse error:', dateStr, e)
      return true
    }
  })
  
  console.log('Filtered penalties:', filteredPenalties.length, filteredPenalties)
  
  const pendingPenalties = filteredPenalties.filter(p => p.status === 'pending')
  const paidPenalties = filteredPenalties.filter(p => p.status === 'paid')
  console.log('Pending penalties:', pendingPenalties.length, pendingPenalties)
  console.log('Paid penalties:', paidPenalties.length, paidPenalties)
  
  stats.value.penalties.pending = pendingPenalties
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  
  stats.value.penalties.paid = paidPenalties
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  
  console.log('Calculated penalties stats:', stats.value.penalties)
  
  stats.value.totalContributions = filteredContributions
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  
  stats.value.totalLoanRequested = filteredLoans
    .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
  
  const totalPaid = filteredPayments
    .filter(p => {
      const s = (p.status || p.payment_status || '').toLowerCase()
      return s === 'completed' || s === 'approved'
    })
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  
  stats.value.totalLoanPaid = totalPaid
  stats.value.totalLoans = stats.value.totalLoanRequested - totalPaid
  stats.value.activeLoans = filteredLoans.length
  
  contributionsByTontine.value = filteredContributions.reduce((acc, c) => {
    if (!acc[c.tontine_id]) acc[c.tontine_id] = []
    acc[c.tontine_id].push(c)
    return acc
  }, {})
  
  console.log('Filters applied:', { 
    selectedYear: selectedYear.value, 
    selectedMonth: selectedMonth.value, 
    filteredContribCount: filteredContributions.length,
    totalContribValue: stats.value.totalContributions,
    penalties: stats.value.penalties
  })
  
  updateCharts()
}

const contributionsByTontine = ref({})

const resetFilters = () => {
  selectedMonth.value = null
  selectedYear.value = null
  applyFilters()
}

const updateCharts = () => {
  nextTick(() => {
    nextTick(() => {
      createCharts()
    })
  })
}

const viewTontine = (tontineId) => {
  navigateTo(`/tontine-dashboard/${tontineId}`)
}

watch([allTontinesList, stats, contributionsByTontine], () => {
  if (!loading.value) updateCharts()
}, { deep: true })

const colorMode = useColorMode()
watch(() => colorMode.value, () => {
  console.log('=== Color mode changed in tontines-dashboard.vue, updating charts ===')
  updateCharts()
})

definePageMeta({
  layout: 'default'
})
</script>
