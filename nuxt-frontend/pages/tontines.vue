  <template>
  <div class="min-h-screen bg-white">
    <div>
      <PageHeader 
        title="Tontines" 
        :description="isAdmin ? 'Browse and manage tontines' : 'Browse available tontines'"
      >
        <template #actions>
          <NuxtLink v-if="isAdmin" to="/tontines-dashboard" class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 mr-2">
            <Icon name="i-heroicons-building-office-2" class="w-4 h-4 mr-1" />
            All Tontines
          </NuxtLink>
          <ActionButton 
            v-if="isAdmin" 
            @click="openModal('create')" 
            icon="i-heroicons-building-library"
          >
            Create Branch
          </ActionButton>
        </template>
      </PageHeader>

      <!-- Search and Filters -->
      <DataTable 
        :data="tontines"
        :columns="tableColumns"
        :loading="loading"
        search-placeholder="Search tontines..."
        loading-text="Loading tontines..."
        item-name="tontines"
        :filters="statusFilters"
      >
        <template #name="{ item }">
          <div class="text-sm font-medium text-green-600">{{ item.name }}</div>
        </template>

        <template #type="{ item }">
          <div class="flex items-center gap-1">
            <UBadge v-if="item.tontine_type === 'main'" color="emerald" size="xs" variant="solid">
              <Icon name="i-heroicons-building-office" class="w-3 h-3" />
              Main
            </UBadge>
            <UBadge v-else-if="item.tontine_type === 'branch'" color="blue" size="xs" variant="subtle">
              <Icon name="i-heroicons-building-library" class="w-3 h-3" />
              Branch
            </UBadge>
            <span v-if="item.parent_tontine_name" class="text-xs text-gray-500 ml-1">
              of {{ item.parent_tontine_name }}
            </span>
          </div>
        </template>

        <template #contribution_amount="{ item }">
          <div class="text-sm font-medium text-gray-900">RWF {{ Number(item.contribution_amount).toLocaleString() }}</div>
          <div class="text-xs text-gray-500">Monthly</div>
        </template>
        
        <template #members="{ item }">
          <div class="text-sm text-gray-900">{{ item.member_count || 0 }}/{{ item.max_members }}</div>
        </template>
        
        <template #total_contributions="{ item }">
          <div class="text-sm text-gray-900">RWF {{ Number(item.total_contributions || 0).toLocaleString() }}</div>
        </template>
        
        <template #status="{ item }">
          <StatusBadge :status="item.status" />
        </template>
        
        <template #actions="{ item }">
          <div class="flex items-center gap-2">
            <!-- Join button for non-members (always visible) -->
            <button 
              v-if="!isMember(item.id) && item.member_count < item.max_members && item.status === 'active'" 
              @click="showJoinModal(item)" 
              type="button" 
              class="text-emerald-600 hover:text-emerald-900 font-medium cursor-pointer text-sm"
            >
              Join
            </button>
            
            <!-- Joined badge -->
            <span v-if="isMember(item.id)" class="text-green-600 text-sm font-medium">
              ✓ Joined
            </span>
            
            <!-- Three-dots action menu for admins -->
            <UDropdown v-if="isAdmin" :items="getTontineActions(item)" :popper="{ placement: 'bottom-end' }">
              <UButton color="gray" variant="ghost" size="xs">
                <UIcon name="i-heroicons-ellipsis-vertical" class="w-4 h-4" />
              </UButton>
            </UDropdown>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Tontine Modal (Create/Edit/Delete) -->
    <TontineModal 
      v-model="showModal" 
      :mode="modalMode" 
      :tontine="selectedTontine" 
      :loading="modalLoading"
      :error="modalError"
      :success="modalSuccess"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <!-- Join Confirmation Modal -->
    <UModal v-model="showJoinConfirm">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-green-600">Join Tontine</h3>
        </template>
        
        <div class="space-y-4">
          <div class="text-center">
            <div class="text-4xl mb-4"></div>
            <h4 class="text-lg font-medium text-gray-900">{{ selectedTontine?.name }}</h4>
            <p class="text-gray-600 mt-2">Are you sure you want to join this tontine?</p>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-green-800">Monthly Contribution:</span>
                <div class="text-green-600">RWF {{ Number(selectedTontine?.contribution_amount || 0).toLocaleString() }}</div>
              </div>
              <div>
                <span class="font-medium text-green-800">Members:</span>
                <div class="text-green-600">{{ selectedTontine?.member_count || 0 }}/{{ selectedTontine?.max_members }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showJoinConfirm = false" variant="outline">Cancel</UButton>
            <UButton @click="confirmJoin" color="green" :loading="joinLoading">
              Yes, Join Tontine
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

  </div>
</template>

<script setup>
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 6
const showCreateModal = ref(false)
const showModal = ref(false)
const modalMode = ref('create')
const modalLoading = ref(false)
const modalError = ref('')
const modalSuccess = ref('')
let modalCloseTimer = null

const tableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'contribution_amount', label: 'Contribution' },
  { key: 'members', label: 'Members' },
  { key: 'total_contributions', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' }
]

const statusFilters = [
  { label: 'All Status', value: '', filterFn: null },
  { label: 'Active', value: 'active', filterFn: (item) => item.status === 'active' },
  { label: 'Inactive', value: 'inactive', filterFn: (item) => item.status === 'inactive' }
]
const loading = ref(true)
const tontines = ref([])
const user = ref(null)
const userTontines = ref([])
const showJoinConfirm = ref(false)
const selectedTontine = ref(null)
const joinLoading = ref(false)


const isAdmin = computed(() => {
  return user.value?.role === 'admin' || user.value?.role === 'president' || user.value?.role === 'accountant'
})

const isAdminOrPresident = computed(() => {
  return user.value?.role === 'admin' || user.value?.role === 'president'
})

onMounted(async () => {
  if (process.client) {
    const { initAuth } = useAuth()
    
    // Ensure auth is initialized from localStorage (loads access token)
    initAuth()
    
    // Small delay to ensure token is loaded
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await fetchTontines()
      await fetchUserTontines()
    }
  }
})

const fetchTontines = async () => {
  const { api } = useApi()
  try {
    const params = { limit: 100 }

    // Admins see ALL tontines (active + inactive)
    // Members see only active tontines for joining
    if (!isAdmin.value) {
      params.status = 'active'
    }

    const response = await api('/v1/tontines', { params })
    // API returns { status, success, message, data }
    const data = response.data || response
    // Data may be paginated with .data array or direct array
    tontines.value = Array.isArray(data) ? data : (data.data || [])
  } catch (error) {
    console.error('Failed to fetch tontines:', error)
    tontines.value = []
  } finally {
    loading.value = false
  }
}

const fetchUserTontines = async () => {
  const { api } = useApi()
  try {
    // Fetch user's joined tontines with userId parameter
    const response = await api('/v1/tontines', { 
      params: { 
        userId: user.value.id,
        limit: 100 // Get all user's tontines
      } 
    })
    const data = response.data || response
    // Handle paginated response
    if (data.data && Array.isArray(data.data)) {
      userTontines.value = data.data
    } else if (Array.isArray(data)) {
      userTontines.value = data
    } else {
      userTontines.value = []
    }
  } catch (error) {
    console.error('Failed to fetch user tontines:', error)
    userTontines.value = []
  }
}

const isMember = (tontineId) => {
  return userTontines.value.some(t => t.id === tontineId)
}

const openModal = (mode, tontine = null) => {
  if (modalCloseTimer) {
    clearTimeout(modalCloseTimer)
    modalCloseTimer = null
  }
  modalMode.value = mode
  selectedTontine.value = tontine
  modalError.value = ''
  modalSuccess.value = ''
  showModal.value = true
}

const handleModalConfirm = async (formData) => {
  modalLoading.value = true
  modalError.value = ''
  modalSuccess.value = ''
  
  try {
    const { api } = useApi()
    const isDelete = modalMode.value === 'delete'
    const isEdit = modalMode.value === 'edit'
    
    if (isDelete) {
      await api(`/v1/tontines/${selectedTontine.value.id}`, { method: 'DELETE' })

      modalSuccess.value = `${selectedTontine.value.name} has been deleted successfully.`

      modalCloseTimer = setTimeout(() => {
        showModal.value = false
        modalSuccess.value = ''
        selectedTontine.value = null
        modalCloseTimer = null
        fetchTontines()
      }, 2000)
    } else {
      await api(isEdit ? `/v1/tontines/${selectedTontine.value.id}` : '/v1/tontines', {
        method: isEdit ? 'PUT' : 'POST',
        body: {
          ...formData,
          creator_id: user.value.id
        }
      })

      const tontineName = formData.name || selectedTontine.value?.name || 'Tontine'
      modalSuccess.value = isEdit
        ? `${tontineName} has been updated successfully.`
        : `${tontineName} has been created successfully.`

      modalCloseTimer = setTimeout(() => {
        showModal.value = false
        modalSuccess.value = ''
        selectedTontine.value = null
        modalCloseTimer = null
        fetchTontines()
      }, 2000)
    }
  } catch (error) {
    const errorMessage = error?.data?.message || error?.message || 'Failed to complete operation'
    modalError.value = errorMessage.includes('creator_id')
      ? 'A tontine with this name already exists. Please choose a different name.'
      : errorMessage
  } finally {
    modalLoading.value = false
  }
}

const handleModalCancel = () => {
  if (modalCloseTimer) {
    clearTimeout(modalCloseTimer)
    modalCloseTimer = null
  }
  modalError.value = ''
  modalSuccess.value = ''
  showModal.value = false
}

const showJoinModal = (tontine) => {
  selectedTontine.value = tontine
  showJoinConfirm.value = true
}

const confirmJoin = async () => {
  joinLoading.value = true
  
  const { api } = useApi()
  
  try {
    // TODO: Backend endpoint /api/v1/tontines/:id/join does not exist
    // Using /api/v1/members/tontine/:tontineId/join as alternative
    await api(`/v1/members/tontine/${selectedTontine.value.id}/join`, {
      method: 'POST',
      body: { userId: user.value.id }
    })
    
    const toast = useToast()
    toast.add({
      title: '✅ Join Request Sent!',
      description: 'Your request to join the tontine has been submitted',
      color: 'green'
    })
    
    showJoinConfirm.value = false
    await fetchUserTontines()
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Join Failed',
      description: error.data?.message || 'Failed to join tontine',
      color: 'red'
    })
  } finally {
    joinLoading.value = false
  }
}

const viewTontine = (tontineId) => {
  navigateTo(`/tontine-dashboard/${tontineId}`)
}

const viewTontineReport = (tontineId) => {
  const router = useRouter()
  router.push(`/reports?tontine=${tontineId}`)
}

const manageTontine = (tontineId) => {
  const router = useRouter()
  router.push(`/manage?tontine=${tontineId}&tab=members`)
}

const manageMeetings = (tontineId) => {
  const router = useRouter()
  router.push(`/tontine-meetings/${tontineId}`)
}

const managePenalties = (tontineId) => {
  const router = useRouter()
  router.push(`/manage?tontine=${tontineId}&tab=penalties`)
}

const recordContributions = (tontineId) => {
  const router = useRouter()
  router.push(`/tontine-contributions-record/${tontineId}`)
}

const recordLoanPayments = (tontineId) => {
  const router = useRouter()
  router.push(`/tontine-loan-payments-record/${tontineId}`)
}

const recordPenaltyPayments = (tontineId) => {
  const router = useRouter()
  router.push(`/tontine-penalty-payments-record/${tontineId}`)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const getTontineActions = (item) => {
  const actions = []
  
  // View Actions Group
  const viewActions = [
    {
      label: 'View Details',
      icon: 'i-heroicons-eye',
      click: () => viewTontine(item.id)
    },
    {
      label: 'View Reports',
      icon: 'i-heroicons-chart-bar',
      click: () => viewTontineReport(item.id)
    }
  ]
  actions.push(viewActions)
  
  // Manage Actions Group
  const manageActions = [
    {
      label: 'Manage Tontine',
      icon: 'i-heroicons-cog-6-tooth',
      click: () => manageTontine(item.id)
    }
  ]

  // Only admin and president can see Meetings
  if (isAdminOrPresident.value) {
    manageActions.push({
      label: 'Meetings',
      icon: 'i-heroicons-calendar',
      click: () => manageMeetings(item.id)
    })
  }
  
  // Only accountants can see recording options
  if (user.value?.role === 'accountant') {
    manageActions.push({
      label: 'Record Contributions',
      icon: 'i-heroicons-pencil-square',
      click: () => recordContributions(item.id)
    })
    manageActions.push({
      label: 'Record Loan Payments',
      icon: 'i-heroicons-credit-card',
      click: () => recordLoanPayments(item.id)
    })
    manageActions.push({
      label: 'Record Penalty Payments',
      icon: 'i-heroicons-exclamation-circle',
      click: () => recordPenaltyPayments(item.id)
    })
  }
  
  actions.push(manageActions)
  
  // Status Actions Group
  const statusActions = []
  if (item.status === 'inactive') {
    statusActions.push({
      label: 'Activate',
      icon: 'i-heroicons-play',
      click: () => activateTontine(item.id)
    })
  } else if (item.status === 'active') {
    statusActions.push({
      label: 'Deactivate',
      icon: 'i-heroicons-pause',
      click: () => deactivateTontine(item.id)
    })
  }
  statusActions.push({
    label: 'Edit',
    icon: 'i-heroicons-pencil',
    click: () => openModal('edit', item)
  })
  actions.push(statusActions)
  
  // Delete Actions Group
  actions.push([{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    click: () => openModal('delete', item),
    class: 'text-red-600'
  }])
  
  return actions
}

const activateTontine = async (id) => {
  const { api } = useApi()
  try {
    // TODO: Backend endpoint /api/v1/tontines/:id/status does not exist
    // Using /api/v1/tontines/:id with PUT as alternative
    await api(`/v1/tontines/${id}`, {
      method: 'PUT',
      body: { status: 'active', userId: user.value?.id }
    })
    
    const toast = useToast()
    toast.add({
      title: '✅ Tontine Activated!',
      description: 'Tontine has been activated successfully',
      color: 'green'
    })
    
    await fetchTontines()
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Activation Failed',
      description: 'Failed to activate tontine',
      color: 'red'
    })
  }
}

const deactivateTontine = async (id) => {
  const { api } = useApi()
  try {
    // TODO: Backend endpoint /api/v1/tontines/:id/status does not exist
    // Using /api/v1/tontines/:id with PUT as alternative
    await api(`/v1/tontines/${id}`, {
      method: 'PUT',
      body: { status: 'inactive', userId: user.value?.id }
    })
    
    const toast = useToast()
    toast.add({
      title: '✅ Tontine Deactivated!',
      description: 'Tontine has been deactivated successfully',
      color: 'green'
    })
    
    await fetchTontines()
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Deactivation Failed',
      description: 'Failed to deactivate tontine',
      color: 'red'
    })
  }
}

definePageMeta({
  layout: 'default'
})
</script>
