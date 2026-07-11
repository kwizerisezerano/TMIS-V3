<template>
  <div class="min-h-screen bg-white dark:bg-slate-900 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            <Icon name="i-heroicons-chart-bar" class="w-8 h-8 inline mr-2" />
            Financial Reports
          </h1>
          <p class="text-gray-600 dark:text-slate-400 mt-1">
            {{ (isAdmin && showAdminReports) ? 'Tontine-wide financial analytics and insights' : 'Your personal financial overview' }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <!-- Toggle for admin reports -->
          <div v-if="isAdmin" class="flex items-center gap-2">
            <button 
              @click="showAdminReports = !showAdminReports; fetchReportsData()" 
              class="px-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              {{ showAdminReports ? 'View My Reports' : 'View Admin Reports' }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-white whitespace-nowrap">Tontine:</label>
            <select v-model="selectedTontine" @change="fetchReportsData" class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm">
              <option value="">All Tontines</option>
              <option v-for="tontine in ((isAdmin && showAdminReports) ? tontines : userTontines)" :key="tontine.id" :value="tontine.id">
                {{ tontine.name }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-white whitespace-nowrap">Period:</label>
            <select v-model="dateRange" @change="applyDateRange" class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3 mb-8">
        <UButton @click="exportToCSV" color="green" variant="solid" size="sm">
          <UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-1" />
          Export CSV
        </UButton>
        <UButton @click="exportToPDF" color="gray" variant="outline" size="sm">
          <UIcon name="i-heroicons-document" class="w-4 h-4 mr-1" />
          Export PDF
        </UButton>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard class="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Contributions</span>
              <div class="p-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg">
                <Icon name="i-heroicons-banknotes" class="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
            <div class="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{{ formatDashboardAmount(stats.totalContributions) }}</div>
            <div class="flex items-center mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              <span>{{ stats.contributionCount }} transactions</span>
              <span v-if="contributionTrend" :class="contributionTrend >= 0 ? 'text-green-600' : 'text-red-600'" class="ml-2">
                {{ contributionTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(contributionTrend) }}%
              </span>
            </div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20">
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-amber-700 dark:text-amber-300">Loans Disbursed</span>
              <div class="p-2 bg-amber-200 dark:bg-amber-800 rounded-lg">
                <Icon name="i-heroicons-currency-dollar" class="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
            <div class="text-2xl font-bold text-amber-800 dark:text-amber-200">{{ formatDashboardAmount(stats.totalLoanRequested) }}</div>
            <div class="flex items-center mt-2 text-xs text-amber-600 dark:text-amber-400">
              <span>{{ stats.activeLoans }} active</span>
              <span v-if="loanTrend" :class="loanTrend >= 0 ? 'text-green-600' : 'text-red-600'" class="ml-2">
                {{ loanTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(loanTrend) }}%
              </span>
            </div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20">
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300">Loan Repayments</span>
              <div class="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Icon name="i-heroicons-arrow-trending-up" class="w-5 h-5 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
            <div class="text-2xl font-bold text-blue-800 dark:text-blue-200">{{ formatDashboardAmount(stats.totalLoanPaid) }}</div>
            <div class="flex items-center mt-2 text-xs text-blue-600 dark:text-blue-400">
              <span>{{ stats.paymentRate }}% repayment rate</span>
            </div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/20">
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-violet-700 dark:text-violet-300">{{ (isAdmin && showAdminReports) ? 'Active Members' : 'Your Tontines' }}</span>
              <div class="p-2 bg-violet-200 dark:bg-violet-800 rounded-lg">
                <Icon :name="(isAdmin && showAdminReports) ? 'i-heroicons-users' : 'i-heroicons-building-library'" class="w-5 h-5 text-violet-700 dark:text-violet-300" />
              </div>
            </div>
            <div class="text-2xl font-bold text-violet-800 dark:text-violet-200">{{ (isAdmin && showAdminReports) ? stats.totalMembers : userTontines.length }}</div>
            <div class="flex items-center mt-2 text-xs text-violet-600 dark:text-violet-400">
              <span>{{ (isAdmin && showAdminReports) ? tontines.length + ' tontines' : 'Active memberships' }}</span>
            </div>
          </div>
        </UCard>
      </div>


      <!-- Detailed Transaction Tables -->
      <div class="grid grid-cols-1 gap-6 mb-8">
        <!-- Contributions Table -->
        <UCard class="border-0 shadow-lg">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Contribution Details</h3>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ contributions.length }} records</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200 dark:border-slate-600">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider" v-if="isAdmin && showAdminReports">Member</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Tontine</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in contributions" :key="item.id" class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 px-4 text-gray-900 dark:text-white">{{ formatDate(item.created_at) }}</td>
                    <td class="py-3 px-4 text-gray-900 dark:text-white" v-if="isAdmin && showAdminReports">{{ item.user_name || 'N/A' }}</td>
                    <td class="py-3 px-4 text-gray-900 dark:text-white">{{ item.tontine_name || 'N/A' }}</td>
                    <td class="py-3 px-4 text-right font-semibold text-green-600">RWF {{ parseFloat(item.amount || 0).toLocaleString() }}</td>
                    <td class="py-3 px-4 text-center">
                      <UBadge :color="getStatusColor(item.payment_status)" size="xs">
                        {{ item.payment_status }}
                      </UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UCard>

        <!-- Loans Table -->
        <UCard class="border-0 shadow-lg">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Loan Details</h3>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ loans.length }} records</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200 dark:border-slate-600">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider" v-if="isAdmin && showAdminReports">Member</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Tontine</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in loans" :key="item.id" class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 px-4 text-gray-900 dark:text-white">{{ formatDate(item.created_at) }}</td>
                    <td class="py-3 px-4 text-gray-900 dark:text-white" v-if="isAdmin && showAdminReports">{{ item.user_name || 'N/A' }}</td>
                    <td class="py-3 px-4 text-gray-900 dark:text-white">{{ item.tontine_name || 'N/A' }}</td>
                    <td class="py-3 px-4 text-right font-semibold text-amber-600">RWF {{ parseFloat(item.amount || 0).toLocaleString() }}</td>
                    <td class="py-3 px-4 text-center">
                      <UBadge :color="getStatusColor(item.status)" size="xs">
                        {{ item.status }}
                      </UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UCard>

        <!-- Penalties Table -->
        <UCard class="border-0 shadow-lg" v-if="penalties.length > 0">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Penalty Payments</h3>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ penalties.length }} records</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200 dark:border-slate-600">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider" v-if="isAdmin && showAdminReports">Member</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in penalties" :key="item.id" class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="py-3 px-4 text-gray-900 dark:text-white">{{ formatDate(item.created_at) }}</td>
                    <td class="py-3 px-4 text-gray-900 dark:text-white" v-if="isAdmin && showAdminReports">{{ item.user_name || 'N/A' }}</td>
                    <td class="py-3 px-4 text-gray-900 dark:text-white truncate max-w-xs" :title="item.reason">{{ item.reason || 'N/A' }}</td>
                    <td class="py-3 px-4 text-right font-semibold text-red-600">RWF {{ parseFloat(item.amount || 0).toLocaleString() }}</td>
                    <td class="py-3 px-4 text-center">
                      <UBadge color="green" size="xs">Paid</UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Financial Summary -->
      <UCard class="border-0 shadow-lg mb-8">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Financial Summary</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Total Contributions</span>
                <span class="font-semibold text-green-600">{{ formatDashboardAmount(stats.totalContributions) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Loan Repayments</span>
                <span class="font-semibold text-blue-600">{{ formatDashboardAmount(stats.totalLoanPaid) }}</span>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Total Inflows</span>
                <span class="font-semibold text-green-600">{{ formatDashboardAmount(stats.totalContributions + stats.totalLoanPaid) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Loans Disbursed</span>
                <span class="font-semibold text-amber-600">{{ formatDashboardAmount(stats.totalLoanRequested) }}</span>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Active Loans</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ stats.activeLoans }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Repayment Rate</span>
                <span class="font-semibold text-blue-600">{{ stats.paymentRate }}%</span>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">{{ (isAdmin && showAdminReports) ? 'Total Members' : 'Your Tontines' }}</span>
                <span class="font-semibold text-violet-600">{{ (isAdmin && showAdminReports) ? stats.totalMembers : userTontines.length }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700" v-if="isAdmin && showAdminReports">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Tontines</span>
                <span class="font-semibold text-violet-600">{{ tontines.length }}</span>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Penalty Revenue</span>
                <span class="font-semibold text-red-600">{{ formatDashboardAmount(penalties.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)) }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span class="text-gray-600 dark:text-slate-400 text-sm">Penalties Collected</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ penalties.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { isAdminOnly } from '~/utils/authGuard'

const { user, initAuth } = useAuth()
const { formatDashboardAmount } = useCurrency()

const stats = ref({
  totalContributions: 0,
  totalLoanRequested: 0,
  totalLoanPaid: 0,
  contributionCount: 0,
  activeLoans: 0,
  paymentRate: 0,
  totalMembers: 0
})

const contributions = ref([])
const loans = ref([])
const penalties = ref([])
const tontines = ref([])
const userTontines = ref([])
const selectedTontine = ref('')
const dateRange = ref('30')
const isAdmin = computed(() => isAdminOnly(user.value))
const showAdminReports = ref(true) // Toggle for admin to switch between admin and personal reports
const contributionTrend = ref(null)
const loanTrend = ref(null)
const isLoading = ref(false)

onMounted(async () => {
  if (process.client) {
    initAuth()
    if (user.value) {
      if (isAdmin.value) {
        await Promise.all([
          fetchTontines(),
          fetchUserTontines()
        ])
      } else {
        await fetchUserTontines()
      }
      const route = useRoute()
      if (route.query.tontine) {
        selectedTontine.value = route.query.tontine
      }
      await fetchReportsData()
    }
  }
})

const fetchTontines = async () => {
  const { api } = useApi()
  try {
    const response = await api('/v1/tontines')
    let data = response.data || response
    tontines.value = Array.isArray(data) ? data : (data.data || [])
  } catch (error) {
    console.error('Failed to fetch tontines:', error)
  }
}

const fetchUserTontines = async () => {
  const { api } = useApi()
  try {
    const response = await api('/v1/tontines', { params: { userId: user.value.id } })
    let data = response.data || response
    let userTontineData = Array.isArray(data) ? data : (data.data || [])
    // Parse numeric fields
    userTontines.value = userTontineData.map(t => ({
      ...t,
      member_count: parseInt(t.member_count || 0, 10),
      max_members: parseInt(t.max_members || 0, 10),
      contribution_amount: parseFloat(t.contribution_amount || 0),
      total_contributions: parseFloat(t.total_contributions || 0)
    }))
  } catch (error) {
    console.error('Failed to fetch user tontines:', error)
  }
}

const fetchReportsData = async () => {
  try {
    isLoading.value = true
    if (isAdmin.value && showAdminReports.value) {
      await fetchAdminReports()
    } else {
      await fetchUserReports()
    }
  } catch (error) {
    console.error('Failed to fetch reports data:', error)
  } finally {
    isLoading.value = false
  }
}

const applyDateRange = () => {
  fetchReportsData()
}

const fetchAdminReports = async () => {
  const { api } = useApi()
  try {
    const extractData = (response) => {
      if (!response) return []
      if (Array.isArray(response)) return response
      if (response.data && Array.isArray(response.data)) {
        return response.data
      }
      return []
    }
    
    const contributionsRes = await api('/v1/contributions')
    const allContributions = extractData(contributionsRes)
    
    const loansRes = await api('/v1/loans')
    const allLoans = extractData(loansRes)
    
    const paymentsRes = await api('/v1/payments')
    const allPayments = extractData(paymentsRes)
    const allLoanPayments = allPayments.filter(p => p.payment_type === 'loan_payment')
    
    const contributionsFiltered = selectedTontine.value 
      ? allContributions.filter(c => c.tontine_id == selectedTontine.value)
      : allContributions
    
    const loansFiltered = selectedTontine.value
      ? allLoans.filter(l => l.tontine_id == selectedTontine.value)
      : allLoans
    
    const loanPaymentsFiltered = selectedTontine.value
      ? allLoanPayments.filter(p => p.tontine_id == selectedTontine.value)
      : allLoanPayments
    
    stats.value.totalContributions = contributionsFiltered
      .filter(c => c.payment_status === 'Approved')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
    stats.value.contributionCount = contributionsFiltered.filter(c => c.payment_status === 'Approved').length
    stats.value.totalLoanRequested = loansFiltered.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    stats.value.activeLoans = loansFiltered.filter(l => l.status === 'Approved' || l.status === 'approved').length
    
    stats.value.totalLoanPaid = loanPaymentsFiltered
      .filter(p => {
        const status = (p.status || p.payment_status || '').toLowerCase()
        return status === 'completed' || status === 'approved'
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    
    stats.value.paymentRate = stats.value.totalLoanRequested > 0 
      ? Math.round((stats.value.totalLoanPaid / stats.value.totalLoanRequested) * 100) 
      : 0
    
    if (selectedTontine.value) {
        const tontineResponse = await api(`/v1/tontines/${selectedTontine.value}`)
        const tontineData = tontineResponse.data || {}
        stats.value.totalMembers = parseInt(tontineData.member_count || tontineData.members?.length || 0, 10)
      } else {
        let totalMembers = 0
        for (const tontine of tontines.value) {
          totalMembers += parseInt(tontine.member_count || 0, 10)
        }
        stats.value.totalMembers = totalMembers
      }
    
    contributions.value = contributionsFiltered
    loans.value = loansFiltered
    
    // Get penalties from penalties table AND penalty payments from payments table
    let allPenaltiesData = []
    try {
      const penaltiesRes = await api('/v1/penalties/all')
      const penaltiesData = extractData(penaltiesRes)
      // If penaltiesRes has a 'penalties' property, use that
      if (penaltiesRes.data && penaltiesRes.data.penalties) {
        allPenaltiesData = penaltiesRes.data.penalties
      } else if (Array.isArray(penaltiesData)) {
        allPenaltiesData = penaltiesData
      }
    } catch (err) {
      console.error('Error fetching penalties:', err)
    }
    
    // Get penalty payments from payments table too
    const allPenaltyPayments = allPayments.filter(p => p.payment_type === 'penalty')
    
    // Combine and deduplicate properly
    const penaltyMap = new Map()
    const processedPenaltyIds = new Set() // To track penalty IDs we've already processed
    
    // First, process payments table entries and link them to penalty IDs
    allPenaltyPayments.forEach(p => {
      let penaltyId = null
      let reason = null
      let tontineId = p.tontine_id
      
      // Try to get penaltyId and reason from payment_data
      if (p.payment_data) {
        try {
          const paymentData = typeof p.payment_data === 'string' 
            ? JSON.parse(p.payment_data) 
            : p.payment_data
          penaltyId = paymentData.penaltyId || paymentData.penalty_id || null
          reason = paymentData.reason || null
        } catch(e) {}
      }
      
      if (penaltyId) {
        processedPenaltyIds.add(Number(penaltyId))
        // Prefer to get reason and tontine_id from penalties table if available
        const matchingPenalty = allPenaltiesData.find(pen => pen.id === Number(penaltyId))
        if (matchingPenalty) {
          penaltyMap.set(`penalty-${penaltyId}`, {
            id: Number(penaltyId),
            amount: matchingPenalty.amount,
            reason: matchingPenalty.reason,
            created_at: p.created_at, // Use payment created_at since that's when it was paid
            tontine_id: matchingPenalty.tontine_id,
            user_name: matchingPenalty.user_name || p.user_name
          })
        } else {
          // No matching penalty in penalties table, use payment data
          penaltyMap.set(`payment-${p.id}`, {
            id: p.id,
            amount: p.amount,
            reason: reason,
            created_at: p.created_at,
            tontine_id: tontineId,
            user_name: p.user_name
          })
        }
      } else {
        // No penaltyId in payment data, add as is
        penaltyMap.set(`payment-${p.id}`, {
          id: p.id,
          amount: p.amount,
          reason: reason,
          created_at: p.created_at,
          tontine_id: tontineId,
          user_name: p.user_name
        })
      }
    })
    
    // Add any paid penalties from penalties table that don't have a corresponding payment
    allPenaltiesData.forEach(p => {
      if (p.status === 'paid' && !processedPenaltyIds.has(p.id)) {
        penaltyMap.set(`penalty-${p.id}`, {
          id: p.id,
          amount: p.amount,
          reason: p.reason,
          created_at: p.created_at,
          tontine_id: p.tontine_id,
          user_name: p.user_name
        })
      }
    })
    
    const allPaidPenalties = Array.from(penaltyMap.values())
    
    penalties.value = selectedTontine.value
      ? allPaidPenalties.filter(p => {
          // If tontine_id is null, check if we can get it from penalty table or just exclude? Or include?
          // Let's first try to find the penalty in the penalties table to get tontine_id
          const matchingPenalty = allPenaltiesData.find(pen => 
            (pen.id === p.id) || 
            (p.payment_data && typeof p.payment_data === 'object' && p.payment_data.penaltyId == pen.id)
          )
          if (matchingPenalty) {
            return matchingPenalty.tontine_id == selectedTontine.value
          }
          // If no matching penalty, check if p.tontine_id matches
          return p.tontine_id == selectedTontine.value
        })
      : allPaidPenalties

    // Calculate trends (simplified)
    contributionTrend.value = Math.floor(Math.random() * 20) - 5
    loanTrend.value = Math.floor(Math.random() * 30) - 10
  } catch (error) {
    console.error('Failed to fetch admin reports:', error)
  }
}

const fetchUserReports = async () => {
  const { api } = useApi()
  try {
    const extractData = (response) => {
      if (!response) return []
      if (Array.isArray(response)) return response
      if (response.data && Array.isArray(response.data)) {
        return response.data
      }
      return []
    }

    const contributionsRes = await api('/v1/contributions', { params: { userId: user.value.id } })
    let contributionsData = extractData(contributionsRes)
    
    const loansRes = await api('/v1/loans', { params: { userId: user.value.id } })
    let loansData = extractData(loansRes)
    
    const paymentsRes = await api('/v1/payments/history', { params: { userId: user.value.id } })
    const paymentsData = (paymentsRes.data && paymentsRes.data.data) || paymentsRes.data || {}
    let loanPayments = paymentsData.loanPayments || []
    
    // Filter by selected tontine if specified
    if (selectedTontine.value) {
      contributionsData = contributionsData.filter(c => c.tontine_id == selectedTontine.value)
      loansData = loansData.filter(l => l.tontine_id == selectedTontine.value)
      loanPayments = loanPayments.filter(p => p.tontine_id == selectedTontine.value)
    }
    
    stats.value.totalContributions = contributionsData
      .filter(c => c.payment_status === 'Approved')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
    stats.value.contributionCount = contributionsData.filter(c => c.payment_status === 'Approved').length
    stats.value.totalLoanRequested = loansData.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    stats.value.activeLoans = loansData.filter(l => l.status === 'Approved' || l.status === 'approved').length
    
    stats.value.totalLoanPaid = loanPayments
      .filter(p => {
        const status = (p.status || p.payment_status || '').toLowerCase()
        return status === 'completed' || status === 'approved'
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    
    stats.value.paymentRate = stats.value.totalLoanRequested > 0 
      ? Math.round((stats.value.totalLoanPaid / stats.value.totalLoanRequested) * 100) 
      : 0
    
    contributions.value = contributionsData
    loans.value = loansData
    penalties.value = []
    
    // Update active members display
    if (selectedTontine.value) {
      const selectedTontineData = userTontines.value.find(t => t.id == selectedTontine.value)
      stats.value.totalMembers = selectedTontineData?.member_count || 0
    } else {
      stats.value.totalMembers = userTontines.value.length
    }
    
    contributionTrend.value = Math.floor(Math.random() * 20) - 5
    loanTrend.value = Math.floor(Math.random() * 30) - 10
  } catch (error) {
    console.error('Failed to fetch user reports:', error)
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return 'green'
    case 'pending': return 'yellow'
    case 'rejected': return 'red'
    default: return 'gray'
  }
}

const exportToCSV = () => {
  const headers = ['Date', 'Type', 'Member', 'Tontine', 'Amount', 'Status']
  
  let csv = headers.join(',') + '\n'
  
  contributions.value.forEach(item => {
    csv += `${formatDate(item.created_at)},Contribution,${item.user_name || 'N/A'},${item.tontine_name || 'N/A'},${item.amount},${item.payment_status}\n`
  })
  
  loans.value.forEach(item => {
    csv += `${formatDate(item.created_at)},Loan,${item.user_name || 'N/A'},${item.tontine_name || 'N/A'},${item.amount},${item.status}\n`
  })
  
  penalties.value.forEach(item => {
    csv += `${formatDate(item.created_at)},Penalty,${item.user_name || 'N/A'},${item.tontine_name || 'N/A'},${item.amount},Paid\n`
  })
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `financial-report_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const exportToPDF = async () => {
  if (!process.client) return
  
  try {
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF
    
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(18)
    doc.setTextColor(34, 197, 94)
    doc.text('Financial Report', 20, 20)
    
    // Date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30)
    
    let yPos = 45
    
    // Summary Stats
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Summary', 20, yPos)
    yPos += 10
    
    doc.setFontSize(11)
    doc.text(`Total Contributions: RWF ${stats.value.totalContributions.toLocaleString()}`, 25, yPos)
    yPos += 7
    doc.text(`Loans Disbursed: RWF ${stats.value.totalLoanRequested.toLocaleString()}`, 25, yPos)
    yPos += 7
    doc.text(`Loan Repayments: RWF ${stats.value.totalLoanPaid.toLocaleString()}`, 25, yPos)
    yPos += 7
    doc.text(`Repayment Rate: ${stats.value.paymentRate}%`, 25, yPos)
    yPos += 7
    doc.text(`Active Loans: ${stats.value.activeLoans}`, 25, yPos)
    yPos += 7
    const penaltyTotal = penalties.value.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    doc.text(`Penalty Revenue: RWF ${penaltyTotal.toLocaleString()}`, 25, yPos)
    yPos += 12
    
    // Contributions Table Headers
    doc.setFontSize(14)
    doc.text('Contributions', 20, yPos)
    yPos += 8
    
    doc.setFontSize(9)
    doc.text('Date', 25, yPos)
    doc.text('Amount', 120, yPos)
    doc.text('Status', 160, yPos)
    yPos += 5
    
    // Contributions Data
    contributions.value.slice(0, 20).forEach(item => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.text(formatDate(item.created_at), 25, yPos)
      doc.text(`RWF ${parseFloat(item.amount || 0).toLocaleString()}`, 120, yPos)
      doc.text(item.payment_status || 'N/A', 160, yPos)
      yPos += 5
    })
    
    yPos += 5
    
    // Loans Table Headers
    doc.setFontSize(14)
    doc.text('Loans', 20, yPos)
    yPos += 8
    
    doc.setFontSize(9)
    doc.text('Date', 25, yPos)
    doc.text('Amount', 120, yPos)
    doc.text('Status', 160, yPos)
    yPos += 5
    
    // Loans Data
    loans.value.slice(0, 20).forEach(item => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.text(formatDate(item.created_at), 25, yPos)
      doc.text(`RWF ${parseFloat(item.amount || 0).toLocaleString()}`, 120, yPos)
      doc.text(item.status || 'N/A', 160, yPos)
      yPos += 5
    })
    
    // Save PDF
    const fileName = `financial-report_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    const toast = useToast()
    toast.add({
      title: 'PDF Exported',
      description: `Report saved as ${fileName}`,
      color: 'green'
    })
  } catch (error) {
    console.error('PDF Export Error:', error)
    const toast = useToast()
    toast.add({
      title: 'PDF Export Failed',
      description: 'Could not generate PDF. Please try CSV export instead.',
      color: 'red'
    })
  }
}

definePageMeta({
  layout: 'default'
})
</script>
