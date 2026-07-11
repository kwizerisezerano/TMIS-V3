<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Overpayments</h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">Surplus per tontine waiting for your allocation</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" color="gray" variant="outline" class="dark:border-gray-600 dark:text-white">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
          Back to Dashboard
        </UButton>
      </div>

      <!-- Tontine Selection -->
      <UCard class="mb-8 border-0 shadow-md bg-white dark:bg-gray-800" v-if="!selectedTontine">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Tontine</h2>
          <div v-if="loadingTontines" class="text-center py-6 text-gray-500 dark:text-gray-400">Loading tontines...</div>
          <div v-else-if="userTontines.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">No tontines found.</div>
          <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="tontine in userTontines" :key="tontine.id"
                 @click="selectTontine(tontine)"
                 class="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 transition-colors">
              <div class="font-semibold text-gray-900 dark:text-white">{{ tontine.name }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ tontine.description }}</div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Tontine Selected View -->
      <template v-if="selectedTontine">
        <!-- Tontine header + change button -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedTontine.name }}</h2>
          <UButton @click="selectedTontine = null; surplusList = []" color="gray" variant="outline" size="sm" class="dark:border-gray-600 dark:text-white">
            Change Tontine
          </UButton>
        </div>

        <!-- Summary cards (filtered to selected tontine) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">RWF {{ pendingTotal.toLocaleString() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Allocation</div>
            </div>
          </UCard>
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">RWF {{ allocatedTotal.toLocaleString() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Allocated (Awaiting Use)</div>
            </div>
          </UCard>
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">RWF {{ usedTotal.toLocaleString() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Used</div>
            </div>
          </UCard>
        </div>

        <!-- Surplus List -->
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="p-4 sm:p-6">
            <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-gray-400">Loading surplus...</div>
            <div v-else-if="surplusList.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No overpayments found for {{ selectedTontine.name }}.
            </div>
            <div v-else class="space-y-4">
              <div v-for="item in surplusList" :key="item.id"
                   class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div class="font-semibold text-gray-900 dark:text-white">
                      RWF {{ parseFloat(item.amount).toLocaleString() }}
                      <span class="ml-2 text-xs px-2 py-0.5 rounded-full" :class="statusClass(item.status)">
                        {{ item.status }}
                      </span>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      From: <span class="capitalize font-medium">{{ item.source }}</span> #{{ item.source_id }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(item.created_at) }}</div>
                    <div v-if="item.destination" class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Allocated to: <span class="capitalize font-medium">{{ item.destination }}</span>
                      <span v-if="item.destination_id"> #{{ item.destination_id }}</span>
                      <span v-if="item.member_note"> · "{{ item.member_note }}"</span>
                    </div>
                  </div>
                  <UButton v-if="item.status === 'pending'" @click="openAllocate(item)" color="green" size="sm">
                    Allocate
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </template>

      <!-- Status Modal -->
      <StatusModal
        :show="statusModal.show"
        :type="statusModal.type"
        :title="statusModal.title"
        :message="statusModal.message"
        @close="statusModal.show = false"
        @action="statusModal.show = false"
      />

      <!-- Allocate Modal -->
      <UModal v-model="showModal">
        <UCard class="bg-white dark:bg-gray-800">
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Allocate Surplus — RWF {{ selected ? parseFloat(selected.amount).toLocaleString() : '' }}
            </h3>
          </template>
          <div class="space-y-4 p-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Use this surplus for</label>
              <select v-model="form.destination"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">-- Select --</option>
                <option value="contribution">Contribution</option>
                <option value="loan">Loan Payment</option>
                <option value="penalty">Penalty Payment</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ form.destination === 'contribution' ? 'Contribution ID (optional)' : form.destination === 'loan' ? 'Loan ID (optional)' : 'Penalty ID (optional)' }}
              </label>
              <input v-model="form.destination_id" type="number" placeholder="Leave blank to let accountant decide"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
              <input v-model="form.member_note" type="text" placeholder="e.g. Use for January contribution"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton @click="showModal = false" color="gray" variant="outline">Cancel</UButton>
              <UButton @click="submitAllocation" color="green" :loading="saving" :disabled="!form.destination">
                Confirm Allocation
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup>
const { user, initAuth } = useAuth()
const { api } = useApi()
const toast = useToast()

const statusModal = ref({ show: false, type: 'error', title: '', message: '' })
const showStatus = (type, title, message) => {
  statusModal.value = { show: true, type, title, message }
}

const loading = ref(false)
const loadingTontines = ref(true)
const saving = ref(false)
const surplusList = ref([])
const userTontines = ref([])
const selectedTontine = ref(null)
const showModal = ref(false)
const selected = ref(null)
const form = ref({ destination: '', destination_id: '', member_note: '' })

const pendingTotal = computed(() =>
  surplusList.value.filter(s => s.status === 'pending').reduce((sum, s) => sum + parseFloat(s.amount), 0)
)
const allocatedTotal = computed(() =>
  surplusList.value.filter(s => s.status === 'allocated').reduce((sum, s) => sum + parseFloat(s.amount), 0)
)
const usedTotal = computed(() =>
  surplusList.value.filter(s => s.status === 'used').reduce((sum, s) => sum + parseFloat(s.amount), 0)
)

onMounted(async () => {
  if (process.client) {
    initAuth()
    await fetchTontines()
  }
})

const fetchTontines = async () => {
  try {
    const res = await api('/v1/tontines', { params: { userId: user.value.id } })
    const data = res.data || res
    userTontines.value = Array.isArray(data) ? data : (data.data || [])
  } catch (err) {
    showStatus('error', 'Failed to Load', 'Could not load your tontines. Please refresh the page.')
  } finally {
    loadingTontines.value = false
  }
}

const selectTontine = async (tontine) => {
  selectedTontine.value = tontine
  surplusList.value = []
  await fetchSurplus()
}

const fetchSurplus = async () => {
  loading.value = true
  try {
    const res = await api('/v1/surplus/my', { params: { tontineId: selectedTontine.value.id } })
    surplusList.value = res.data || res || []
  } catch (err) {
    showStatus('error', 'Failed to Load', 'Could not load your surplus. Please try again.')
  } finally {
    loading.value = false
  }
}

const openAllocate = (item) => {
  selected.value = item
  form.value = { destination: '', destination_id: '', member_note: '' }
  showModal.value = true
}

const getApiMessage = (err, fallback) =>
  err?.data?.message || err?.response?._data?.message || err?.response?.data?.message || err?.message || fallback

const submitAllocation = async () => {
  if (!form.value.destination) return
  saving.value = true
  try {
    await api(`/v1/surplus/${selected.value.id}/allocate`, {
      method: 'PUT',
      body: {
        destination: form.value.destination,
        destination_id: form.value.destination_id ? parseInt(form.value.destination_id) : null,
        member_note: form.value.member_note || null
      }
    })
    showModal.value = false
    showStatus('success', 'Surplus Allocated', 'Your surplus has been allocated successfully. The accountant will apply it shortly.')
    await fetchSurplus()
  } catch (err) {
    const status = err?.statusCode || err?.response?.status
    const message = getApiMessage(err, 'Failed to allocate surplus. Please try again.')
    showModal.value = false
    showStatus(
      status === 400 ? 'error' : status === 404 ? 'warning' : 'error',
      status === 400 ? 'Invalid ID' : status === 404 ? 'Not Found' : 'Allocation Failed',
      message
    )
  } finally {
    saving.value = false
  }
}

const statusClass = (status) => {
  if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
  if (status === 'allocated') return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
  if (status === 'used') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
  return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

definePageMeta({ layout: 'default' })
</script>
