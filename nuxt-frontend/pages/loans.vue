<template>
  <div class="min-h-screen bg-white">
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-blue-600">Loan Management</h1>
          <p class="text-gray-600">Select a tontine to manage loans</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">
          Back to Dashboard
        </UButton>
      </div>

      <!-- Tontine Selection -->
      <UCard class="mb-8 shadow-lg" v-if="!selectedTontine">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Select Tontine</h2>
          <div v-if="loadingTontines" class="text-center py-8">
            <div class="text-gray-500">Loading tontines...</div>
          </div>
          <div v-else-if="userTontines.length === 0" class="text-center py-8">
            <div class="text-gray-500">No active tontines found</div>
          </div>
          <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="tontine in userTontines" :key="tontine.id"
                 @click="selectTontine(tontine)"
                 class="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
              <h3 class="font-semibold text-lg">{{ tontine.name }}</h3>
              <p class="text-sm text-gray-600 mb-2">{{ tontine.description }}</p>
              <div class="text-blue-600 font-semibold">
                Max Loan: {{ Math.floor(getTontineContributions(tontine.id) * 2 / 3).toLocaleString() }} RWF
              </div>
              <div class="text-xs text-gray-500">{{ tontine.user_shares || 1 }} shares</div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Loan Eligibility -->
      <UCard class="mb-8 border-0 shadow-lg" v-if="selectedTontine">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-blue-600">{{ selectedTontine.name }} - Loan Eligibility</h2>
            <UButton @click="selectedTontine = null" variant="outline" size="xs">
              Change Tontine
            </UButton>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="text-2xl font-bold text-gray-700 dark:text-slate-300">{{ formatDashboardAmount(userContributions) }}</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">Your Total Contributions</div>
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="text-2xl font-bold text-green-600">{{ formatDashboardAmount(maxLoanAmount) }}</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">Maximum Loan (2/3 of contributions)</div>
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="text-2xl font-bold text-yellow-600">1.7%</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">Monthly Interest Rate</div>
            </div>
          </div>
          
          <div class="mt-6">
            <UButton @click="showLoanModal = true" color="blue" size="lg" icon="i-heroicons-document-text" :disabled="isNewLoanButtonDisabled">
              {{ newLoanButtonLabel }}
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Loan Terms (Article 28) -->
      <UCard class="mb-8 border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Loan Terms (Article 28)</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="font-semibold text-gray-900 dark:text-white">Maximum Amount</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">2/3 of your base share contributions</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="font-semibold text-green-700 dark:text-green-400">Interest Rate</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">1.7% per month</div>
              </div>
            </div>
            <div class="space-y-4">
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="font-semibold text-yellow-700 dark:text-yellow-400">Repayment Period</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Maximum 6 months</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="font-semibold text-red-700 dark:text-red-400">Late Payment Penalty</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">3.4% per month after 3 months</div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Active Loan -->
      <UCard v-if="activeLoan" class="mb-8 border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-orange-600 mb-4">Active Loan</h2>
          
          <!-- Loan Summary Cards -->
          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
              <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">Loan Amount</div>
              <div class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{{ formatDashboardAmount(activeLoan.amount) }}</div>
            </div>
            <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
              <div class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Total to Pay (Principal + Interest)</div>
              <div class="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{{ formatDashboardAmount(activeLoan.total_amount || activeLoan.amount) }}</div>
            </div>
            <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-xl border border-red-200 dark:border-red-700">
              <div class="text-sm text-red-600 dark:text-red-400 font-medium">Remaining Balance</div>
              <div class="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{{ formatDashboardAmount(calculateRemainingBalance(activeLoan)) }}</div>
            </div>
          </div>
          
          <!-- Additional Details -->
          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <div class="text-sm text-gray-500 dark:text-gray-400">Date Taken</div>
              <div class="text-lg font-semibold">{{ formatDate(activeLoan.created_at) }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <div class="text-sm text-gray-500 dark:text-gray-400">Repayment Due</div>
              <div class="text-lg font-semibold">{{ formatRepaymentDate(activeLoan.created_at, activeLoan.repayment_period) }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <div class="text-sm text-gray-500 dark:text-gray-400">Status</div>
              <div class="text-lg font-semibold" :class="getLoanStatusClass(activeLoan.status)">{{ activeLoan.status }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <div class="text-sm text-gray-500 dark:text-gray-400">Repayment Period</div>
              <div class="text-lg font-semibold">{{ activeLoan.repayment_period }} months</div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <div class="text-sm text-gray-500 dark:text-gray-400">Amount Paid</div>
              <div class="text-lg font-semibold text-green-600 dark:text-green-400">RWF {{ (activeLoan.total_paid || 0).toLocaleString() }}</div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <!-- Confirm Received button for Approved/Waiting loans -->
            <UButton 
              v-if="canConfirmReceipt" 
              @click="confirmLoanReceipt" 
              color="green" 
              size="lg"
              :loading="confirmLoading"
              icon="i-heroicons-check-circle"
            >
              Confirm Received
            </UButton>
            <!-- Show message that loan payments are recorded by admin only -->
            <div class="text-sm text-gray-500 italic">
              Loan payments are recorded by the administrator.
            </div>
          </div>
        </div>
      </UCard>

      <!-- Loan Request History -->
      <UCard class="border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Loan Request History</h2>
          <div v-if="loading" class="text-center py-8">
            <div class="text-gray-500">Loading loan history...</div>
          </div>
          <div v-else-if="loans.length === 0" class="text-center py-8">
            <div class="text-gray-500">No loan requests found</div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="loan in loans" :key="loan.id" 
                 class="flex justify-between items-center p-4 rounded-lg" :class="{
                   'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600': ['Approved', 'Pending', 'Rejected'].includes(loan.status),
                   'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700': !['Approved', 'Pending', 'Rejected'].includes(loan.status)
                 }">
              <div>
                <div class="font-semibold">Loan #{{ loan.id.toString().padStart(3, '0') }} - {{ formatDate(loan.created_at) }}</div>
                <div class="text-sm text-gray-600">RWF {{ parseFloat(loan.amount).toLocaleString() }} - {{ loan.repayment_period }} months</div>
                <div class="text-xs text-gray-500">Taken: {{ formatDate(loan.created_at) }} · Due: {{ formatRepaymentDate(loan.created_at, loan.repayment_period) }}</div>
              </div>
              <div class="text-right">
                <div class="font-semibold" :class="getLoanStatusClass(loan.status)">{{ getLoanStatusLabel(loan.status) }}</div>
                <div class="text-xs text-gray-500">{{ getLoanStatusIcon(loan.status) }}</div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Loan Request Modal -->
    <UModal v-model="showLoanModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-blue-600">Request New Loan</h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="Loan Amount (RWF)">
            <CurrencyInput v-model="loanAmount" placeholder="Enter amount" />
            <template #help>
              <p class="text-xs text-gray-500">Recommended max: RWF {{ maxLoanAmount.toLocaleString() }} (2/3 of contributions) for lower interest rate</p>
            </template>
          </UFormGroup>
          
          <!-- Warning when loan exceeds 2/3 of contributions -->
          <div v-if="exceedsTwoThirds" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-yellow-700 dark:text-yellow-300">
                <span class="font-semibold">Higher Interest Rate:</span> Loans exceeding 2/3 of your contributions (RWF {{ maxLoanAmount.toLocaleString() }}) will be charged a 15% flat interest rate instead of 1.7% per month.
              </div>
            </div>
          </div>
          
          <UFormGroup label="Repayment Period (months)" :error="repaymentPeriod && (repaymentPeriod < 1) ? 'Repayment period must be at least 1 month' : undefined">
            <UInput v-model="repaymentPeriod" type="number" min="1" placeholder="Enter months">
              <template #trailing>
                <span class="text-gray-500">months</span>
              </template>
            </UInput>
            <template #help>
              <p class="text-xs text-gray-500">Enter the number of months for repayment</p>
            </template>
          </UFormGroup>
          
          <UFormGroup label="Purpose of Loan">
            <UTextarea v-model="loanPurpose" placeholder="Describe the purpose of this loan" />
          </UFormGroup>
          
          <!-- Guarantors Section -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Guarantors (Optional)</label>
              <UButton @click="addGuarantor" color="gray" variant="ghost" size="xs" icon="i-heroicons-plus">
                Add Guarantor
              </UButton>
            </div>
            
            <div v-if="guarantors.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              No guarantors added. Click "Add Guarantor" to add one.
            </div>
            
            <div v-for="(guarantor, index) in guarantors" :key="index" class="flex gap-2 items-start mb-2">
              <div class="flex-1">
                <UInput v-model="guarantor.name" placeholder="Name" size="sm" />
              </div>
              <div class="flex-1">
                <UInput v-model="guarantor.phone" placeholder="Phone" size="sm" />
              </div>
              <UButton @click="removeGuarantor(index)" color="red" variant="ghost" size="sm" icon="i-heroicons-trash" />
            </div>
          </div>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div class="text-sm font-semibold text-blue-700 dark:text-blue-300">Loan Summary</div>
            <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span v-if="exceedsTwoThirds" class="text-yellow-600 dark:text-yellow-400 font-medium">⚠️ Higher interest rate (15%) applies</span><br>
              Monthly Payment: RWF {{ calculateMonthlyPayment() }}<br>
              Total Interest: RWF {{ calculateTotalInterest() }}<br>
              Total Repayment: RWF {{ calculateTotalRepayment() }}
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showLoanModal = false" variant="outline">Cancel</UButton>
            <UButton @click="submitLoanRequest" color="blue" :loading="loanLoading" :disabled="isLoanRequestDisabled">
              Submit Request
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Loan Payment Modal -->
    <UModal v-model="showPaymentModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-orange-600">Make Loan Payment</h3>
        </template>
        
        <div class="space-y-4">
          <div class="p-4 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Amount Due: RWF {{ parseFloat(activeLoan?.total_amount || 0).toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Amount Already Paid: RWF 0</div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">Remaining Balance: RWF {{ parseFloat(activeLoan?.total_amount || 0).toLocaleString() }}</div>
          </div>
          
          <UFormGroup label="Payment Amount (RWF)">
            <UInput v-model="customPaymentAmount" type="number" :max="parseFloat(activeLoan?.total_amount || 0)" placeholder="Enter amount to pay" />
            <template #help>
              <p class="text-xs text-gray-500">Maximum: RWF {{ parseFloat(activeLoan?.total_amount || 0).toLocaleString() }}</p>
            </template>
          </UFormGroup>
          
          <UFormGroup label="Payment Method">
            <USelect v-model="paymentMethod" :options="paymentOptions" />
          </UFormGroup>
          
          <UFormGroup label="Phone Number" v-if="paymentMethod === 'mobile_money'">
            <UInput v-model="loanPaymentPhone" placeholder="0781234567" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showPaymentModal = false" variant="outline">Cancel</UButton>
            <UButton @click="processLoanPayment" color="orange" :loading="paymentLoading" :disabled="!customPaymentAmount || customPaymentAmount <= 0 || parseFloat(customPaymentAmount) > parseFloat(activeLoan?.total_amount || 0) || (paymentMethod === 'mobile_money' && !loanPaymentPhone)">
              Pay RWF {{ parseFloat(customPaymentAmount || 0).toLocaleString() }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Error Modal -->
    <UModal v-model="showErrorModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-red-600">Loan Request Failed</h3>
          </div>
        </template>

        <div class="py-4">
          <p class="text-gray-700">{{ errorMessage }}</p>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showErrorModal = false" variant="outline">
              Try Again
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Success Modal -->
    <UModal v-model="showSuccessModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold text-green-600">Loan Request Successful</h3>
          </div>
        </template>

        <div class="py-4">
          <p class="text-gray-700">{{ successMessage }}</p>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showSuccessModal = false" color="green">
              Continue
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const { user, initAuth } = useAuth()
const { formatDashboardAmount } = useCurrency()

const showLoanModal = ref(false)
const showPaymentModal = ref(false)
const loanLoading = ref(false)
const paymentLoading = ref(false)
const loading = ref(true)
const loadingTontines = ref(true)
const loans = ref([])
const selectedTontine = ref(null)
const userTontines = ref([])
const contributionsByTontine = ref({})
const activeLoan = ref(null)
const maxLoanAmount = ref(0)
const userContributions = ref(0)
const errorMessage = ref('')
const successMessage = ref('')
const showErrorModal = ref(false)
const showSuccessModal = ref(false)
const confirmLoading = ref(false)

const loanAmount = ref('')
const repaymentPeriod = ref(6)
const loanPurpose = ref('')
const paymentMethod = ref('mobile_money')
const customPaymentAmount = ref('')
const loanPaymentPhone = ref('')
const guarantors = ref([])

const requestedLoanAmount = computed(() => parseFloat(loanAmount.value || 0))
const hasActiveLoan = computed(() => !!activeLoan.value)
const isNewLoanButtonDisabled = computed(() => hasActiveLoan.value)
const newLoanButtonLabel = computed(() => {
  if (hasActiveLoan.value) return 'Active Loan Exists'
  return 'Request New Loan'
})
const isLoanRequestDisabled = computed(() => {
  return loanLoading.value || !Number.isFinite(requestedLoanAmount.value) || requestedLoanAmount.value <= 0 || !repaymentPeriod.value || repaymentPeriod.value < 1 || repaymentPeriod.value > 6
})

// Check if the current active loan can be confirmed as received
const canConfirmReceipt = computed(() => {
  if (!activeLoan.value) return false
  const status = (activeLoan.value.status || '').toLowerCase()
  return status === 'approved' || status === 'waiting'
})

// Check if loan payment can be made (only for Approved or Received status)
const canMakePayment = computed(() => {
  if (!activeLoan.value) return false
  const status = (activeLoan.value.status || '').toLowerCase()
  return status === 'approved' || status === 'received'
})

// Check if loan exceeds 2/3 of contributions (triggers 15% interest rate)
const exceedsTwoThirds = computed(() => {
  const amount = parseFloat(loanAmount.value || 0)
  const twoThirds = (userContributions.value * 2) / 3
  return amount > twoThirds && userContributions.value > 0
})

// Get applicable interest rate based on loan amount
const applicableInterestRate = computed(() => {
  return exceedsTwoThirds.value ? 15 : 1.7 * repaymentPeriod.value
})

// Add new guarantor entry
const addGuarantor = () => {
  guarantors.value.push({ name: '', phone: '' })
}

// Remove guarantor entry
const removeGuarantor = (index) => {
  guarantors.value.splice(index, 1)
}

const repaymentOptions = [
  { label: '3 Months', value: 3 },
  { label: '4 Months', value: 4 },
  { label: '5 Months', value: 5 },
  { label: '6 Months', value: 6 }
]

const paymentOptions = [
  { label: 'Mobile Money', value: 'mobile_money' },
  { label: 'Bank Transfer', value: 'bank' },
  { label: 'Cash', value: 'cash' }
]

// Get user data and fetch loans
onMounted(async () => {
  if (process.client) {
    initAuth()
    if (user.value) {
      loanPaymentPhone.value = user.value.phone
      await fetchUserTontines()

      const route = useRoute()
      if (route.query.tontine) {
        const tontine = userTontines.value.find(t => t.id == route.query.tontine)
        if (tontine) selectTontine(tontine)
        else loading.value = false
      } else {
        loading.value = false
      }

      // Real-time: listen for loan updates
      const { connect, on } = useSocket()
      connect()
      on('loan-status-updated', () => { if (selectedTontine.value) fetchLoans() })
      on('loans-updated', () => { if (selectedTontine.value) fetchLoans() })
    }
  }
})

const fetchUserTontines = async () => {
  const { api } = useApi()
  try {
    loadingTontines.value = true
    // TODO: Backend endpoint /api/v1/tontines/user/:userId does not exist
    const tontinesRes = await api('/v1/tontines', { params: { userId: user.value.id } })
    const tontinesData = tontinesRes.data || tontinesRes
    userTontines.value = Array.isArray(tontinesData) ? tontinesData : (tontinesData.data || [])

    // Fetch contributions for all tontines
    // TODO: Backend endpoint /api/v1/contributions/user/:userId does not exist
    const contributionsRes = await api('/v1/contributions', { params: { userId: user.value.id } })
    const contributionsData = contributionsRes.data || contributionsRes
    const contributionsList = Array.isArray(contributionsData) ? contributionsData : (contributionsData.data || [])

    // Group contributions by tontine (ensure tontine_id is treated as number for consistency)
    contributionsByTontine.value = contributionsList.reduce((acc, contrib) => {
      const tontineId = parseInt(contrib.tontine_id)
      if (!acc[tontineId]) {
        acc[tontineId] = []
      }
      acc[tontineId].push(contrib)
      return acc
    }, {})
  } catch (error) {
    console.error('Failed to fetch user tontines:', error)
    userTontines.value = []
    contributionsByTontine.value = {}
  } finally {
    loadingTontines.value = false
  }
}

const selectTontine = async (tontine) => {
  selectedTontine.value = tontine
  const tontineContributions = getTontineContributions(tontine.id)
  maxLoanAmount.value = Math.floor((tontineContributions * 2) / 3)
  userContributions.value = tontineContributions
  await fetchLoans()
}

const getTontineContributions = (tontineId) => {
  const tontineContribs = contributionsByTontine.value[tontineId] || []
  const filtered = tontineContribs.filter(c => c.payment_status === 'Approved')
  const total = filtered.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  return total
}

const fetchLoans = async () => {
  if (!selectedTontine.value) {
    loading.value = false
    return
  }

  const { api } = useApi()

  try {
    loading.value = true

    // Fetch user loan requests
    // TODO: Backend endpoint /api/v1/loans/requests/user/:userId does not exist
    // Using /api/v1/loans with query parameter as alternative
    const loansRes = await api('/v1/loans', { params: { userId: user.value.id } })
    const loansData = loansRes.data || loansRes
    const loansList = Array.isArray(loansData) ? loansData : (loansData.data || [])
    console.log('All user loans:', loansList)
    console.log('Selected tontine ID:', selectedTontine.value.id)
    loans.value = loansList.filter(l => l.tontine_id == selectedTontine.value.id)
    console.log('Filtered loans:', loans.value)

      // Find active loan - users with pending, approved, waiting, or received loans cannot apply for new loans
      activeLoan.value = loans.value.find(loan => {
        const status = (loan.status || '').toLowerCase()
        return ['pending', 'approved', 'waiting', 'received'].includes(status)
      })
      if (activeLoan.value) {
        // Fetch loan payments for balance calculation
        // TODO: Backend endpoint /api/v1/payments/history/:userId does not exist
        const paymentsRes = await api('/v1/payments', { params: { userId: user.value.id } })
        console.log('Payments API response for balance calculation:', paymentsRes)
        
        // Extract payments array from paginated response
        let paymentsList = []
        if (paymentsRes.data && Array.isArray(paymentsRes.data)) {
          paymentsList = paymentsRes.data
        } else if (paymentsRes.data && paymentsRes.data.payments && Array.isArray(paymentsRes.data.payments)) {
          paymentsList = paymentsRes.data.payments
        } else if (Array.isArray(paymentsRes)) {
          paymentsList = paymentsRes
        }
        console.log('Extracted payments list:', paymentsList)

        // Calculate total paid for this loan (handle both 'completed' and 'Approved' status)
        const totalPaid = paymentsList
          .filter(p => {
            if (p.loan_id !== activeLoan.value.id) return false
            const status = (p.status || p.payment_status || '').toLowerCase()
            return status === 'completed' || status === 'approved'
          })
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
        console.log('Total paid for active loan:', totalPaid)

        activeLoan.value.total_paid = totalPaid
      }
    hasActiveLoan.value = !!activeLoan.value

  } catch (error) {
    console.error('Failed to fetch loans:', error)
    loans.value = []
  } finally {
    loading.value = false
  }
}

const calculateMonthlyPayment = () => {
  if (!loanAmount.value || !repaymentPeriod.value) return '0'
  const principal = parseFloat(loanAmount.value)
  const months = repaymentPeriod.value
  
  // Apply 15% flat rate if loan exceeds 2/3 of contributions
  let totalInterest
  if (exceedsTwoThirds.value) {
    totalInterest = principal * 0.15
  } else {
    totalInterest = principal * 0.017 * months
  }
  
  const totalAmount = principal + totalInterest
  const monthlyPayment = totalAmount / months
  return Math.round(monthlyPayment).toLocaleString()
}

const calculateTotalInterest = () => {
  if (!loanAmount.value || !repaymentPeriod.value) return '0'
  const principal = parseFloat(loanAmount.value)
  const months = repaymentPeriod.value
  
  // Apply 15% flat rate if loan exceeds 2/3 of contributions
  let totalInterest
  if (exceedsTwoThirds.value) {
    totalInterest = principal * 0.15
  } else {
    totalInterest = principal * 0.017 * months
  }
  
  return Math.round(totalInterest).toLocaleString()
}

const calculateTotalRepayment = () => {
  if (!loanAmount.value || !repaymentPeriod.value) return '0'
  const principal = parseFloat(loanAmount.value)
  const months = repaymentPeriod.value
  
  // Apply 15% flat rate if loan exceeds 2/3 of contributions
  let totalInterest
  if (exceedsTwoThirds.value) {
    totalInterest = principal * 0.15
  } else {
    totalInterest = principal * 0.017 * months
  }
  
  return Math.round(principal + totalInterest).toLocaleString()
}

const submitLoanRequest = async () => {
  if (isLoanRequestDisabled.value) return

  // Validate repayment period
  if (!repaymentPeriod.value || repaymentPeriod.value < 1 || repaymentPeriod.value > 6) {
    errorMessage.value = 'Repayment period must be between 1 and 6 months'
    showErrorModal.value = true
    return
  }

  loanLoading.value = true
  const { api } = useApi()
  
  try {
    // Prepare guarantors data
    const guarantorsData = guarantors.value
      .filter(g => g.name && g.phone)
      .map(g => ({ name: g.name, phone: g.phone }))

    const data = await api('/v1/loans', {
      method: 'POST',
      body: {
        user_id: user.value.id,
        tontine_id: selectedTontine.value.id,
        loan_amount: parseFloat(loanAmount.value),
        repayment_period: parseInt(repaymentPeriod.value),
        phone_number: user.value.phone,
        purpose: loanPurpose.value,
        guarantors: guarantorsData.length > 0 ? guarantorsData : undefined
      }
    })
    
    if (data) {
      successMessage.value = data.message || 'Loan request submitted successfully'
      showSuccessModal.value = true
      showLoanModal.value = false
      await fetchLoans()
    } else {
      errorMessage.value = data.message || 'Failed to submit loan request'
      showErrorModal.value = true
    }
    
  } catch (error) {
    errorMessage.value = error?.data?.message || error?.message || 'Failed to submit loan request. Please try again.'
    showErrorModal.value = true
  } finally {
    loanLoading.value = false
  }
}

const confirmLoanReceipt = async () => {
  if (!activeLoan.value || !canConfirmReceipt.value) return

  confirmLoading.value = true
  const { api } = useApi()

  try {
    const data = await api(`/v1/loans/${activeLoan.value.id}/confirm-receipt`, {
      method: 'POST',
      body: {
        userId: user.value.id
      }
    })

    if (data) {
      successMessage.value = data.message || 'Loan receipt confirmed successfully'
      showSuccessModal.value = true
      activeLoan.value.status = 'Received'
      await fetchLoans()
    }
  } catch (error) {
    errorMessage.value = error?.data?.message || error?.message || 'Failed to confirm loan receipt. Please try again.'
    showErrorModal.value = true
  } finally {
    confirmLoading.value = false
  }
}

const processLoanPayment = async () => {
  paymentLoading.value = true
  const { api } = useApi()
  
  try {
    const paymentAmount = parseFloat(customPaymentAmount.value)
    
    const data = await api('/v1/payments/loan', {
      method: 'POST',
      body: {
        loanId: activeLoan.value.id,
        userId: user.value.id,
        amount: paymentAmount,
        paymentMethod: paymentMethod.value,
        paymentData: {
          phone: loanPaymentPhone.value,
          description: `Loan payment for loan #${activeLoan.value.id}`
        }
      }
    })
    
    if (data) {
      successMessage.value = data.message || 'Loan payment submitted successfully'
      showSuccessModal.value = true
      showPaymentModal.value = false
      customPaymentAmount.value = ''
      await fetchLoans()
    } else {
      errorMessage.value = data.message || 'Payment failed'
      showErrorModal.value = true
    }
  } catch (error) {
    errorMessage.value = error?.data?.message || error?.message || 'Payment failed. Please try again.'
    showErrorModal.value = true
  } finally {
    paymentLoading.value = false
  }
}

const calculateRemainingBalance = (loan) => {
  if (!loan) return 0
  
  // The total_amount field already contains principal + interest as calculated by the backend
  // So we can use it directly instead of recalculating
  const totalAmountDue = parseFloat(loan.total_amount || loan.amount || 0)
  
  // Subtract actual approved payments
  const totalPaid = loan.total_paid || 0
  const remainingBalance = totalAmountDue - parseFloat(totalPaid)
  
  return Math.max(0, Math.round(remainingBalance))
}

const formatRepaymentDate = (dateTaken, months) => {
  if (!dateTaken || !months) return 'N/A'
  const d = new Date(dateTaken)
  d.setMonth(d.getMonth() + parseInt(months))
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatPaymentMethod = (method) => {
  if (!method) return 'Mobile Money'
  
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

const getLoanStatusClass = (status) => {
  const statusStr = String(status || '').toLowerCase()
  if (statusStr === 'approved') return 'text-green-600'
  if (statusStr === 'pending') return 'text-yellow-600'
  if (statusStr === 'rejected') return 'text-red-600'
  return 'text-gray-600'
}

const getLoanStatusLabel = (status) => {
  if (!status) return 'Pending'
  const statusStr = String(status).toLowerCase()
  if (statusStr === 'approved') return 'Approved'
  if (statusStr === 'pending') return 'Pending'
  if (statusStr === 'rejected') return 'Rejected'
  return status
}

const getLoanStatusIcon = (status) => {
  if (!status) return '⏳ Pending'
  const statusStr = String(status).toLowerCase()
  if (statusStr === 'approved') return '✓ Approved'
  if (statusStr === 'pending') return '⏳ Pending'
  if (statusStr === 'rejected') return '✗ Rejected'
  return status
}

const getStatusClass = (status) => {
  return 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700'
}

const getStatusTextClass = (status) => {
  switch (status) {
    case 'completed': return 'text-green-600'
    case 'active': case 'approved': return 'text-orange-600'
    case 'pending': return 'text-yellow-600'
    case 'rejected': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed': return '✓'
    case 'active': case 'approved': return '⏳'
    case 'pending': return '⏰'
    case 'rejected': return '✗'
    default: return '•'
  }
}

definePageMeta({
  layout: 'default'
})
</script>
