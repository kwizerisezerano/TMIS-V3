<template>
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ tontineName }} Management</h1>
        <p class="text-gray-600 dark:text-slate-400">Manage members, contributions, loans, and penalties</p>
      </div>
      <button v-if="activeTab === 'members'" @click="showAddModal = true" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto">
        <Icon name="i-heroicons-plus" class="w-4 h-4" />
        Add Member
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="mb-6">
      <nav class="flex space-x-8 border-b border-gray-200 dark:border-slate-700">
        <button 
          @click="activeTab = 'members'"
          :class="activeTab === 'members' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Members
        </button>
        <button 
          v-if="isAccountant"
          @click="activeTab = 'contributions'"
          :class="activeTab === 'contributions' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Contributions
        </button>
        <button 
          v-if="isAccountant"
          @click="activeTab = 'loans'"
          :class="activeTab === 'loans' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Loans
        </button>
        <button 
          @click="activeTab = 'penalties'"
          :class="activeTab === 'penalties' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Penalties
        </button>
      </nav>
    </div>

    <!-- Members Tab -->
    <div v-if="activeTab === 'members'">
      <UCard class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tontine Members ({{ filteredMembers.length }}/20)</h3>
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-500 dark:text-slate-400">Loading members...</div>
      </div>

      <div v-else-if="paginatedMembers.length === 0" class="text-center py-8">
        <div class="text-gray-500 dark:text-slate-400">No members found</div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Phone</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="member in paginatedMembers" :key="member.id" class="hover:bg-gray-50 dark:hover:bg-slate-700">
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ member.names }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                {{ member.email }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                {{ member.phone }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="member.role === 'admin' || member.role === 'president' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ member.role }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="member.email_verified ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ member.email_verified ? 'Verified' : 'Pending' }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button @click="editMember(member)" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">
                  Edit
                </button>
                <button @click="removeMember(member.id)" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </UCard>
    </div>

    <!-- Contributions Tab -->
    <div v-if="activeTab === 'contributions'">
      <UCard class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Record Monthly Contributions</h3>
            <div class="flex items-center gap-4">
              <UFormGroup label="Contribution Date">
                <UInput v-model="contributionDate" type="date" />
              </UFormGroup>
              <UButton @click="saveContributions" color="green" :loading="savingContributions">
                Save Contributions
              </UButton>
            </div>
          </div>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500 dark:text-slate-400">Loading contributions...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Shares</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Expected Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Actual Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              <tr v-for="member in members" :key="member.id">
                <td class="px-4 py-3 text-sm">{{ member.names }}</td>
                <td class="px-4 py-3 text-sm">{{ member.shares || 1 }}</td>
                <td class="px-4 py-3 text-sm">RWF {{ (member.shares * tontineContributionAmount).toLocaleString() }}</td>
                <td class="px-4 py-3">
                  <UInput v-model="memberContributions[member.id].amount" type="number" min="0" size="sm" />
                </td>
                <td class="px-4 py-3">
                  <USelect v-model="memberContributions[member.id].status" :options="contributionStatusOptions" size="sm" />
                </td>
                <td class="px-4 py-3">
                  <UInput v-model="memberContributions[member.id].notes" placeholder="Notes" size="sm" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Loans Tab -->
    <div v-if="activeTab === 'loans'">
      <UCard class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Manage Loans</h3>
            <UButton @click="saveLoans" color="green" :loading="savingLoans">
              Save Loans
            </UButton>
          </div>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500 dark:text-slate-400">Loading loans...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Total Contributions</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Max Loan (2/3)</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Loan Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Repayment Period</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              <tr v-for="member in members" :key="member.id">
                <td class="px-4 py-3 text-sm">{{ member.names }}</td>
                <td class="px-4 py-3 text-sm">RWF {{ (member.totalContributions || 0).toLocaleString() }}</td>
                <td class="px-4 py-3 text-sm">RWF {{ Math.floor((member.totalContributions || 0) * 2 / 3).toLocaleString() }}</td>
                <td class="px-4 py-3">
                  <UInput v-model="memberLoans[member.id].amount" type="number" min="0" size="sm" />
                </td>
                <td class="px-4 py-3">
                  <USelect v-model="memberLoans[member.id].repaymentPeriod" :options="repaymentPeriodOptions" size="sm" />
                </td>
                <td class="px-4 py-3">
                  <USelect v-model="memberLoans[member.id].status" :options="loanStatusOptions" size="sm" />
                </td>
                <td class="px-4 py-3">
                  <UInput v-model="memberLoans[member.id].notes" placeholder="Notes" size="sm" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Penalties Tab -->
    <div v-if="activeTab === 'penalties'">
      <UCard class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Manage Penalties</h3>
            <button @click="showPenaltyModal = true" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <Icon name="i-heroicons-plus" class="w-4 h-4" />
              Add Penalty
            </button>
          </div>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500 dark:text-slate-400">Loading penalties...</div>
        </div>

        <div v-else-if="penalties.length === 0" class="text-center py-8">
          <div class="text-gray-500 dark:text-slate-400">No penalties found</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Reason</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              <tr v-for="penalty in penalties" :key="penalty.id" class="hover:bg-gray-50 dark:hover:bg-slate-700">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ penalty.user_name }}
                </td>
                <td class="px-4 py-4 text-sm text-gray-500 dark:text-slate-300">
                  {{ penalty.reason }}
                </td>
                <td class="px-4 py-4 text-sm font-medium text-red-600">
                  RWF {{ Number(penalty.amount).toLocaleString() }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span :class="penalty.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ penalty.status }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button v-if="penalty.status === 'pending'" @click="markPenaltyPaid(penalty)" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">
                    Mark Paid
                  </button>
                  <button @click="deletePenalty(penalty)" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Add Member Modal -->
    <UModal v-model="showAddModal">
      <UCard class="bg-white dark:bg-slate-800">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add New Member</h3>
        </template>

        <UForm :state="newMember" @submit="addMember" class="space-y-4">
          <UFormGroup label="Full Names" name="names" required>
            <UInput v-model="newMember.names" placeholder="Enter full names" />
          </UFormGroup>

          <UFormGroup label="Email" name="email" required>
            <UInput v-model="newMember.email" type="email" placeholder="Enter email" />
          </UFormGroup>

          <UFormGroup label="Phone" name="phone" required>
            <UInput v-model="newMember.phone" placeholder="078XXXXXXX" />
          </UFormGroup>

          <UFormGroup label="Password" name="password" required>
            <UInput v-model="newMember.password" type="password" placeholder="Enter password" />
          </UFormGroup>

          <UFormGroup label="Role" name="role">
            <USelect v-model="newMember.role" :options="roleOptions" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton @click="showAddModal = false" variant="outline">Cancel</UButton>
            <UButton type="submit" :loading="submitting" class="bg-green-600 hover:bg-green-700 text-white">Add Member</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Add Penalty Modal -->
    <UModal v-model="showPenaltyModal">
      <UCard class="bg-white dark:bg-slate-800">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Add Penalty</h3>
        </template>

        <UForm :state="newPenalty" @submit="addPenalty" class="space-y-4">
          <UFormGroup label="Member" name="userId" required>
            <USelect v-model="newPenalty.userId" :options="memberSelectOptions" placeholder="Select member" />
          </UFormGroup>

          <UFormGroup label="Amount (RWF)" name="amount" required>
            <UInput v-model="newPenalty.amount" type="number" min="1" placeholder="Enter amount" />
          </UFormGroup>

          <UFormGroup label="Reason" name="reason" required>
            <UTextarea v-model="newPenalty.reason" placeholder="Enter reason" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton @click="showPenaltyModal = false" variant="outline">Cancel</UButton>
            <UButton type="submit" :loading="submittingPenalty" class="bg-red-600 hover:bg-red-700 text-white">Add Penalty</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin',
  layout: 'default'
})

const route = useRoute()
const toast = useToast()
const { initAuth, accessToken } = useAuth()

const user = ref(null)

const tontineId = route.params.id
const tontineName = ref('')
const tontineContributionAmount = ref(20000)
const activeTab = ref('members')
const members = ref([])
const penalties = ref([])
const loading = ref(true)
const submitting = ref(false)
const savingContributions = ref(false)
const savingLoans = ref(false)
const submittingPenalty = ref(false)
const showAddModal = ref(false)
const showPenaltyModal = ref(false)

const currentPage = ref(1)
const itemsPerPage = 6

const contributionDate = ref(new Date().toISOString().split('T')[0])
const memberContributions = ref({})
const memberLoans = ref({})

const newMember = ref({
  names: '',
  email: '',
  phone: '',
  password: '',
  role: 'member'
})

const newPenalty = ref({
  userId: '',
  amount: '',
  reason: ''
})

const roleOptions = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' }
]

const contributionStatusOptions = [
  { label: 'Not Paid', value: 'Not Paid' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' }
]

const loanStatusOptions = [
  { label: 'Not Granted', value: 'Not Granted' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Disbursed', value: 'disbursed' },
  { label: 'Completed', value: 'completed' }
]

const repaymentPeriodOptions = [
  { label: '1 month', value: 1 },
  { label: '2 months', value: 2 },
  { label: '3 months', value: 3 },
  { label: '4 months', value: 4 },
  { label: '5 months', value: 5 },
  { label: '6 months', value: 6 }
]

const isAccountant = computed(() => {
  return user.value?.role === 'accountant'
})

watch(isAccountant, (newVal) => {
  if (!newVal && (activeTab.value === 'contributions' || activeTab.value === 'loans')) {
    activeTab.value = 'members'
  }
})

const memberSelectOptions = computed(() => {
  return members.value.map(m => ({
    label: m.names,
    value: m.id
  }))
})

onMounted(async () => {
  initAuth()
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
    }
  }
  await Promise.all([
    fetchTontineDetails(),
    fetchMembers(),
    fetchContributions(),
    fetchLoans(),
    fetchPenalties()
  ])
})

const fetchTontineDetails = async () => {
  const { api } = useApi()
  try {
    const response = await api(`/v1/tontines/${tontineId}`)
    const data = response.data || response
    tontineName.value = data.name || ''
    tontineContributionAmount.value = data.contribution_amount || 20000
  } catch (error) {
    console.error('Failed to fetch tontine details:', error)
  }
}

const fetchMembers = async () => {
  const { api } = useApi()
  try {
    loading.value = true
    const response = await api(`/v1/members/tontine/${tontineId}`)
    members.value = response.data?.members || []
    
    // Initialize contributions and loans objects for each member
    members.value.forEach(member => {
      memberContributions.value[member.id] = {
        amount: (member.shares || 1) * tontineContributionAmount.value,
        status: 'Not Paid',
        notes: ''
      }
      memberLoans.value[member.id] = {
        amount: 0,
        repaymentPeriod: 6,
        status: 'Not Granted',
        notes: ''
      }
    })
  } catch (error) {
    console.error('Failed to fetch members:', error)
  } finally {
    loading.value = false
  }
}

const fetchContributions = async () => {
  const { api } = useApi()
  try {
    const response = await api('/v1/contributions', { params: { tontineId } })
    const contribData = response.data || response
    const contribList = Array.isArray(contribData) ? contribData : (contribData.data || [])
    
    // Update memberContributions with existing contributions
    contribList.forEach(contrib => {
      if (memberContributions.value[contrib.user_id]) {
        memberContributions.value[contrib.user_id] = {
          amount: contrib.amount,
          status: contrib.payment_status,
          notes: ''
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch contributions:', error)
  }
}

const fetchLoans = async () => {
  const { api } = useApi()
  try {
    const response = await api('/v1/loans', { params: { tontineId } })
    const loansData = response.data || response
    const loansList = Array.isArray(loansData) ? loansData : (loansData.data || [])
    
    // Update memberLoans with existing loans
    loansList.forEach(loan => {
      if (memberLoans.value[loan.user_id]) {
        memberLoans.value[loan.user_id] = {
          amount: loan.amount,
          repaymentPeriod: loan.repayment_period,
          status: loan.status,
          notes: ''
        }
      }
    })
    
    // Calculate total contributions per member
    const contribRes = await api('/v1/contributions', { params: { tontineId } })
    const contribData = contribRes.data || contribRes
    const contribList = Array.isArray(contribData) ? contribData : (contribData.data || [])
    
    const contribsByMember = {}
    contribList.forEach(c => {
      if (c.payment_status === 'Approved') {
        contribsByMember[c.user_id] = (contribsByMember[c.user_id] || 0) + parseFloat(c.amount)
      }
    })
    
    members.value.forEach(member => {
      member.totalContributions = contribsByMember[member.id] || 0
    })
  } catch (error) {
    console.error('Failed to fetch loans:', error)
  }
}

const fetchPenalties = async () => {
  const { api } = useApi()
  try {
    const response = await api('/v1/penalties/all')
    const data = response.data || response
    const penaltiesList = data.penalties || data || []
    penalties.value = penaltiesList.filter(p => p.tontine_id === parseInt(tontineId))
  } catch (error) {
    console.error('Failed to fetch penalties:', error)
  }
}

const filteredMembers = computed(() => members.value)
const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMembers.value.slice(start, end)
})

const addMember = async () => {
  const { api } = useApi()
  try {
    submitting.value = true
    
    const data = await api('/v1/auth/register', {
      method: 'POST',
      body: newMember.value
    })
    
    if (data.success) {
      const joinResponse = await api(`/v1/members/tontine/${tontineId}/join`, {
        method: 'POST',
        body: { userId: data.data?.userId || data.userId }
      })
      
      toast.add({
        title: 'Success',
        description: 'Member added successfully',
        color: 'green'
      })
      
      showAddModal.value = false
      newMember.value = { names: '', email: '', phone: '', password: '', role: 'member' }
      await fetchMembers()
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to add member',
      color: 'red'
    })
  } finally {
    submitting.value = false
  }
}

const editMember = (member) => {
  toast.add({
    title: 'Info',
    description: 'Edit functionality coming soon',
    color: 'blue'
  })
}

const removeMember = async (memberId) => {
  if (!confirm('Are you sure you want to remove this member?')) return
  
  const { api } = useApi()
  try {
    const response = await api(`/v1/members/${memberId}`, { method: 'DELETE' })
    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'Member removed successfully',
        color: 'green'
      })
      await fetchMembers()
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to remove member',
      color: 'red'
    })
  }
}

const saveContributions = async () => {
  const { api } = useApi()
  try {
    savingContributions.value = true
    
    const contributions = members.value.map(member => ({
      userId: member.id,
      amount: memberContributions.value[member.id].amount,
      status: memberContributions.value[member.id].status,
      notes: memberContributions.value[member.id].notes
    }))
    
    await api(`/v1/contributions/tontine/${tontineId}/bulk`, {
      method: 'POST',
      body: { contributions, contributionDate: contributionDate.value }
    })
    
    toast.add({
      title: 'Success',
      description: 'Contributions saved successfully',
      color: 'green'
    })
    
    await fetchContributions()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save contributions',
      color: 'red'
    })
  } finally {
    savingContributions.value = false
  }
}

const saveLoans = async () => {
  const { api } = useApi()
  try {
    savingLoans.value = true
    
    const loans = members.value.map(member => ({
      userId: member.id,
      amount: memberLoans.value[member.id].amount,
      repaymentPeriod: memberLoans.value[member.id].repaymentPeriod,
      status: memberLoans.value[member.id].status,
      notes: memberLoans.value[member.id].notes
    }))
    
    await api(`/v1/loans/tontine/${tontineId}/bulk`, {
      method: 'POST',
      body: { loans }
    })
    
    toast.add({
      title: 'Success',
      description: 'Loans saved successfully',
      color: 'green'
    })
    
    await fetchLoans()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to save loans',
      color: 'red'
    })
  } finally {
    savingLoans.value = false
  }
}

const addPenalty = async () => {
  const { api } = useApi()
  try {
    submittingPenalty.value = true
    
    await api('/v1/penalties', {
      method: 'POST',
      body: {
        userId: newPenalty.value.userId,
        tontineId: tontineId,
        amount: parseFloat(newPenalty.value.amount),
        reason: newPenalty.value.reason
      }
    })
    
    toast.add({
      title: 'Success',
      description: 'Penalty added successfully',
      color: 'green'
    })
    
    showPenaltyModal.value = false
    newPenalty.value = { userId: '', amount: '', reason: '' }
    await fetchPenalties()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to add penalty',
      color: 'red'
    })
  } finally {
    submittingPenalty.value = false
  }
}

const markPenaltyPaid = async (penalty) => {
  const { api } = useApi()
  try {
    await api(`/v1/penalties/${penalty.id}/status`, {
      method: 'PUT',
      body: { status: 'paid', notes: 'Marked as paid by admin' }
    })
    
    toast.add({
      title: 'Success',
      description: 'Penalty marked as paid',
      color: 'green'
    })
    
    await fetchPenalties()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to update penalty',
      color: 'red'
    })
  }
}

const deletePenalty = async (penalty) => {
  if (!confirm('Are you sure you want to delete this penalty?')) return
  
  const { api } = useApi()
  try {
    await api(`/v1/penalties/${penalty.id}`, { method: 'DELETE' })
    
    toast.add({
      title: 'Success',
      description: 'Penalty deleted successfully',
      color: 'green'
    })
    
    await fetchPenalties()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to delete penalty',
      color: 'red'
    })
  }
}
</script>
