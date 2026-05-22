<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-red-100 dark:border-gray-800 shadow-sm">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">Admin Action</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">• Manual Override</span>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Record Penalty Payments</h1>
        <p v-if="tontine" class="mt-1.5 text-lg text-gray-600 dark:text-gray-400">
          {{ tontine.name }} — Record manual penalty payments for members
        </p>
        <div v-else class="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
      </div>
      <div class="flex items-center gap-3">
        <UButton @click="$router.back()" variant="outline" icon="i-heroicons-arrow-left">
          Back
        </UButton>
      </div>
    </div>

    <!-- Date Picker Card -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Select Payment Date</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">Select the date for penalty payment recording.</p>
      </div>
      <div class="w-full sm:w-64">
        <input 
          v-model="paymentDate" 
          type="date" 
          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium"
        />
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="loading" class="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading members and penalties...</p>
    </div>

    <div v-else-if="records.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="text-gray-300 dark:text-gray-600 mb-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 mx-auto" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white">No Pending Penalties</h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">There are no pending penalties in this tontine to record payments for.</p>
    </div>

    <div v-else>
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member & Penalty Details</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes / Comments</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="record in records" :key="record.penalty_id" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                <!-- Member & Penalty Details -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <UAvatar :alt="record.names" size="sm" class="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" />
                    <div>
                      <div class="font-semibold text-gray-900 dark:text-white">{{ record.names }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{{ record.email }}</div>
                      <div class="text-xs text-red-600 dark:text-red-400 mt-1">
                        Penalty #{{ record.penalty_id.toString().padStart(3, '0') }} - Amount: RWF {{ parseFloat(record.amount).toLocaleString() }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        Reason: {{ record.reason }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <select 
                      v-model="record.status"
                      :class="getStatusSelectClass(record.status)"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="waived">Waived</option>
                    </select>
                  </div>
                </td>

                <!-- Notes -->
                <td class="px-6 py-4">
                  <input 
                    v-model="record.notes" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                    placeholder="Enter payment notes..."
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
          * Record manual penalty payments for members.
        </span>
        <div class="flex items-center gap-3">
          <UButton @click="$router.back()" variant="outline" size="lg">
            Cancel
          </UButton>
          <UButton @click="savePenaltyPayments" color="red" size="lg" icon="i-heroicons-check" :loading="saving">
            Save Penalty Payments
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const tontineId = route.params.tontineId

const tontine = ref(null)
const members = ref([])
const penalties = ref([])
const records = ref([])
const paymentDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(true)
const saving = ref(false)

const getStatusSelectClass = (status) => {
  const base = "w-32 px-3 py-2 border rounded-xl shadow-sm focus:outline-none text-xs font-semibold cursor-pointer "
  if (status === 'paid') return base + "border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
  if (status === 'pending') return base + "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
  if (status === 'waived') return base + "border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
  return base + "border-gray-300 bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
}

const fetchData = async () => {
  loading.value = true
  const { api } = useApi()
  console.log('=== PAGE PARAMETERS ===')
  console.log('route.params.tontineId:', route.params.tontineId)
  console.log('tontineId variable:', tontineId)
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

    // 2. Fetch penalties for this tontine
    const penaltiesResponse = await api(`/v1/penalties/tontine/${tontineId}`)
    console.log('=== PENALTIES DEBUG ===')
    console.log('1. Full penaltiesResponse:', penaltiesResponse)
    
    // Try all possible ways to get the penalties array
    let allPenalties = []
    if (Array.isArray(penaltiesResponse)) {
      allPenalties = penaltiesResponse
    } else if (penaltiesResponse?.data) {
      if (Array.isArray(penaltiesResponse.data)) {
        allPenalties = penaltiesResponse.data
      } else if (penaltiesResponse.data?.penalties) {
        allPenalties = penaltiesResponse.data.penalties
      }
    } else if (penaltiesResponse?.penalties) {
      allPenalties = penaltiesResponse.penalties
    }
    
    console.log('2. Extracted allPenalties:', allPenalties)
    penalties.value = allPenalties.filter(p => {
      const matches = p?.status?.toLowerCase() === 'pending'
      console.log(`3. Penalty ${p?.id}: status=${p?.status}, matches=${matches}`)
      return matches
    })
    console.log('4. Filtered pending penalties:', penalties.value)

    // Map penalties to records
    records.value = penalties.value.map(penalty => {
      return {
        userId: penalty.user_id,
        penaltyId: penalty.id,
        penalty_id: penalty.id,
        names: penalty.user_name,
        email: '',
        amount: penalty.amount,
        reason: penalty.reason,
        status: penalty.status,
        notes: ''
      }
    })
    console.log('5. Final records:', records.value)
  } catch (error) {
    console.error('Error fetching tontine/penalties:', error)
    toast.add({ title: 'Error', description: 'Failed to load details', color: 'red' })
  } finally {
    loading.value = false
  }
}

const savePenaltyPayments = async () => {
  saving.value = true
  const { api } = useApi()
  try {
    const payload = {
      paymentDate: paymentDate.value,
      payments: records.value.map(r => ({
        userId: r.userId,
        penaltyId: r.penaltyId,
        status: r.status,
        notes: r.notes || ''
      }))
    }

    await api(`/v1/penalties/tontine/${tontineId}/bulk-payments`, {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Success',
      description: 'Penalty payments updated successfully',
      color: 'green'
    })
    
    router.back()
  } catch (error) {
    console.error('Error saving penalty payments:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to save penalty payments',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
