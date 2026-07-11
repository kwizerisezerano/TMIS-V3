<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Overpayments</h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">Full history of your surplus — where it came from, where it went</p>
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
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedTontine.name }}</h2>
          <UButton @click="selectedTontine = null; surplusList = []" color="gray" variant="outline" size="sm" class="dark:border-gray-600 dark:text-white">
            Change Tontine
          </UButton>
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">RWF {{ pendingTotal.toLocaleString() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending — needs your allocation</div>
            </div>
          </UCard>
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">RWF {{ allocatedTotal.toLocaleString() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Allocated — waiting for accountant</div>
            </div>
          </UCard>
          <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
            <div class="text-center p-4">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">RWF {{ usedTotal.toLocaleString() }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Used — applied to payments</div>
            </div>
          </UCard>
        </div>

        <!-- Pending alert -->
        <div v-if="pendingTotal > 0" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <div class="font-semibold text-yellow-800 dark:text-yellow-300">You have RWF {{ pendingTotal.toLocaleString() }} unallocated</div>
            <div class="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">Allocate it below so the accountant knows where to apply it — contribution, loan, or penalty.</div>
          </div>
        </div>

        <!-- Surplus Timeline -->
        <UCard class="border-0 shadow-md bg-white dark:bg-gray-800">
          <div class="p-4 sm:p-6">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Surplus History</h3>
            <div v-if="loading" class="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            <div v-else-if="surplusList.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No overpayments found for {{ selectedTontine.name }}.
            </div>
            <div v-else class="space-y-4">
              <div v-for="item in surplusList" :key="item.id"
                   class="p-4 rounded-xl border"
                   :class="item.status === 'used' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                         : item.status === 'allocated' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                         : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'">

                <!-- Row 1: amount + status + date -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-bold text-gray-900 dark:text-white">RWF {{ parseFloat(item.amount).toLocaleString() }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusClass(item.status)">{{ item.status }}</span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(item.created_at) }}</span>
                </div>

                <!-- Row 2: source -->
                <div class="mt-2 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <UIcon name="i-heroicons-arrow-up-circle" class="w-4 h-4 text-gray-400" />
                  <span>Came from: <span class="font-medium capitalize text-gray-800 dark:text-gray-200">{{ item.source }}</span> #{{ item.source_id }}</span>
                </div>

                <!-- Row 3: allocation info -->
                <div v-if="item.destination" class="mt-1 flex items-center gap-1 text-sm text-blue-700 dark:text-blue-400">
                  <UIcon name="i-heroicons-arrow-right-circle" class="w-4 h-4" />
                  <span>Allocated to: <span class="font-medium capitalize">{{ item.destination }}</span>
                    <span v-if="item.destination_id"> #{{ item.destination_id }}</span>
                    <span v-if="item.member_note" class="text-gray-500 dark:text-gray-400"> · "{{ item.member_note }}"</span>
                  </span>
                </div>

                <!-- Row 4: used info -->
                <div v-if="item.status === 'used'" class="mt-1 flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                  <span>Applied by accountant — fully consumed</span>
                </div>

                <!-- Row 5: timeline steps -->
                <div class="mt-3 flex items-center gap-2 text-xs">
                  <span class="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">1. Overpaid</span>
                  <span class="text-gray-400">→</span>
                  <span class="px-2 py-0.5 rounded font-medium"
                        :class="['allocated','used'].includes(item.status) ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'">
                    2. You allocated
                  </span>
                  <span class="text-gray-400">→</span>
                  <span class="px-2 py-0.5 rounded font-medium"
                        :class="item.status === 'used' ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'">
                    3. Accountant applied
                  </span>
                </div>

                <!-- Allocate button -->
                <div v-if="item.status === 'pending'" class="mt-3">
                  <UButton @click="openAllocate(item)" color="yellow" size="sm" variant="solid">
                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 mr-1" />
                    Allocate this surplus
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
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
              Tell the accountant what to apply this surplus to. They will use it automatically when recording your next payment.
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apply to</label>
              <select v-model="form.destination"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">-- Select --</option>
                <option value="contribution">Contribution (monthly savings)</option>
                <option value="loan">Loan repayment</option>
                <option value="penalty">Penalty payment</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Specific ID <span class="text-gray-400 font-normal">(optional — leave blank to let accountant decide)</span>
              </label>
              <input v-model="form.destination_id" type="number" placeholder="e.g. 12"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note to accountant <span class="text-gray-400 font-normal">(optional)</span></label>
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

const statusModal = ref({ show: false, type: 'error', title: '', message: '' })
const showStatus = (type, title, message) => { statusModal.value = { show: true, type, title, message } }

const loading = ref(false)
const loadingTontines = ref(true)
const saving = ref(false)
const surplusList = ref([])
const userTontines = ref([])
const selectedTontine = ref(null)
const showModal = ref(false)
const selected = ref(null)
const form = ref({ destination: '', destination_id: '', member_note: '' })

const pendingTotal = computed(() => surplusList.value.filter(s => s.status === 'pending').reduce((sum, s) => sum + parseFloat(s.amount), 0))
const allocatedTotal = computed(() => surplusList.value.filter(s => s.status === 'allocated').reduce((sum, s) => sum + parseFloat(s.amount), 0))
const usedTotal = computed(() => surplusList.value.filter(s => s.status === 'used').reduce((sum, s) => sum + parseFloat(s.amount), 0))

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
    showStatus('error', 'Failed to Load', 'Could not load your tontines. Please refresh.')
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
  err?.data?.message || err?.response?._data?.message || err?.message || fallback

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
    showStatus('success', 'Surplus Allocated', 'Your surplus has been allocated. The accountant will apply it when recording your next payment.')
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
