<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-7xl mx-auto">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">All Tontines Dashboard</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Comprehensive overview of all tontines</p>
        </div>
        <div class="flex items-center gap-3">
          <USelect v-model="selectedMonth" :options="monthOptions" class="w-36" @change="applyFilters" />
          <USelect v-model="selectedYear" :options="yearOptions" class="w-28" @change="applyFilters" />
          <UButton variant="ghost" color="gray" size="sm" @click="resetFilters">Reset</UButton>
          <UButton @click="navigateTo('/tontines')" variant="outline" icon="i-heroicons-arrow-left">Back</UButton>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p class="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
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
                <p class="text-xs text-emerald-200 mt-1">Across {{ stats.totalTontines }} tontines</p>
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
                <p class="text-xs text-white/80 mt-1">{{ stats.mainTontines }} main · {{ stats.branchTontines }} branch</p>
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
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ formatDashboardAmount(stats.penalties.pending) }}</p>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
              <div class="bg-red-500 h-1.5 rounded-full transition-all" :style="{ width: Math.min((stats.penalties.pending / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' }"></div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Penalties</span>
              <Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
            </div>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ formatDashboardAmount(stats.penalties.paid) }}</p>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
              <div class="bg-green-500 h-1.5 rounded-full transition-all" :style="{ width: Math.min((stats.penalties.paid / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' }"></div>
            </div>
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
              <div class="bg-blue-500 h-1.5 rounded-full transition-all" :style="{ width: stats.totalLoanRequested > 0 ? ((stats.totalLoanPaid / stats.totalLoanRequested) * 100) + '%' : '0%' }"></div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Savings by Tontine</h3>
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

        <!-- Tontines Table -->
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="p-6">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">All Tontines</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Members</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contribution</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Savings</th>
                    <th class="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th class="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="tontine in allTontinesList" :key="tontine.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                    <td class="py-3 px-4">
                      <div class="font-medium text-gray-900 dark:text-white">{{ tontine.name }}</div>
                      <div v-if="tontine.parent_tontine_name" class="text-xs text-gray-400">of {{ tontine.parent_tontine_name }}</div>
                    </td>
                    <td class="py-3 px-4">
                      <UBadge v-if="tontine.tontine_type === 'main'" color="emerald" size="xs">Main</UBadge>
                      <UBadge v-else color="blue" size="xs" variant="subtle">Branch</UBadge>
                    </td>
                    <td class="py-3 px-4 text-gray-700 dark:text-gray-300">{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</td>
                    <td class="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">RWF {{ Number(tontine.contribution_amount || 0).toLocaleString() }}</td>
                    <td class="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">{{ formatDashboardAmount(getTontineSavings(tontine.id)) }}</td>
                    <td class="py-3 px-4 text-center"><StatusBadge :status="tontine.status" /></td>
                    <td class="py-3 px-4 text-center">
                      <UButton @click="navigateTo(`/tontine-dashboard/${tontine.id}`)" color="blue" variant="ghost" size="xs" icon="i-heroicons-eye">View</UButton>
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
let Chart = null
if (process.client) {
  const chartjs = await import('chart.js')
  Chart = chartjs.Chart
  Chart.register(...chartjs.registerables)
}

const { formatDashboardAmount } = useCurrency()
const loading = ref(true)
const allTontinesList = ref([])
const contributionsByTontine = ref({})

const stats = ref({
  totalTontines: 0, mainTontines: 0, branchTontines: 0,
  totalMembers: 0, totalContributions: 0,
  activeLoans: 0, totalLoans: 0, totalLoanRequested: 0, totalLoanPaid: 0,
  penalties: { pending: 0, paid: 0 }
})

const allContributions = ref([])
const allLoans = ref([])
const allPayments = ref([])
const allPenalties = ref([])

const selectedMonth = ref(null)
const selectedYear = ref(null)

const monthOptions = [
  { label: 'All Months', value: null },
  ...['January','February','March','April','May','June','July','August','September','October','November','December']
    .map((l, i) => ({ label: l, value: i + 1 }))
]
const currentYear = new Date().getFullYear()
const yearOptions = [{ label: 'All Years', value: null }, ...Array.from({ length: currentYear - 2023 }, (_, i) => ({ label: String(2024 + i), value: 2024 + i }))]

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
    allTontinesList.value = extractArr(await api('/v1/tontines', { params: { limit: 100 } }))
    const cd = await api('/v1/contributions', { params: { limit: 10000 } })
    const cdData = cd.data || cd
    allContributions.value = Array.isArray(cdData) ? cdData : (cdData.contributions || extractArr(cd))
    const ld = await api('/v1/loans', { params: { limit: 10000 } })
    const ldData = ld.data || ld
    allLoans.value = Array.isArray(ldData) ? ldData : (ldData.loans || extractArr(ld))
    allPayments.value = extractArr(await api('/v1/payments', { params: { limit: 10000 } }))
    try {
      const pr = await api('/v1/penalties', { params: { limit: 10000 } })
      allPenalties.value = pr.data || pr.penalties || extractArr(pr)
    } catch { allPenalties.value = [] }
    applyFilters()
  } catch (e) {
    console.error('Dashboard fetch error:', e)
  } finally {
    loading.value = false
    nextTick(() => nextTick(() => createCharts()))
  }
}

const getTontineSavings = (id) =>
  allContributions.value.filter(c => c.tontine_id === id && c.payment_status === 'Approved')
    .reduce((s, c) => s + parseFloat(c.amount || 0), 0)

const applyFilters = () => {
  stats.value.totalTontines = allTontinesList.value.length
  stats.value.mainTontines = allTontinesList.value.filter(t => t.tontine_type === 'main').length
  stats.value.branchTontines = allTontinesList.value.filter(t => t.tontine_type === 'branch').length
  stats.value.totalMembers = allTontinesList.value.reduce((s, t) => s + (parseInt(t.member_count) || 0), 0)

  const fy = selectedYear.value !== null ? Number(selectedYear.value) : null
  const fm = selectedMonth.value !== null ? Number(selectedMonth.value) : null

  const inRange = (dateStr) => {
    if (!dateStr) return true
    try {
      const d = new Date(dateStr)
      if (fy !== null && d.getFullYear() !== fy) return false
      if (fm !== null && d.getMonth() + 1 !== fm) return false
      return true
    } catch { return true }
  }

  const fc = allContributions.value.filter(c => c.payment_status === 'Approved' && inRange(c.contribution_date || c.created_at))
  const fl = allLoans.value.filter(l => inRange(l.created_at) && ['approved','disbursed','waiting','received','repaid','completed'].includes((l.status||'').toLowerCase()))
  const fp = allPayments.value.filter(p => inRange(p.created_at || p.payment_date) && p.payment_type === 'loan_payment')
  const fpen = allPenalties.value.filter(p => inRange(p.created_at || p.paid_at))

  stats.value.totalContributions = fc.reduce((s, c) => s + parseFloat(c.amount || 0), 0)
  stats.value.totalLoanRequested = fl.reduce((s, l) => s + parseFloat(l.amount || 0), 0)
  const paid = fp.filter(p => ['completed','approved'].includes((p.status||p.payment_status||'').toLowerCase())).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  stats.value.totalLoanPaid = paid
  stats.value.totalLoans = stats.value.totalLoanRequested - paid
  stats.value.activeLoans = fl.length
  stats.value.penalties.pending = fpen.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  stats.value.penalties.paid = fpen.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  contributionsByTontine.value = fc.reduce((acc, c) => {
    if (!acc[c.tontine_id]) acc[c.tontine_id] = []
    acc[c.tontine_id].push(c)
    return acc
  }, {})

  nextTick(() => nextTick(() => createCharts()))
}

const resetFilters = () => { selectedMonth.value = null; selectedYear.value = null; applyFilters() }

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
    blue: isDark ? '#60a5fa' : '#3b82f6',
    bg: isDark ? '#1f2937' : '#1f2937',
    tooltipText: '#f9fafb'
  }

  const labels = allTontinesList.value.map(t => t.name.length > 10 ? t.name.substring(0, 10) + '…' : t.name)
  const savings = allTontinesList.value.map(t => getTontineSavings(t.id))

  if (savingsChartCanvas.value) {
    savingsChart = new Chart(savingsChartCanvas.value, {
      type: 'bar',
      data: { labels, datasets: [{ data: savings, backgroundColor: C.green + 'CC', borderRadius: 8, borderSkipped: false, maxBarThickness: 35 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: C.bg, titleColor: C.tooltipText, bodyColor: C.tooltipText, callbacks: { label: ctx => 'RWF ' + ctx.parsed.y.toLocaleString() } } },
        scales: {
          y: { beginAtZero: true, ticks: { color: textColor, callback: v => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v }, grid: { color: gridColor } },
          x: { ticks: { color: textColor, maxRotation: 45 }, grid: { display: false } }
        }
      }
    })
  }

  const outstanding = Math.max(0, stats.value.totalLoans)
  const totalC = stats.value.totalContributions
  const pendingP = stats.value.penalties.pending
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
