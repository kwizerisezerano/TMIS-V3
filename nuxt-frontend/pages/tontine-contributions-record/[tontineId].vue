<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-blue-100 dark:border-gray-800 shadow-sm">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">Admin Action</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">• Manual Override</span>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Record Contributions</h1>
        <p v-if="tontine" class="mt-1.5 text-lg text-gray-600 dark:text-gray-400">
          {{ tontine.name }} — Base Amount: <span class="font-semibold text-blue-600 dark:text-blue-400">RWF {{ parseFloat(tontine.contribution_amount).toLocaleString() }}</span> ({{ tontine.contribution_period }}ly)
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
        <span class="font-semibold text-purple-800 dark:text-purple-200 text-sm">Allocated Surplus — Members have pre-approved surplus for contributions</span>
      </div>
      <div class="space-y-2">
        <div v-for="s in allocatedSurplus" :key="s.id" class="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-purple-100 dark:border-purple-800 text-sm">
          <span class="font-medium text-gray-900 dark:text-white">{{ s.user_name }}</span>
          <span class="text-purple-700 dark:text-purple-300 font-semibold">RWF {{ parseFloat(s.amount).toLocaleString() }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ s.member_note || 'No note' }}</span>
        </div>
      </div>
    </div>

    <!-- Date Picker Card -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Select Contribution Date</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">Showing existing contributions or defaults for the selected date.</p>
      </div>
      <div class="w-full sm:w-64">
        <input 
          v-model="contributionDate" 
          type="date" 
          @change="fetchContributionsForDate"
          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium"
        />
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="loading" class="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading members and contributions...</p>
    </div>

    <div v-else-if="records.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="text-gray-300 dark:text-gray-600 mb-3">
        <UIcon name="i-heroicons-users" class="w-16 h-16 mx-auto" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white">No Approved Members</h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">There are no approved members in this tontine to record contributions for.</p>
    </div>

    <div v-else>
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member Details</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shares & Expected</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contribution Amount</th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes / Comments</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="member in records" :key="member.user_id" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                <!-- Member Details -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <UAvatar :alt="member.names" size="sm" class="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" />
                    <div>
                      <div class="font-semibold text-gray-900 dark:text-white">{{ member.names }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{{ member.email }}</div>
                    </div>
                  </div>
                </td>
                
                <!-- Shares & Expected -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ member.shares }} Share(s)</span>
                    <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      Expected: RWF {{ (member.shares * tontine.contribution_amount).toLocaleString() }}
                    </span>
                  </div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <select 
                      v-model="member.status"
                      @change="handleStatusChange(member)"
                      :class="getStatusSelectClass(member.status)"
                    >
                      <option value="Not Paid">Not Paid</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </td>

                <!-- Amount -->
                <td class="px-6 py-4">
                  <CurrencyInput
                    v-model="member.amount"
                    :disabled="member.status === 'Not Paid'"
                    placeholder="0"
                  />
                  <div v-if="member.status !== 'Not Paid' && getSurplusForMember(member.userId)" class="mt-1.5 space-y-0.5">
                    <div class="text-xs text-purple-600 dark:text-purple-400">
                      🎁 Surplus available: RWF {{ getSurplusForMember(member.userId).toLocaleString() }}
                    </div>
                    <div class="text-xs font-medium" :class="getSurplusForMember(member.userId) >= (member.shares * tontine.contribution_amount) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
                      <template v-if="getSurplusForMember(member.userId) >= (member.shares * tontine.contribution_amount)">
                        ✓ Surplus fully covers this contribution — no cash needed
                      </template>
                      <template v-else>
                        Surplus covers RWF {{ getSurplusForMember(member.userId).toLocaleString() }} · Cash needed: RWF {{ Math.max(0, (member.shares * tontine.contribution_amount) - getSurplusForMember(member.userId)).toLocaleString() }}
                      </template>
                    </div>
                  </div>
                </td>

                <!-- Notes -->
                <td class="px-6 py-4">
                  <input 
                    v-model="member.notes" 
                    type="text" 
                    :disabled="member.status === 'Not Paid'"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800/50"
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
          * Status "Not Paid" deletes any existing contribution record for that member on the selected date.
        </span>
        <div class="flex items-center gap-3">
          <UButton @click="$router.back()" variant="outline" size="lg">
            Cancel
          </UButton>
          <UButton @click="saveContributions" color="green" size="lg" icon="i-heroicons-check" :loading="saving">
            Save Contributions
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
const records = ref([])
const allocatedSurplus = ref([])
const contributionDate = ref(new Date().toISOString().split('T')[0])

const getSurplusForMember = (userId) => {
  const rows = allocatedSurplus.value.filter(s => s.user_id === userId)
  return rows.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)
}
const loading = ref(true)
const saving = ref(false)

onMounted(() => {
  if (process.client) {
    initAuth()
  }
  fetchData()
})

const getStatusSelectClass = (status) => {
  const base = "w-32 px-3 py-2 border rounded-xl shadow-sm focus:outline-none text-xs font-semibold cursor-pointer "
  if (status === 'Approved') return base + "border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
  if (status === 'Pending') return base + "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
  if (status === 'Failed') return base + "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
  return base + "border-gray-300 bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
}

const handleStatusChange = (member) => {
  if (member.status !== 'Not Paid' && (!member.amount || member.amount === 0)) {
    // Populate automatically with expected amount
    member.amount = member.shares * tontine.value.contribution_amount
  } else if (member.status === 'Not Paid') {
    member.amount = 0
    member.notes = ''
  }
}

const fetchData = async () => {
  loading.value = true
  const { api } = useApi()
  try {
    // 1. Fetch tontine details
    const tontineResponse = await api(`/v1/tontines/${tontineId}`)
    tontine.value = tontineResponse.data || tontineResponse
    
    if (!tontine.value) {
      toast.add({ title: 'Error', description: 'Tontine not found', color: 'red' })
      router.push('/tontines')
      return
    }

    // 2. Fetch approved tontine members
    const membersResponse = await api(`/v1/members/tontine/${tontineId}?status=approved&limit=100`)
    members.value = membersResponse.data?.members || membersResponse.members || []

    // 3. Fetch allocated surplus for contributions
    try {
      const surplusRes = await api(`/v1/surplus/tontine/${tontineId}?status=allocated`)
      const all = surplusRes.data || surplusRes || []
      allocatedSurplus.value = (Array.isArray(all) ? all : []).filter(s => s.destination === 'contribution')
    } catch { allocatedSurplus.value = [] }

    // 4. Fetch existing contributions for the selected date
    await fetchContributionsForDate()
  } catch (error) {
    console.error('Error fetching tontine/members:', error)
    toast.add({ title: 'Error', description: 'Failed to load details', color: 'red' })
  } finally {
    loading.value = false
  }
}

const fetchContributionsForDate = async () => {
  const { api } = useApi()
  try {
    const contributionsResponse = await api(`/v1/contributions?tontineId=${tontineId}&contributionDate=${contributionDate.value}&limit=100`)
    const existingContributions = contributionsResponse.data || contributionsResponse || []

    // Map members to contribution records
    records.value = members.value.map(member => {
      const existing = existingContributions.find(c => c.user_id === member.user_id)
      return {
        userId: member.user_id,
        names: member.names,
        email: member.email,
        shares: member.shares || 1,
        status: existing ? existing.payment_status : 'Not Paid',
        amount: existing ? parseFloat(existing.amount) : 0,
        notes: '' // notes are virtual and generated for notifications, not persisted to contributions table
      }
    })
  } catch (error) {
    console.error('Error fetching contributions for date:', error)
    toast.add({ title: 'Warning', description: 'Could not fetch existing contribution logs for this date', color: 'yellow' })
  }
}

const saveContributions = async () => {
  saving.value = true
  const { api } = useApi()
  try {
    const payload = {
      contributionDate: contributionDate.value,
      contributions: records.value.map(r => ({
        userId: r.userId,
        amount: r.amount,
        status: r.status,
        notes: r.notes || ''
      }))
    }

    await api(`/v1/contributions/tontine/${tontineId}/bulk`, {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Success',
      description: 'Contributions updated successfully',
      color: 'green'
    })
    
    router.back()
  } catch (error) {
    console.error('Error saving contributions:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to save contributions',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}
</script>
