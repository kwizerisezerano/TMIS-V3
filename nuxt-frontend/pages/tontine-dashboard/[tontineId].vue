<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-7xl mx-auto">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ tontineName }}</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Tontine financial overview</p>
        </div>
        <UButton @click="navigateTo('/tontines-dashboard')" variant="outline" icon="i-heroicons-arrow-left">All Tontines</UButton>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p class="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>

      <div v-else>
        <!-- Row 1: 3 main gradient cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div class="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-2xl p-5 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-emerald-50 text-sm font-medium">Total Savings</p>
                <p class="text-3xl font-bold mt-1">{{ formatDashboardAmount(stats.totalContributions) }}</p>
                <p class="text-xs text-emerald-200 mt-1">{{ stats.contributionCount }} approved contributions</p>
              </div>
              <div class="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
                <Icon name="i-heroicons-banknotes" class="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-2xl p-5 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-amber-50 text-sm font-medium">Outstanding Loans</p>
                <p class="text-3xl font-bold mt-1">{{ formatDashboardAmount(stats.totalLoans) }}</p>
                <p class="text-xs text-amber-200 mt-1">{{ stats.activeLoans }} active loan(s)</p>
              </div>
              <div class="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
                <Icon name="i-heroicons-credit-card" class="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-2xl p-5 text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-white text-sm font-medium">Total Members</p>
                <p class="text-3xl font-bold mt-1">{{ stats.totalMembers }}</p>
                <p class="text-xs text-white/80 mt-1">{{ stats.activeMembers }} active</p>
              </div>
              <div class="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
                <Icon name="i-heroicons-users" class="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: 3 detail cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Penalties</span>
              <Icon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-500" />
            </div>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ formatDashboardAmount(stats.penaltyAmount) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ stats.pendingPenalties }} pending</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Net Worth</span>
              <Icon name="i-heroicons-chart-pie" class="w-5 h-5 text-teal-500" />
            </div>
            <p class="text-2xl font-bold text-teal-600 dark:text-teal-400">{{ formatDashboardAmount(Math.max(0, stats.totalContributions - stats.totalLoans - stats.penaltyAmount)) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Savings minus loans & penalties</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Loan Repayment</span>
              <Icon name="i-heroicons-arrow-path" class="w-5 h-5 text-blue-500" />
            </div>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ stats.totalLoanRequested > 0 ? ((stats.totalLoanPaid / stats.totalLoanRequested) * 100).toFixed(1) : 0 }}%
            </p>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
              <div class="bg-blue-500 h-1.5 rounded-full" :style="{ width: stats.totalLoanRequested > 0 ? ((stats.totalLoanPaid / stats.totalLoanRequested) * 100) + '%' : '0%' }"></div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Savings by Member</h3>
              <div class="h-60"><canvas ref="savingsChartCanvas"></canvas></div>
            </div>
          </UCard>
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Financial Distribution</h3>
              <div class="h-60"><canvas ref="distributionChartCanvas"></canvas></div>
            </div>
          </UCard>
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Financial Overview</h3>
              <div class="h-60"><canvas ref="comprehensiveChartCanvas"></canvas></div>
            </div>
          </UCard>
        </div>

        <!-- Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="p-5">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Contributions</h3>
              <div class="space-y-3">
                <div v-for="c in recentContributions" :key="c.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ c.user_name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(c.contribution_date) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">RWF {{ Number(c.amount||0).toLocaleString() }}</div>
                    <UBadge color="green" size="xs">Approved</UBadge>
                  </div>
                </div>
                <p v-if="!recentContributions.length" class="text-center text-sm text-gray-400 py-4">No contributions yet</p>
              </div>
            </div>
          </UCard>

          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="p-5">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Active Loans</h3>
              <div class="space-y-3">
                <div v-for="l in activeLoansList" :key="l.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ l.user_name || l.borrower_name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ l.repayment_period }} months</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-semibold text-amber-600 dark:text-amber-400">RWF {{ Number(l.amount||0).toLocaleString() }}</div>
                    <UBadge color="blue" size="xs">{{ l.status }}</UBadge>
                  </div>
                </div>
                <p v-if="!activeLoansList.length" class="text-center text-sm text-gray-400 py-4">No active loans</p>
              </div>
            </div>
          </UCard>

          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="p-5">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Penalties</h3>
              <div class="space-y-3">
                <div v-for="p in recentPenalties" :key="p.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ p.user_name || p.member_name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{{ p.reason }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-semibold text-red-600 dark:text-red-400">RWF {{ Number(p.amount||0).toLocaleString() }}</div>
                    <UBadge :color="p.status === 'pending' ? 'red' : 'green'" size="xs">{{ p.status }}</UBadge>
                  </div>
                </div>
                <p v-if="!recentPenalties.length" class="text-center text-sm text-gray-400 py-4">No penalties</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
let Chart = null
if (process.client) {
  const chartjs = await import('chart.js')
  Chart = chartjs.Chart
  Chart.register(...chartjs.registerables)
}

const route = useRoute()
const tontineId = computed(() => parseInt(route.params.tontineId))
const { formatDashboardAmount } = useCurrency()

const loading = ref(true)
const tontineName = ref('')
const members = ref([])
const allContributions = ref([])
const allLoans = ref([])
const allPayments = ref([])
const allPenalties = ref([])

const stats = ref({
  totalMembers: 0, activeMembers: 0,
  totalContributions: 0, contributionCount: 0,
  activeLoans: 0, totalLoans: 0, totalLoanRequested: 0, totalLoanPaid: 0,
  pendingPenalties: 0, penaltyAmount: 0
})

const savingsChartCanvas = ref(null)
const distributionChartCanvas = ref(null)
const comprehensiveChartCanvas = ref(null)
let savingsChart = null, distributionChart = null, comprehensiveChart = null

onMounted(() => fetchDashboardData())
onUnmounted(() => { savingsChart?.destroy(); distributionChart?.destroy(); comprehensiveChart?.destroy() })

const extractArr = (r) => {
  if (!r) return []
  if (Array.isArray(r)) return r
  if (Array.isArray(r.data)) return r.data
  if (Array.isArray(r.data?.data)) return r.data.data
  return []
}

const fetchDashboardData = async () => {
  const { api } = useApi()
  try {
    const tontinesArr = extractArr(await api('/v1/tontines', { params: { limit: 100 } }))
    const tontine = tontinesArr.find(t => t.id === tontineId.value)
    if (tontine) {
      tontineName.value = tontine.name
      stats.value.totalMembers = parseInt(tontine.member_count) || 0
      stats.value.activeMembers = parseInt(tontine.member_count) || 0
    }

    const cd = await api('/v1/contributions', { params: { limit: 1000 } })
    const cdData = cd.data || cd
    const allC = Array.isArray(cdData) ? cdData : (Array.isArray(cdData.data) ? cdData.data : [])
    allContributions.value = allC.filter(c => c.tontine_id === tontineId.value)

    const ld = await api('/v1/loans', { params: { limit: 1000 } })
    const ldData = ld.data || ld
    const allL = Array.isArray(ldData) ? ldData : (Array.isArray(ldData.data) ? ldData.data : [])
    allLoans.value = allL.filter(l => l.tontine_id === tontineId.value)

    const pd = await api('/v1/payments', { params: { limit: 1000 } })
    const pdData = pd.data || pd
    const allP = Array.isArray(pdData) ? pdData : (Array.isArray(pdData.data) ? pdData.data : [])
    allPayments.value = allP.filter(p => p.tontine_id === tontineId.value)

    try {
      const pen = await api('/v1/penalties', { params: { limit: 1000 } })
      const penData = pen.data || pen
      const allPen = Array.isArray(penData) ? penData : (Array.isArray(penData.data) ? penData.data : [])
      allPenalties.value = allPen.filter(p => p.tontine_id === tontineId.value)
    } catch { allPenalties.value = [] }

    const approved = allContributions.value.filter(c => c.payment_status === 'Approved')
    stats.value.totalContributions = approved.reduce((s, c) => s + parseFloat(c.amount || 0), 0)
    stats.value.contributionCount = approved.length

    const activeL = allLoans.value.filter(l => ['approved','disbursed','waiting','received','repaid','completed'].includes((l.status||'').toLowerCase()))
    stats.value.activeLoans = activeL.length
    stats.value.totalLoanRequested = activeL.reduce((s, l) => s + parseFloat(l.amount || 0), 0)
    stats.value.totalLoanPaid = allPayments.value
      .filter(p => ['completed','approved'].includes((p.status||p.payment_status||'').toLowerCase()) && p.payment_type === 'loan_payment')
      .reduce((s, p) => s + parseFloat(p.amount || 0), 0)
    stats.value.totalLoans = stats.value.totalLoanRequested - stats.value.totalLoanPaid

    const pendingPen = allPenalties.value.filter(p => p.status === 'pending')
    stats.value.pendingPenalties = pendingPen.length
    stats.value.penaltyAmount = pendingPen.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

    const memberMap = {}
    allContributions.value.forEach(c => {
      if (!memberMap[c.user_id]) memberMap[c.user_id] = { id: c.user_id, name: c.user_name || `User ${c.user_id}`, totalContributed: 0 }
      if (c.payment_status === 'Approved') memberMap[c.user_id].totalContributed += parseFloat(c.amount || 0)
    })
    members.value = Object.values(memberMap)
  } catch (e) {
    console.error('Tontine dashboard error:', e)
  } finally {
    loading.value = false
    nextTick(() => nextTick(() => createCharts()))
  }
}

const recentContributions = computed(() =>
  allContributions.value.filter(c => c.payment_status === 'Approved')
    .sort((a, b) => new Date(b.contribution_date) - new Date(a.contribution_date)).slice(0, 5)
)
const activeLoansList = computed(() =>
  allLoans.value.filter(l => ['approved','disbursed','waiting','received'].includes((l.status||'').toLowerCase()))
    .sort((a, b) => new Date(b.created_at||0) - new Date(a.created_at||0)).slice(0, 5)
)
const recentPenalties = computed(() =>
  allPenalties.value.sort((a, b) => new Date(b.created_at||0) - new Date(a.created_at||0)).slice(0, 5)
)

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

const createCharts = () => {
  if (!Chart) return
  savingsChart?.destroy(); distributionChart?.destroy(); comprehensiveChart?.destroy()

  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#d1d5db' : '#4b5563'
  const gridColor = isDark ? 'rgba(75,85,99,0.3)' : 'rgba(156,163,175,0.4)'
  const C = {
    green: isDark ? '#34d399' : '#059669',
    teal: isDark ? '#6ee7b7' : '#10b981',
    amber: isDark ? '#fbbf24' : '#f59e0b',
    red: isDark ? '#f87171' : '#ef4444',
    bg: '#1f2937',
    tooltipText: '#f9fafb'
  }

  const memberLabels = members.value.map(m => m.name.length > 10 ? m.name.substring(0, 10) + '…' : m.name)
  const memberSavings = members.value.map(m => m.totalContributed)

  if (savingsChartCanvas.value) {
    savingsChart = new Chart(savingsChartCanvas.value, {
      type: 'bar',
      data: { labels: memberLabels, datasets: [{ data: memberSavings, backgroundColor: C.green + 'CC', borderRadius: 8, borderSkipped: false, maxBarThickness: 35 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: C.bg, titleColor: C.tooltipText, bodyColor: C.tooltipText, callbacks: { label: ctx => 'RWF ' + ctx.parsed.y.toLocaleString() } } },
        scales: {
          y: { beginAtZero: true, ticks: { color: textColor, callback: v => v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v }, grid: { color: gridColor } },
          x: { ticks: { color: textColor, maxRotation: 45 }, grid: { display: false } }
        }
      }
    })
  }

  const outstanding = Math.max(0, stats.value.totalLoans)
  const totalC = stats.value.totalContributions
  const pendingP = stats.value.penaltyAmount
  const segs = [], segLabels = [], segColors = []
  if (totalC > 0) { segs.push(totalC); segLabels.push('Savings'); segColors.push(C.green) }
  if (outstanding > 0) { segs.push(outstanding); segLabels.push('Loans'); segColors.push(C.amber) }
  if (pendingP > 0) { segs.push(pendingP); segLabels.push('Penalties'); segColors.push(C.red) }
  if (!segs.length) { segs.push(1); segLabels.push('No Data'); segColors.push('#9ca3af') }

  if (distributionChartCanvas.value) {
    distributionChart = new Chart(distributionChartCanvas.value, {
      type: 'doughnut',
      data: { labels: segLabels, datasets: [{ data: segs, backgroundColor: segColors, borderWidth: 0, hoverOffset: 10 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } },
          tooltip: { backgroundColor: C.bg, titleColor: C.tooltipText, bodyColor: C.tooltipText, callbacks: { label: ctx => { const t = ctx.dataset.data.reduce((a,b)=>a+b,0); return ['RWF '+ctx.parsed.toLocaleString(), ((ctx.parsed/t)*100).toFixed(1)+'%'] } } }
        }
      }
    })
  }

  const netWorth = Math.max(0, totalC - outstanding - pendingP)
  if (comprehensiveChartCanvas.value) {
    comprehensiveChart = new Chart(comprehensiveChartCanvas.value, {
      type: 'bar',
      data: {
        labels: ['Savings', 'Loans', 'Penalties', 'Net Worth'],
        datasets: [{ data: [totalC, outstanding, pendingP, netWorth], backgroundColor: [C.green+'CC', C.amber+'CC', C.red+'CC', C.teal+'CC'], borderRadius: 10, borderSkipped: false, maxBarThickness: 35 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: C.bg, titleColor: C.tooltipText, bodyColor: C.tooltipText, callbacks: { label: ctx => 'RWF ' + ctx.parsed.y.toLocaleString() } } },
        scales: {
          y: { beginAtZero: true, ticks: { color: textColor, callback: v => v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v }, grid: { color: gridColor } },
          x: { ticks: { color: textColor }, grid: { display: false } }
        }
      }
    })
  }
}

const colorMode = useColorMode()
watch(() => colorMode.value, () => nextTick(() => nextTick(() => createCharts())))

definePageMeta({ layout: 'default' })
</script>
