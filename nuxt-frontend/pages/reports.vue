<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-6">
    <div class="max-w-7xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="i-heroicons-document-chart-bar" class="w-7 h-7 text-emerald-600" />
            Financial Reports
          </h1>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {{ isAdmin && showAdminReports ? 'Tontine-wide financial overview' : 'Your personal financial overview' }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button v-if="isAdmin" @click="showAdminReports = !showAdminReports; loadAll()"
            class="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            {{ showAdminReports ? 'My Reports' : 'Admin Reports' }}
          </button>
          <select v-model="selectedTontine" @change="loadAll"
            class="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
            <option value="">All Tontines</option>
            <option v-for="t in tontineList" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <select v-model="dateRange" @change="loadAll"
            class="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
          <!-- Export Dropdown -->
          <div class="relative" ref="exportMenuRef">
            <button @click="exportMenuOpen = !exportMenuOpen"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white transition">
              <Icon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
              Export CSV
              <Icon name="i-heroicons-chevron-down" class="w-3 h-3" />
            </button>
            <div v-if="exportMenuOpen"
              class="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-20 overflow-hidden">
              <button @click="exportCSV('current'); exportMenuOpen = false"
                class="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
                <Icon name="i-heroicons-table-cells" class="w-3.5 h-3.5 text-emerald-600" />
                Current Tab Only
              </button>
              <button @click="exportCSV('full'); exportMenuOpen = false"
                class="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 border-t border-gray-100 dark:border-slate-700">
                <Icon name="i-heroicons-document-text" class="w-3.5 h-3.5 text-blue-600" />
                Full Report (All Types)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>

      <template v-else>
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Total Contributions</p>
            <p class="text-xl font-bold text-emerald-600 mt-1">{{ fmt(summary.contributions?.totalApproved) }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ summary.contributions?.approvedCount }} approved</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Loans Disbursed</p>
            <p class="text-xl font-bold text-amber-600 mt-1">{{ fmt(summary.loans?.totalDisbursed) }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ summary.loans?.activeCount }} active</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Loan Repayments</p>
            <p class="text-xl font-bold text-blue-600 mt-1">{{ fmt(summary.repayments?.totalRepaid) }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ summary.repayments?.repaymentRate }}% repayment rate</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
            <p class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Penalties Collected</p>
            <p class="text-xl font-bold text-red-500 mt-1">{{ fmt(summary.penalties?.paidAmount) }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ summary.penalties?.pendingCount }} pending</p>
          </div>
        </div>

        <!-- Net Balance Bar -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex gap-6">
              <div>
                <p class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Total Inflows</p>
                <p class="text-lg font-bold text-emerald-600">{{ fmt(summary.balance?.totalInflows) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Total Outflows</p>
                <p class="text-lg font-bold text-red-500">{{ fmt(summary.balance?.totalOutflows) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Net Balance</p>
                <p class="text-lg font-bold" :class="(summary.balance?.netBalance ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'">
                  {{ fmt(summary.balance?.netBalance) }}
                </p>
              </div>
            </div>
            <!-- Balance progress bar -->
            <div class="flex-1 max-w-xs">
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>Repaid</span><span>{{ summary.repayments?.repaymentRate ?? 0 }}%</span>
              </div>
              <div class="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                  :style="{ width: Math.min(summary.repayments?.repaymentRate ?? 0, 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions Section -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <!-- Tabs -->
          <div class="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
            <button v-for="tab in tabs" :key="tab.key" @click="switchTab(tab.key)"
              class="px-5 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px"
              :class="activeTab === tab.key
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white'">
              {{ tab.label }}
              <span class="ml-1.5 px-1.5 py-0.5 text-xs rounded-full"
                :class="activeTab === tab.key ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'">
                {{ pagination.total }}
              </span>
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">#</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                  <th v-if="isAdmin && showAdminReports" class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Member</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Tontine</th>
                  <th v-if="activeTab === 'loans'" class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Purpose</th>
                  <th v-if="activeTab === 'penalties'" class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Reason</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
                <tr v-if="tableLoading">
                  <td :colspan="colSpan" class="text-center py-10 text-gray-400">
                    <div class="flex justify-center"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div></div>
                  </td>
                </tr>
                <tr v-else-if="rows.length === 0">
                  <td :colspan="colSpan" class="text-center py-10 text-gray-400 dark:text-slate-500">No records found</td>
                </tr>
                <tr v-for="(row, i) in rows" :key="row.id" class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition">
                  <td class="px-4 py-3 text-gray-400 text-xs">{{ (pagination.page - 1) * pagination.limit + i + 1 }}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">{{ fmtDate(row.created_at) }}</td>
                  <td v-if="isAdmin && showAdminReports" class="px-4 py-3 text-gray-900 dark:text-white font-medium">{{ row.user_name || '—' }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-slate-400">{{ row.tontine_name || '—' }}</td>
                  <td v-if="activeTab === 'loans'" class="px-4 py-3 text-gray-600 dark:text-slate-400 max-w-[160px] truncate" :title="row.purpose">{{ row.purpose || '—' }}</td>
                  <td v-if="activeTab === 'penalties'" class="px-4 py-3 text-gray-600 dark:text-slate-400 max-w-[160px] truncate" :title="row.reason">{{ row.reason || '—' }}</td>
                  <td class="px-4 py-3 text-right font-semibold" :class="amountColor">
                    RWF {{ parseFloat(row.amount || 0).toLocaleString() }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="statusClass(row.status || row.payment_status)">
                      {{ row.status || row.payment_status || '—' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
            <p class="text-xs text-gray-500 dark:text-slate-400">
              Showing {{ rows.length ? (pagination.page - 1) * pagination.limit + 1 : 0 }}–{{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }}
            </p>
            <div class="flex items-center gap-1">
              <button @click="goPage(1)" :disabled="pagination.page === 1"
                class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-white transition">«</button>
              <button @click="goPage(pagination.page - 1)" :disabled="pagination.page === 1"
                class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-white transition">‹</button>
              <button v-for="p in visiblePages" :key="p" @click="goPage(p)"
                class="px-2.5 py-1 text-xs rounded border transition"
                :class="p === pagination.page
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-white'">
                {{ p }}
              </button>
              <button @click="goPage(pagination.page + 1)" :disabled="pagination.page >= totalPages"
                class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-white transition">›</button>
              <button @click="goPage(totalPages)" :disabled="pagination.page >= totalPages"
                class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-white transition">»</button>
            </div>
            <select v-model="pagination.limit" @change="goPage(1)"
              class="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white">
              <option :value="10">10 / page</option>
              <option :value="15">15 / page</option>
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
            </select>
          </div>
        </div>

        <!-- Ledger Summary -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-white mb-4 uppercase tracking-wide">Ledger Summary</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-sm">
            <div v-for="item in ledgerItems" :key="item.label" class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
              <span class="text-gray-500 dark:text-slate-400">{{ item.label }}</span>
              <span class="font-semibold" :class="item.color">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { isAdminOnly } from '~/utils/authGuard'

definePageMeta({ layout: 'default' })

const { user, initAuth } = useAuth()
const { formatDashboardAmount } = useCurrency()
const { api } = useApi()

const isAdmin = computed(() => isAdminOnly(user.value))
const showAdminReports = ref(true)
const selectedTontine = ref('')
const dateRange = ref('all')
const tontineList = ref([])
const loading = ref(false)
const tableLoading = ref(false)
const summary = ref({})
const rows = ref([])
const activeTab = ref('contributions')
const pagination = reactive({ page: 1, limit: 15, total: 0 })

const tabs = [
  { key: 'contributions', label: 'Contributions' },
  { key: 'loans', label: 'Loans' },
  { key: 'repayments', label: 'Repayments' },
  { key: 'penalties', label: 'Penalties' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.limit)))

const visiblePages = computed(() => {
  const pages = [], total = totalPages.value, cur = pagination.page
  const start = Math.max(1, cur - 2), end = Math.min(total, cur + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const amountColor = computed(() => ({
  contributions: 'text-emerald-600',
  loans: 'text-amber-600',
  repayments: 'text-blue-600',
  penalties: 'text-red-500',
}[activeTab.value]))

const colSpan = computed(() => {
  let base = 5
  if (isAdmin.value && showAdminReports.value) base++
  if (activeTab.value === 'loans' || activeTab.value === 'penalties') base++
  return base
})

const fmt = (v) => formatDashboardAmount(v ?? 0)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const statusClass = (s) => {
  const map = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    disbursed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  }
  return map[(s || '').toLowerCase()] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
}

const ledgerItems = computed(() => {
  const s = summary.value
  return [
    { label: 'Contributions (Approved)', value: fmt(s.contributions?.totalApproved), color: 'text-emerald-600' },
    { label: 'Contributions (Pending)', value: fmt(s.contributions?.totalPending), color: 'text-yellow-600' },
    { label: 'Loans Disbursed', value: fmt(s.loans?.totalDisbursed), color: 'text-amber-600' },
    { label: 'Loans Repaid', value: fmt(s.repayments?.totalRepaid), color: 'text-blue-600' },
    { label: 'Repayment Rate', value: (s.repayments?.repaymentRate ?? 0) + '%', color: 'text-blue-600' },
    { label: 'Active Loans', value: String(s.loans?.activeCount ?? 0), color: 'text-gray-700 dark:text-white' },
    { label: 'Pending Loans', value: String(s.loans?.pendingCount ?? 0), color: 'text-yellow-600' },
    { label: 'Penalties Issued', value: fmt(s.penalties?.totalAmount), color: 'text-red-500' },
    { label: 'Penalties Collected', value: fmt(s.penalties?.paidAmount), color: 'text-emerald-600' },
    { label: 'Total Inflows', value: fmt(s.balance?.totalInflows), color: 'text-emerald-700 font-bold' },
    { label: 'Total Outflows', value: fmt(s.balance?.totalOutflows), color: 'text-red-600 font-bold' },
    { label: 'Net Balance', value: fmt(s.balance?.netBalance), color: (s.balance?.netBalance ?? 0) >= 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold' },
  ]
})

const buildParams = () => {
  const p = { days: dateRange.value }
  if (selectedTontine.value) p.tontineId = selectedTontine.value
  if (!isAdmin.value || !showAdminReports.value) p.userId = user.value?.userId || user.value?.id
  return p
}

const loadSummary = async () => {
  try {
    const res = await api('/v1/reports/summary', { params: buildParams() })
    summary.value = res.data || res
  } catch (e) { console.error(e) }
}

const loadTransactions = async () => {
  tableLoading.value = true
  try {
    const res = await api('/v1/reports/transactions', {
      params: { ...buildParams(), type: activeTab.value, page: pagination.page, limit: pagination.limit }
    })
    const d = res.data || res
    rows.value = d.data || []
    pagination.total = d.total ?? d.pagination?.total ?? 0
  } catch (e) { console.error(e) }
  finally { tableLoading.value = false }
}

const loadAll = async () => {
  pagination.page = 1
  await Promise.all([loadSummary(), loadTransactions()])
}

const switchTab = (key) => {
  activeTab.value = key
  pagination.page = 1
  loadTransactions()
}

const goPage = (p) => {
  if (p < 1 || p > totalPages.value) return
  pagination.page = p
  loadTransactions()
}

const exportMenuOpen = ref(false)
const exportMenuRef = ref(null)
const exportingFull = ref(false)

// Close dropdown when clicking outside
if (process.client) {
  document.addEventListener('click', (e) => {
    if (exportMenuRef.value && !exportMenuRef.value.contains(e.target)) {
      exportMenuOpen.value = false
    }
  })
}

const downloadCSV = (csv, filename) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename
  a.click()
}

const buildRow = (r, type) =>
  [fmtDate(r.created_at), type, `"${r.user_name || ''}"`, `"${r.tontine_name || ''}"`, r.amount || 0, r.status || r.payment_status || ''].join(',')

const exportCSV = async (mode = 'current') => {
  const date = new Date().toISOString().split('T')[0]
  const headers = 'Date,Type,Member,Tontine,Amount,Status\n'

  if (mode === 'current') {
    let csv = headers
    rows.value.forEach(r => { csv += buildRow(r, activeTab.value) + '\n' })
    downloadCSV(csv, `report-${activeTab.value}-${date}.csv`)
    return
  }

  // Full report — fetch all 4 types (all pages)
  exportingFull.value = true
  const toast = useToast()
  try {
    const types = ['contributions', 'loans', 'repayments', 'penalties']
    let csv = headers
    for (const type of types) {
      let page = 1, fetched = 0, total = Infinity
      while (fetched < total) {
        const res = await api('/v1/reports/transactions', {
          params: { ...buildParams(), type, page, limit: 200 }
        })
        const d = res.data || res
        const chunk = d.data || []
        total = d.total ?? 0
        chunk.forEach(r => { csv += buildRow(r, type) + '\n' })
        fetched += chunk.length
        if (!chunk.length) break
        page++
      }
    }
    downloadCSV(csv, `full-report-${date}.csv`)
    toast.add({ title: 'Export complete', description: 'Full report downloaded', color: 'green' })
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Export failed', color: 'red' })
  } finally {
    exportingFull.value = false
  }
}

onMounted(async () => {
  if (!process.client) return
  initAuth()
  if (!user.value) return
  loading.value = true
  try {
    const res = await api('/v1/tontines')
    const d = res.data || res
    tontineList.value = Array.isArray(d) ? d : (d.data || [])
    const route = useRoute()
    if (route.query.tontine) selectedTontine.value = route.query.tontine
    await loadAll()
  } finally { loading.value = false }

  document.addEventListener('click', (e) => {
    if (exportMenuRef.value && !exportMenuRef.value.contains(e.target)) {
      exportMenuOpen.value = false
    }
  })
})
</script>
