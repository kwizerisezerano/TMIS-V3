<template>
  <div class="min-h-screen bg-white dark:bg-slate-900 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-blue-600">
            <Icon name="i-heroicons-building-office-2" class="w-8 h-8 inline mr-2" />
            {{ tontineName }} Dashboard
          </h1>
          <p class="text-gray-600 dark:text-slate-400 mt-1">
            Comprehensive overview for this tontine
          </p>
        </div>
        <UButton @click="navigateTo('/tontines-dashboard')" variant="outline" icon="i-heroicons-arrow-left">
          Back to All Tontines
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="text-gray-500">Loading dashboard data...</div>
      </div>

      <div v-else>
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-700 dark:to-emerald-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-50 text-sm font-medium">Total Members</p>
                <p class="text-2xl font-bold mt-1">{{ stats.totalMembers }}</p>
                <p class="text-xs text-green-100 mt-1">{{ stats.activeMembers }} active</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-users" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-emerald-50 text-sm font-medium">Total Savings</p>
                <p class="text-2xl font-bold mt-1">{{ formatDashboardAmount(stats.totalContributions) }}</p>
                <p class="text-xs text-emerald-100 mt-1">{{ stats.contributionCount }} contributions</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-banknotes" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-700 to-green-800 dark:from-emerald-800 dark:to-green-900 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-emerald-50 text-sm font-medium">Active Loans</p>
                <p class="text-2xl font-bold mt-1">{{ stats.activeLoans }}</p>
                <p class="text-xs text-emerald-100 mt-1">{{ formatDashboardAmount(stats.totalLoans) }} outstanding</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-credit-card" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-teal-600 to-cyan-700 dark:from-teal-700 dark:to-cyan-800 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-teal-50 text-sm font-medium">Pending Penalties</p>
                <p class="text-2xl font-bold mt-1">{{ stats.pendingPenalties }}</p>
                <p class="text-xs text-teal-100 mt-1">{{ formatDashboardAmount(stats.penaltyAmount) }}</p>
              </div>
              <div class="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Icon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Overview Section -->
        <div class="mb-6 sm:mb-8">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Financial Overview</h2>
          
          <!-- All Charts on Same Line -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <!-- Savings by Member -->
            <UCard class="border-0 shadow-lg bg-white dark:bg-gray-800">
              <div class="p-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Savings by Member</h3>
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

        <!-- Recent Activity Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Recent Contributions -->
          <UCard class="border-0 shadow-lg">
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Contributions</h2>
              <div class="space-y-3">
                <div v-for="contrib in recentContributions" :key="contrib.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white text-sm">{{ contrib.user_name }}</div>
                    <div class="text-xs text-gray-500">{{ formatDate(contrib.contribution_date) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold text-green-600 text-sm">RWF {{ Number(contrib.amount || 0).toLocaleString() }}</div>
                    <UBadge :color="contrib.payment_status === 'Approved' ? 'green' : 'yellow'" size="xs">{{ contrib.payment_status }}</UBadge>
                  </div>
                </div>
                <div v-if="recentContributions.length === 0" class="text-center text-gray-500 py-4">No recent contributions</div>
              </div>
            </div>
          </UCard>

          <!-- Active Loans -->
          <UCard class="border-0 shadow-lg">
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Loans</h2>
              <div class="space-y-3">
                <div v-for="loan in activeLoansList" :key="loan.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white text-sm">{{ loan.borrower_name }}</div>
                    <div class="text-xs text-gray-500">Due: {{ formatDate(loan.due_date) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold text-blue-600 text-sm">RWF {{ Number(loan.amount || 0).toLocaleString() }}</div>
                    <UBadge :color="loan.status === 'approved' ? 'blue' : 'gray'" size="xs">{{ loan.status }}</UBadge>
                  </div>
                </div>
                <div v-if="activeLoansList.length === 0" class="text-center text-gray-500 py-4">No active loans</div>
              </div>
            </div>
          </UCard>

          <!-- Recent Penalties -->
          <UCard class="border-0 shadow-lg">
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Penalties</h2>
              <div class="space-y-3">
                <div v-for="penalty in recentPenalties" :key="penalty.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white text-sm">{{ penalty.member_name }}</div>
                    <div class="text-xs text-gray-500">{{ penalty.reason }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold text-red-600 text-sm">RWF {{ Number(penalty.amount || 0).toLocaleString() }}</div>
                    <UBadge :color="penalty.status === 'pending' ? 'red' : 'green'" size="xs">{{ penalty.status }}</UBadge>
                  </div>
                </div>
                <div v-if="recentPenalties.length === 0" class="text-center text-gray-500 py-4">No recent penalties</div>
              </div>
            </div>
          </UCard>
        </div>
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

const route = useRoute()
const tontineId = computed(() => route.params.tontineId)

const loading = ref(true)
const tontineName = ref('')
const members = ref([])
const stats = ref({
  totalMembers: 0,
  activeMembers: 0,
  totalContributions: 0,
  contributionCount: 0,
  activeLoans: 0,
  totalLoans: 0,
  pendingPenalties: 0,
  penaltyAmount: 0
})

// Raw data storage
const allContributions = ref([])
const allLoans = ref([])
const allPayments = ref([])
const allPenalties = ref([])

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

const fetchDashboardData = async () => {
  const { api } = useApi()
  try {
    // 1. Fetch tontine details
    const tontinesRes = await api('/v1/tontines', { params: { limit: 100 } })
    const tontinesData = tontinesRes.data || tontinesRes
    const tontines = Array.isArray(tontinesData) ? tontinesData : (tontinesData.data || [])
    const tontine = tontines.find(t => t.id === parseInt(tontineId.value))
    
    if (tontine) {
      tontineName.value = tontine.name
      stats.value.totalMembers = parseInt(tontine.member_count) || 0
      stats.value.activeMembers = parseInt(tontine.member_count) || 0
    }
    
    // 2. Fetch all contributions and filter by tontine
    const contributionsRes = await api('/v1/contributions', { params: { limit: 1000 } })
    const contributionsData = contributionsRes.data || contributionsRes
    let contributions = []
    if (Array.isArray(contributionsData)) {
      contributions = contributionsData
    } else if (contributionsData.data && Array.isArray(contributionsData.data)) {
      contributions = contributionsData.data
    }
    allContributions.value = contributions.filter(c => c.tontine_id === parseInt(tontineId.value))
    
    // 3. Fetch all loans and filter by tontine
    const loansRes = await api('/v1/loans', { params: { limit: 1000 } })
    const loansData = loansRes.data || loansRes
    let loans = []
    if (Array.isArray(loansData)) {
      loans = loansData
    } else if (loansData.data && Array.isArray(loansData.data)) {
      loans = loansData.data
    }
    allLoans.value = loans.filter(l => l.tontine_id === parseInt(tontineId.value))
    
    // 4. Fetch all payments and filter by tontine
    const paymentsRes = await api('/v1/payments', { params: { limit: 1000 } })
    const paymentsData = paymentsRes.data || paymentsRes
    let payments = []
    if (Array.isArray(paymentsData)) {
      payments = paymentsData
    } else if (paymentsData.data && Array.isArray(paymentsData.data)) {
      payments = paymentsData.data
    }
    allPayments.value = payments.filter(p => p.tontine_id === parseInt(tontineId.value))
    
    // 5. Fetch penalties for this tontine
    try {
      const penaltiesRes = await api('/v1/penalties', { params: { limit: 1000 } })
      const penaltiesData = penaltiesRes.data || penaltiesRes
      let penalties = []
      if (Array.isArray(penaltiesData)) {
        penalties = penaltiesData
      } else if (penaltiesData.data && Array.isArray(penaltiesData.data)) {
        penalties = penaltiesData.data
      }
      allPenalties.value = penalties.filter(p => p.tontine_id === parseInt(tontineId.value))
    } catch (e) {
      allPenalties.value = []
    }
    
    // Calculate stats
    stats.value.totalContributions = allContributions.value
      .filter(c => c.payment_status === 'Approved')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
    stats.value.contributionCount = allContributions.value.filter(c => c.payment_status === 'Approved').length
    
    const activeLoans = allLoans.value.filter(l => {
      const status = (l.status || '').toLowerCase()
      return ['approved', 'disbursed', 'waiting', 'received', 'repaid', 'completed'].includes(status)
    })
    
    stats.value.activeLoans = activeLoans.length
    const totalLoanRequested = activeLoans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    const totalLoanPaid = allPayments.value
      .filter(p => {
        const status = (p.status || p.payment_status || '').toLowerCase()
        return (status === 'completed' || status === 'approved') && p.payment_type === 'loan_payment'
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    stats.value.totalLoans = totalLoanRequested - totalLoanPaid
    
    stats.value.pendingPenalties = allPenalties.value.filter(p => p.status === 'pending').length
    stats.value.penaltyAmount = allPenalties.value
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    
    // Build members list from contributions
    const memberMap = {}
    allContributions.value.forEach(c => {
      const userId = c.user_id
      if (!memberMap[userId]) {
        memberMap[userId] = {
          id: userId,
          name: c.user_name || `User ${userId}`,
          phone: c.user_phone || '-',
          totalContributed: 0,
          status: 'active'
        }
      }
      if (c.payment_status === 'Approved') {
        memberMap[userId].totalContributed += parseFloat(c.amount || 0)
      }
    })
    members.value = Object.values(memberMap)
    
    // Create charts after data is loaded
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

// Computed properties for recent activity
const recentContributions = computed(() => {
  return allContributions.value
    .filter(c => c.payment_status === 'Approved')
    .sort((a, b) => new Date(b.contribution_date) - new Date(a.contribution_date))
    .slice(0, 5)
})

const activeLoansList = computed(() => {
  return allLoans.value
    .filter(l => {
      const status = (l.status || '').toLowerCase()
      return ['approved', 'disbursed', 'waiting', 'received', 'repaid', 'completed'].includes(status)
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5)
})

const recentPenalties = computed(() => {
  return allPenalties.value
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5)
})

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Get member savings
const getMemberSavings = (userId) => {
  const userContribs = allContributions.value.filter(c => c.user_id === userId)
  const total = userContribs
    .filter(c => c.payment_status === 'Approved')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  return total || 0
}

// Create charts
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

  // 1. Savings by Member Chart (Bar Chart)
  const memberLabels = members.value.map(m => m.name.substring(0, 12) + (m.name.length > 12 ? '...' : ''))
  const memberSavings = members.value.map(m => getMemberSavings(m.id))

  if (savingsChartCanvas.value) {
    savingsChart = new Chart(savingsChartCanvas.value, {
      type: 'bar',
      data: {
        labels: memberLabels,
        datasets: [{
          label: 'Savings (RWF)',
          data: memberSavings,
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
          hoverBackgroundColor: chartColors.tertiary,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeInOutQuart' },
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
              label: (context) => ['RWF ' + context.parsed.y.toLocaleString()]
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              callback: (value) => value >= 1000 ? (value/1000).toFixed(0) + 'K' : value
            },
            grid: { color: gridColor, drawBorder: false }
          },
          x: {
            ticks: { color: textColor, maxRotation: 45 },
            grid: { display: false }
          }
        }
      }
    })
  }

  // 2. Financial Distribution Chart (Doughnut Chart)
  const outstandingLoanBalance = Math.max(0, stats.value.totalLoans)
  const netWorth = Math.max(0, stats.value.totalContributions - outstandingLoanBalance - stats.value.penaltyAmount)
  
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
  if (stats.value.penaltyAmount > 0) {
    doughnutSegments.push(stats.value.penaltyAmount)
    doughnutLabels.push('Pending Penalties')
    doughnutColors.push(chartColors.danger)
  }
  if (netWorth > 0) {
    doughnutSegments.push(netWorth)
    doughnutLabels.push('Net Worth')
    doughnutColors.push(chartColors.secondary)
  }
  if (doughnutSegments.length === 0) {
    doughnutSegments.push(1)
    doughnutLabels.push('No Data')
    doughnutColors.push('#9ca3af')
  }

  if (distributionChartCanvas.value) {
    distributionChart = new Chart(distributionChartCanvas.value, {
      type: 'doughnut',
      data: {
        labels: doughnutLabels,
        datasets: [{
          data: doughnutSegments,
          backgroundColor: doughnutColors,
          borderWidth: 0,
          hoverOffset: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#ffffff' : '#000000',
              font: { size: 11 },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: titleColor,
            bodyColor: textColor,
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                return ['RWF ' + context.parsed.toLocaleString(), pct + '%'];
              }
            }
          }
        }
      }
    })
  }

  // 3. Comprehensive Financial Overview Chart (Bar Chart)
  if (comprehensiveChartCanvas.value) {
    comprehensiveChart = new Chart(comprehensiveChartCanvas.value, {
      type: 'bar',
      data: {
        labels: ['Savings', 'Loans', 'Penalties', 'Net Worth'],
        datasets: [{
          label: 'Amount (RWF)',
          data: [stats.value.totalContributions, outstandingLoanBalance, stats.value.penaltyAmount, netWorth],
          backgroundColor: [chartColors.primary + 'CC', chartColors.warning + 'CC', chartColors.danger + 'CC', chartColors.secondary + 'CC'],
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: titleColor,
            bodyColor: textColor,
            callbacks: {
              label: (context) => ['RWF ' + context.parsed.y.toLocaleString()]
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              callback: (value) => value >= 1000 ? (value/1000).toFixed(0) + 'K' : 'RWF ' + value
            },
            grid: { color: gridColor, drawBorder: false }
          },
          x: {
            ticks: { color: textColor },
            grid: { display: false }
          }
        }
      }
    })
  }
}

definePageMeta({
  layout: 'default'
})
</script>