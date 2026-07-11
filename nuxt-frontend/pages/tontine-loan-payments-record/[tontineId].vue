<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-orange-100 dark:border-gray-800 shadow-sm">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">Admin Action</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">• Manual Override</span>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Record Loan Payments</h1>
        <p v-if="tontine" class="mt-1.5 text-lg text-gray-600 dark:text-gray-400">
          {{ tontine.name }} — Record manual loan payments for members
        </p>
        <div v-else class="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
      </div>
      <div class="flex items-center gap-3">
        <UButton @click="$router.back()" variant="outline" icon="i-heroicons-arrow-left">
          Back
        </UButton>
      </div>
    </div>

    <!-- Allocated Surplus Banner -->
    <div v-if="allocatedSurplus.length > 0" class="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-2xl">
      <div class="flex items-center gap-2 mb-3">
        <UIcon name="i-heroicons-gift" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <span class="font-semibold text-purple-800 dark:text-purple-200 text-sm">Allocated Surplus — Members have pre-approved surplus for loan payments</span>
      </div>
      <div class="space-y-2">
        <div v-for="s in allocatedSurplus" :key="s.id" class="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-purple-100 dark:border-purple-800 text-sm">
          <span class="font-medium text-gray-900 dark:text-white">{{ s.user_name }}</span>
          <span class="text-purple-700 dark:text-purple-300 font-semibold">RWF {{ parseFloat(s.amount).toLocaleString() }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ s.destination_id ? 'Loan #' + s.destination_id : 'Any loan' }} · {{ s.member_note || 'No note' }}</span>
        </div>
      </div>
    </div>

    <!-- Date Picker Card -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Select Payment Date</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">Showing existing loan payments or defaults for the selected date.</p>
      </div>
      <div class="w-full sm:w-64">
        <input 
          v-model="paymentDate" 
          type="date" 
          @change="fetchLoanPaymentsForDate"
          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium"
        />
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="loading" class="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading members and loans...</p>
    </div>

    <div v-else-if="records.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="text-gray-300 dark:text-gray-600 mb-3">
        <UIcon name="i-heroicons-users" class="w-16 h-16 mx-auto" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white">No Active Loans</h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">There are no active loans in this tontine to record payments for.</p>
    </div>

    <div v-else>
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member & Loan Details</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date Taken</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Repayment Due</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Amount</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes / Comments</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="record in records" :key="record.loan_id" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                <!-- Member & Loan Details -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <UAvatar :alt="record.names" size="sm" class="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" />
                    <div>
                      <div class="font-semibold text-gray-900 dark:text-white">{{ record.names }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{{ record.email }}</div>
                      <div class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Loan #{{ record.loan_id.toString().padStart(3, '0') }} - Total: RWF {{ parseFloat(record.total_amount).toLocaleString() }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        Remaining: RWF {{ calculateRemainingBalance(record).toLocaleString() }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Date Taken -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ formatDate(record.date_taken) }}</div>
                </td>

                <!-- Repayment Due Date -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ formatRepaymentDate(record.date_taken, record.repayment_period) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ record.repayment_period }} month(s)</div>
                </td>
                
                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <select 
                      v-model="record.status"
                      @change="handleStatusChange(record)"
                      :class="getStatusSelectClass(record.status)"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </td>

                <!-- Amount -->
                <td class="px-6 py-4">
                  <div class="relative flex items-center min-w-[180px]">
                    <input
                      type="text"
                      inputmode="decimal"
                      :value="record.amount"
                      placeholder="0"
                      class="w-full px-4 py-3 pr-14 border-2 border-orange-300 dark:border-orange-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white text-base font-semibold text-gray-900"
                      @input="record.amount = $event.target.value"
                      @keypress="(e) => { const c = e.which || e.keyCode; if (c !== 46 && c > 31 && (c < 48 || c > 57)) e.preventDefault(); if (c === 46 && e.target.value.includes('.')) e.preventDefault() }"
                    />
                    <span class="absolute right-3 text-gray-400 text-sm font-medium pointer-events-none">RWF</span>
                  </div>
                  <div v-if="getSurplusForMember(record.userId)" class="mt-1.5 space-y-0.5">
                    <div class="text-xs text-purple-600 dark:text-purple-400">
                      🎁 Surplus available: RWF {{ getSurplusForMember(record.userId).toLocaleString() }}
                    </div>
                    <div v-if="parseFloat(record.amount) > 0" class="text-xs text-gray-500 dark:text-gray-400">
                      Cash: RWF {{ Math.max(0, parseFloat(record.amount) - getSurplusForMember(record.userId)).toLocaleString() }}
                      + Surplus: RWF {{ Math.min(getSurplusForMember(record.userId), parseFloat(record.amount)).toLocaleString() }}
                      = RWF {{ parseFloat(record.amount).toLocaleString() }} total
                    </div>
                  </div>
                </td>

                <!-- Notes -->
                <td class="px-6 py-4">
                  <input 
                    v-model="record.notes" 
                    type="text" 
                    class="w-full min-w-[200px] px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                    placeholder="Enter manual payment details..."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 gap-4">
        <span class="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
          * Record manual loan payments for members.
        </span>
        <div class="flex items-center gap-3">
          <UButton @click="$router.back()" variant="outline" size="lg">
            Cancel
          </UButton>
          <UButton @click="saveLoanPayments" color="orange" size="lg" icon="i-heroicons-check" :loading="saving">
            Save Loan Payments
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: 'accountant',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { initAuth } = useAuth()
const tontineId = route.params.tontineId

const tontine = ref(null)
const members = ref([])
const loans = ref([])
const records = ref([])
const allocatedSurplus = ref([])

const getSurplusForMember = (userId) => {
  const rows = allocatedSurplus.value.filter(s => s.user_id === userId)
  return rows.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)
}
const paymentDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(true)
const saving = ref(false)

const getStatusSelectClass = (status) => {
  const base = "w-32 px-3 py-2 border rounded-xl shadow-sm focus:outline-none text-xs font-semibold cursor-pointer "
  if (status === 'completed') return base + "border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
  if (status === 'pending') return base + "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
  if (status === 'failed') return base + "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
  return base + "border-gray-300 bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
}

const handleStatusChange = (record) => {
  if (!record.amount || record.amount === 0) {
    // Default to 0 if not set
    record.amount = 0
  }
}

const calculateRemainingBalance = (record) => {
  const totalAmount = parseFloat(record.total_amount)
  const totalPaid = parseFloat(record.total_paid || 0)
  return Math.max(0, Math.round(totalAmount - totalPaid))
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatRepaymentDate = (dateTaken, months) => {
  if (!dateTaken || !months) return 'N/A'
  const d = new Date(dateTaken)
  d.setMonth(d.getMonth() + parseInt(months))
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const fetchData = async () => {
  loading.value = true
  const { api } = useApi()
  try {
    // 1. Fetch tontine details
    const tontineResponse = await api(`/v1/tontines/${tontineId}`)
    tontine.value = tontineResponse.data || tontineResponse
    console.log('Tontine data:', tontine.value)
    
    if (!tontine.value) {
      toast.add({ title: 'Error', description: 'Tontine not found', color: 'red' })
      router.push('/tontines')
      return
    }

    // 2. Fetch active loans for this tontine
    const loansResponse = await api(`/v1/loans?tontineId=${tontineId}&limit=100`)
    console.log('Loans API response:', loansResponse)
    
    // Extract loans array from paginated response
    let allLoans = []
    if (loansResponse.data && Array.isArray(loansResponse.data)) {
      allLoans = loansResponse.data
    } else if (loansResponse.data && loansResponse.data.loans && Array.isArray(loansResponse.data.loans)) {
      allLoans = loansResponse.data.loans
    } else if (Array.isArray(loansResponse)) {
      allLoans = loansResponse
    }
    console.log('All loans for tontine:', allLoans)
    
    loans.value = allLoans.filter(loan => {
      const status = (loan.status || '').toLowerCase()
      return ['approved', 'received', 'disbursed'].includes(status)
    })

    // Fetch allocated surplus for loans
    try {
      const surplusRes = await api(`/v1/surplus/tontine/${tontineId}?status=allocated`)
      const all = surplusRes.data || surplusRes || []
      allocatedSurplus.value = (Array.isArray(all) ? all : []).filter(s => s.destination === 'loan')
    } catch { allocatedSurplus.value = [] }

    // 3. Fetch existing loan payments for the selected date
    await fetchLoanPaymentsForDate()
  } catch (error) {
    console.error('Error fetching tontine/loans:', error)
    toast.add({ title: 'Error', description: 'Failed to load details', color: 'red' })
  } finally {
    loading.value = false
  }
}

const fetchLoanPaymentsForDate = async () => {
  const { api } = useApi()
  try {
    const paymentsResponse = await api(`/v1/payments?type=loan_payment&limit=100`)
    console.log('Payments API response:', paymentsResponse)
    
    // Extract payments array from paginated response
    let existingPayments = []
    if (paymentsResponse.data && Array.isArray(paymentsResponse.data)) {
      existingPayments = paymentsResponse.data
    } else if (paymentsResponse.data && paymentsResponse.data.payments && Array.isArray(paymentsResponse.data.payments)) {
      existingPayments = paymentsResponse.data.payments
    } else if (Array.isArray(paymentsResponse)) {
      existingPayments = paymentsResponse
    }
    console.log('All existing payments:', existingPayments)

    // Map loans to payment records, excluding fully paid loans
    records.value = loans.value.map(loan => {
      const existing = existingPayments.find(p => 
        p.loan_id === loan.id && new Date(p.created_at).toISOString().split('T')[0] === paymentDate.value
      )
      
      // Calculate total paid from all payments for this loan
      const totalPaid = existingPayments
        .filter(p => {
          const paymentStatus = (p.status || '').toLowerCase()
          return p.loan_id === loan.id && (paymentStatus === 'completed' || paymentStatus === 'approved')
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

      return {
        userId: loan.user_id,
        loanId: loan.id,
        loan_id: loan.id,
        names: loan.user_name,
        email: '',
        total_amount: loan.total_amount,
        total_paid: totalPaid,
        date_taken: loan.created_at,
        repayment_period: loan.repayment_period,
        status: existing ? existing.status : 'pending',
        amount: existing ? String(parseFloat(existing.amount)) : '',
        notes: existing?.payment_data?.notes || ''
      }
    }).filter(r => (parseFloat(r.total_amount) - r.total_paid) > 0)
  } catch (error) {
    console.error('Error fetching loan payments for date:', error)
    toast.add({ title: 'Warning', description: 'Could not fetch existing loan payment logs for this date', color: 'yellow' })
  }
}

const saveLoanPayments = async () => {
  saving.value = true
  const { api } = useApi()
  try {
    const payload = {
      paymentDate: paymentDate.value,
      payments: records.value.filter(r => parseFloat(r.amount) > 0).map(r => ({
        userId: r.userId,
        loanId: r.loanId,
        amount: parseFloat(r.amount),
        status: r.status,
        notes: r.notes || ''
      }))
    }

    await api(`/v1/payments/tontine/${tontineId}/loan-bulk`, {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Success',
      description: 'Loan payments updated successfully',
      color: 'green'
    })
    
    router.back()
  } catch (error) {
    console.error('Error saving loan payments:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to save loan payments',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (process.client) {
    initAuth()
  }
  fetchData()
})
</script>
