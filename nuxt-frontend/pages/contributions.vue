<template>
  <div class="min-h-screen bg-white">
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-green-600">Monthly Contributions</h1>
          <p class="text-gray-600">Select a tontine to manage contributions</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">
          Back to Dashboard
        </UButton>
      </div>

      <!-- Tontine Selection -->
      <UCard class="mb-8 shadow-lg" v-if="!selectedTontine">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-green-600 mb-4">Select Tontine</h2>
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
              <div class="text-green-600 font-semibold">
                {{ ((tontine.user_shares || 1) * tontine.contribution_amount).toLocaleString() }} RWF/month
              </div>
              <div class="text-xs text-gray-500">{{ tontine.user_shares || 1 }} shares</div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Current Month Contribution -->
      <UCard class="mb-8 shadow-lg" v-if="selectedTontine">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-green-600">{{ selectedTontine.name }} - {{ currentMonthLabel }} Contribution</h2>
            <UButton @click="selectedTontine = null" variant="outline" size="xs">
              Change Tontine
            </UButton>
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="text-2xl font-bold text-green-600">RWF {{ monthlyAmount.toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Required Monthly Amount</div>
              </div>
            </div>
            <div>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="text-2xl font-bold text-yellow-600">Due: {{ dueDateLabel }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Payment Deadline</div>
              </div>
            </div>
          </div>
          
          <div v-if="currentContribution" class="mt-6 p-4 rounded-lg border" :class="currentContributionNoticeClass">
            <div class="font-semibold">{{ currentContributionTitle }}</div>
            <div class="text-sm mt-1">{{ currentContributionMessage }}</div>
          </div>
          
        </div>
      </UCard>

      <!-- Penalty Information -->
      <UCard class="mb-8 shadow-lg" v-if="selectedTontine">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-red-600 mb-4">Payment Penalties (Article 36)</h2>
          <div class="grid md:grid-cols-3 gap-4">
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="font-semibold text-red-700 dark:text-red-400">10th - 17th of Month</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">{{ (monthlyAmount * 0.05).toLocaleString() }} RWF fine (5% of contribution)</div>
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="font-semibold text-red-700 dark:text-red-400">After 17th of Month</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">1% of monthly contribution ({{ Math.round(monthlyAmount * 0.01).toLocaleString() }} RWF)</div>
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="font-semibold text-red-700 dark:text-red-400">3 Months Late</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">Automatic expulsion</div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Contribution History -->
      <UCard class="shadow-lg" v-if="selectedTontine">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-green-600 mb-4">{{ selectedTontine.name }} - Contribution History</h2>
          <div v-if="loading" class="text-center py-8">
            <div class="text-gray-500">Loading contributions...</div>
          </div>
          <div v-else-if="contributions.length === 0" class="text-center py-8">
            <div class="text-gray-500">No contributions found</div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="contribution in contributions" :key="contribution.id" 
                 class="flex justify-between items-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <div>
                <div class="font-semibold">{{ formatDate(contribution.contribution_date) }}</div>
                <div class="text-sm text-gray-600">{{ formatPaymentMethod(contribution.payment_method) || 'Mobile Money' }}</div>
              </div>
              <div class="text-right">
                <div class="font-semibold" :class="{
                  'text-green-600': contribution.payment_status === 'Approved',
                  'text-yellow-600': contribution.payment_status === 'Pending',
                  'text-red-600': isContributionFailed(contribution.payment_status)
                }">RWF {{ Number(contribution.amount).toLocaleString() }}</div>
                <div class="text-xs" :class="{
                  'text-green-600': contribution.payment_status === 'Approved',
                  'text-yellow-600': contribution.payment_status === 'Pending',
                  'text-red-600': isContributionFailed(contribution.payment_status),
                  'text-gray-600': !contribution.payment_status
                }">
                  {{ getContributionStatusLabel(contribution.payment_status) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Payment Modal -->
    <UModal v-model="showPaymentModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-green-600">Make Monthly Contribution</h3>
        </template>
        
        <div class="space-y-4">
          <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
            <div class="text-xl font-bold text-green-600">RWF {{ monthlyAmount.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">{{ currentMonthLabel }} Monthly Contribution</div>
          </div>
          
          <UFormGroup label="Payment Method">
            <USelect v-model="paymentMethod" :options="paymentOptions" />
          </UFormGroup>
          
          <UFormGroup label="Phone Number" v-if="paymentMethod === 'mobile_money'">
            <UInput v-model="phoneNumber" placeholder="0781234567" />
          </UFormGroup>
          
          <div v-if="paymentStatus" class="bg-blue-50 p-3 rounded-lg">
            <div class="text-sm text-blue-700">{{ paymentStatus }}</div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showPaymentModal = false" variant="outline">Cancel</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { io } from 'socket.io-client'

const showPaymentModal = ref(false)
const paymentLoading = ref(false)
const paymentMethod = ref('mobile_money')
const phoneNumber = ref('')
const loading = ref(true)
const loadingTontines = ref(true)
const contributions = ref([])
const user = ref(null)
const selectedTontine = ref(null)
const userTontines = ref([])
const monthlyAmount = ref(20000)
const socket = ref(null)
const paymentStatus = ref('')
const config = useRuntimeConfig()

const paymentOptions = [
  { label: 'Mobile Money', value: 'mobile_money' },
  { label: 'Bank Transfer', value: 'bank' },
  { label: 'Cash', value: 'cash' }
]

const currentMonthLabel = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const dueDateLabel = computed(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 17).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const isSameContributionDay = (dateString) => {
  if (!dateString) return false

  const contributionDate = new Date(dateString)
  const today = new Date()

  return contributionDate.getFullYear() === today.getFullYear()
    && contributionDate.getMonth() === today.getMonth()
    && contributionDate.getDate() === today.getDate()
}

const currentContribution = computed(() => {
  return contributions.value.find(contribution => isSameContributionDay(contribution.contribution_date))
})

const currentContributionStatus = computed(() => {
  return String(currentContribution.value?.payment_status || '').toLowerCase()
})

const isContributionFailed = (status) => {
  return ['failed', 'rejected'].includes(String(status || '').toLowerCase())
}

const getContributionStatusLabel = (status) => {
  if (!status) return 'Pending'
  const statusStr = String(status).toLowerCase()
  if (statusStr === 'approved') return '✓ Approved'
  if (statusStr === 'pending') return '⏳ Pending'
  if (statusStr === 'failed' || statusStr === 'rejected') return '✗ Failed'
  return status
}

const currentContributionTitle = computed(() => {
  if (currentContributionStatus.value === 'approved') return 'Contribution approved'
  if (isContributionFailed(currentContributionStatus.value)) return 'Contribution failed'
  return 'Contribution pending'
})

const currentContributionMessage = computed(() => {
  if (currentContributionStatus.value === 'approved') {
    return 'Your contribution for today has already been approved.'
  }

  if (isContributionFailed(currentContributionStatus.value)) {
    return 'Your latest contribution failed. You can try again or contact support.'
  }

  return 'You already have a contribution payment for today. Please wait for it to be processed.'
})

const currentContributionNoticeClass = computed(() => {
  if (currentContributionStatus.value === 'approved') {
    return 'bg-green-50 border-green-200 text-green-800'
  }

  if (isContributionFailed(currentContributionStatus.value)) {
    return 'bg-red-50 border-red-200 text-red-800'
  }

  return 'bg-yellow-50 border-yellow-200 text-yellow-800'
})

const paymentButtonLabel = computed(() => {
  if (currentContributionStatus.value === 'approved') return 'Contribution Approved'
  if (currentContributionStatus.value === 'pending') return 'Contribution Pending'
  return `Make Payment - RWF ${monthlyAmount.value.toLocaleString()}`
})

const paymentButtonClass = computed(() => {
  if (currentContributionStatus.value === 'approved') return 'bg-green-500 hover:bg-green-600'
  if (currentContributionStatus.value === 'pending') return 'bg-yellow-600 hover:bg-yellow-700'
  return 'bg-green-600 hover:bg-green-700'
})

const isPaymentButtonDisabled = computed(() => {
  // Disable button when there's already a contribution for today that is not failed
  if (currentContribution.value && !isContributionFailed(currentContributionStatus.value)) {
    return true
  }
  return false
})

const getApiMessage = (error, fallback = 'Please try again or contact support') => {
  return error?.data?.message
    || error?.response?._data?.message
    || error?.response?.data?.message
    || error?.message
    || fallback
}

// Initialize Socket.io connection
const initSocket = () => {
  if (process.client && !socket.value) {
    socket.value = io(config.public.socketBase)
    
    socket.value.on('connect', () => {
      joinSocketRooms()
    })
    
    // Listen for payment status updates
    socket.value.on('payment-status-updated', (data) => {
      if (data.userId === user.value?.id) {
        const toast = useToast()
        
        // Update contribution in the list
        const contributionIndex = contributions.value.findIndex(c => c.id === data.contributionId)
        if (contributionIndex !== -1) {
          contributions.value[contributionIndex].payment_status = data.status
        }
        
        toast.add({
          title: data.status === 'Approved' ? '✅ Payment Confirmed!' : '❌ Payment Failed',
          description: data.message,
          color: data.status === 'Approved' ? 'green' : 'red'
        })
      }
    })
    
    // Listen for payment status updates
    socket.value.on('payment-status', (data) => {
      if (data.userId === user.value?.id) {
        const toast = useToast()
        
        switch (data.status) {
          case 'initiated':
          case 'pending':
            paymentStatus.value = 'Processing payment...'
            if (data.status === 'pending') {
              break
            }
            toast.add({
              title: '🔄 Payment Processing',
              description: data.message,
              color: 'blue'
            })
            break
          case 'completed':
            paymentStatus.value = 'Payment completed'
            toast.add({
              title: '✅ Payment Successful!',
              description: data.message,
              color: 'green'
            })
            fetchContributions() // Refresh data
            break
          case 'failed':
            paymentStatus.value = 'Payment failed'
            toast.add({
              title: '❌ Payment Failed',
              description: data.message,
              color: 'red'
            })
            fetchContributions()
            break
          case 'error':
            paymentStatus.value = 'Payment error'
            toast.add({
              title: '⚠️ Payment Error',
              description: data.message,
              color: 'red'
            })
            break
        }
      }
    })
    
    // Listen for contribution updates
    socket.value.on('contribution-received', (data) => {
      fetchContributions() // Refresh contributions list
    })
  }
}

const joinSocketRooms = () => {
  if (!socket.value) return

  if (user.value?.id) {
    socket.value.emit('join-user-room', user.value.id)
  }

  if (selectedTontine.value?.id) {
    socket.value.emit('join-tontine', selectedTontine.value.id)
  }
}

// Get user data and fetch contributions
onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await fetchUserTontines()
      
      // Auto-select tontine from URL parameter
      const route = useRoute()
      if (route.query.tontine) {
        const tontine = userTontines.value.find(t => t.id == route.query.tontine)
        if (tontine) {
          selectTontine(tontine)
        }
      }
    }
  }
})

// Cleanup socket connection
onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
})

const fetchUserTontines = async () => {
  const { api } = useApi()
  try {
    loadingTontines.value = true
    // TODO: Backend endpoint /api/v1/tontines/user/:userId does not exist
    const response = await api('/v1/tontines', { params: { userId: user.value.id } })
    const data = response.data || response
    userTontines.value = Array.isArray(data) ? data : (data.data || [])
  } catch (error) {
    console.error('Failed to fetch user tontines:', error)
    userTontines.value = []
  } finally {
    loadingTontines.value = false
  }
}

const selectTontine = async (tontine) => {
  selectedTontine.value = tontine
  monthlyAmount.value = (tontine.user_shares || 1) * tontine.contribution_amount
  await fetchContributions()
  initSocket()
  joinSocketRooms()
}

const fetchContributions = async () => {
  const { api } = useApi()
  if (!selectedTontine.value) return

  try {
    // TODO: Backend endpoint /api/v1/contributions/tontine/:tontineId does not exist
    const response = await api('/v1/contributions', { params: { tontineId: selectedTontine.value.id } })
    const data = response.data || response
    const contributionsList = Array.isArray(data) ? data : (data.data || [])
    // Filter to show only current user's contributions
    contributions.value = contributionsList.filter(c => Number(c.user_id) === Number(user.value.id))
  } catch (error) {
    console.error('Failed to fetch contributions:', error)
    contributions.value = []
  } finally {
    loading.value = false
  }
}

const processPayment = async () => {
  const toast = useToast()

  if (currentContribution.value && !isContributionFailed(currentContributionStatus.value)) {
    toast.add({
      title: currentContributionTitle.value,
      description: currentContributionMessage.value,
      color: currentContributionStatus.value === 'approved' ? 'green' : 'yellow'
    })
    return
  }

  paymentLoading.value = true
  const { api } = useApi()
  
  try {
    const result = await api('/v1/payments/contribution', {
      method: 'POST',
      body: {
        userId: user.value.id,
        tontineId: selectedTontine.value?.id,
        amount: monthlyAmount.value,
        paymentMethod: paymentMethod.value,
        paymentData: {
          phone: phoneNumber.value,
          description: `Monthly contribution for ${currentMonthLabel.value}`
        }
      }
    })
    
    if (result && result.success) {
      toast.add({
        title: 'Payment Request Sent',
        description: result.message || `Your ${currentMonthLabel.value} contribution is pending processing.`,
        color: 'yellow'
      })
      
      showPaymentModal.value = false
      await fetchContributions() // Refresh data
      
      // Trigger auto-refresh
      localStorage.setItem('auto-refresh-trigger', Date.now().toString())
      window.dispatchEvent(new CustomEvent('auto-refresh'))
    } else {
      toast.add({
        title: '❌ Payment Failed',
        description: result?.message || 'Please try again or contact support',
        color: 'red'
      })
    }
  } catch (error) {
    const status = error?.statusCode || error?.response?.status
    const isValidationWarning = status === 400
    const toast = useToast()
    toast.add({
      title: isValidationWarning ? 'Contribution Pending' : 'Payment Failed',
      description: getApiMessage(error, 'Network error. Please try again or contact support'),
      color: isValidationWarning ? 'yellow' : 'red'
    })

    if (isValidationWarning) {
      await fetchContributions()
    }
  } finally {
    paymentLoading.value = false
  }
}

const openPaymentModal = () => {
  const toast = useToast()

  if (currentContribution.value && !isContributionFailed(currentContributionStatus.value)) {
    toast.add({
      title: currentContributionTitle.value,
      description: currentContributionMessage.value,
      color: currentContributionStatus.value === 'approved' ? 'green' : 'yellow'
    })
    return
  }

  showPaymentModal.value = true
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

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

definePageMeta({
  layout: 'default'
})
</script>
