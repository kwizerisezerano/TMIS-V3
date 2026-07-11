<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Surplus Overview</h1>
        <p class="text-gray-600 mt-1">Per-member surplus breakdown for this tontine</p>
      </div>
      <UButton @click="navigateTo('/tontines')" color="gray" variant="outline">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
        Back
      </UButton>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard class="border-0 shadow-sm">
        <div class="text-center p-4">
          <div class="text-2xl font-bold text-yellow-600">RWF {{ totals.pending.toLocaleString() }}</div>
          <div class="text-sm text-gray-500 mt-1">Pending Allocation</div>
          <div class="text-xs text-gray-400">Members haven't allocated yet</div>
        </div>
      </UCard>
      <UCard class="border-0 shadow-sm">
        <div class="text-center p-4">
          <div class="text-2xl font-bold text-blue-600">RWF {{ totals.allocated.toLocaleString() }}</div>
          <div class="text-sm text-gray-500 mt-1">Allocated — Ready to Apply</div>
          <div class="text-xs text-gray-400">Will be used on next recording</div>
        </div>
      </UCard>
      <UCard class="border-0 shadow-sm">
        <div class="text-center p-4">
          <div class="text-2xl font-bold text-green-600">RWF {{ totals.used.toLocaleString() }}</div>
          <div class="text-sm text-gray-500 mt-1">Used</div>
          <div class="text-xs text-gray-400">Already applied to payments</div>
        </div>
      </UCard>
    </div>

    <!-- Per-member breakdown -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Per-Member Surplus Breakdown</h3>
      </template>

      <div v-if="loading" class="text-center py-8 text-gray-500">Loading surplus...</div>
      <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
      <div v-else-if="members.length === 0" class="text-center py-8 text-gray-500">No surplus records found.</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocated</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="member in members" :key="member.user_id">
              <tr class="hover:bg-gray-50 cursor-pointer" @click="toggleExpand(member.user_id)">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ member.user_name }}</td>
                <td class="px-4 py-3 text-sm">
                  <span v-if="member.pending > 0" class="text-yellow-700 font-semibold">RWF {{ member.pending.toLocaleString() }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-sm">
                  <span v-if="member.allocated > 0" class="text-blue-700 font-semibold">RWF {{ member.allocated.toLocaleString() }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-sm">
                  <span v-if="member.used > 0" class="text-green-700 font-semibold">RWF {{ member.used.toLocaleString() }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-sm text-blue-600">
                  {{ expanded === member.user_id ? '▲ Hide' : '▼ Show' }}
                </td>
              </tr>
              <template v-if="expanded === member.user_id">
                <tr v-for="row in member.rows" :key="row.id">
                  <td colspan="5" class="px-6 py-2 bg-gray-50">
                    <div class="flex flex-wrap items-center gap-3 text-xs text-gray-700">
                      <span class="px-2 py-0.5 rounded-full font-medium" :class="statusClass(row.status)">{{ row.status }}</span>
                      <span>RWF {{ parseFloat(row.amount).toLocaleString() }}</span>
                      <span class="text-gray-500">From: <span class="capitalize font-medium">{{ row.source }}</span> #{{ row.source_id }}</span>
                      <span v-if="row.destination" class="text-blue-600">to <span class="capitalize">{{ row.destination }}</span><span v-if="row.destination_id"> #{{ row.destination_id }}</span></span>
                      <span v-if="row.member_note" class="text-gray-500 italic">"{{ row.member_note }}"</span>
                      <span v-if="row.status === 'used'" class="text-green-600 font-medium">Applied</span>
                      <span class="text-gray-400 ml-auto">{{ formatDate(row.created_at) }}</span>
                    </div>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'accountant', layout: 'default' })

const route = useRoute()
const { api } = useApi()

const tontineId = route.params.tontineId
const loading = ref(false)
const members = ref([])
const expanded = ref(null)

const totals = computed(() => {
  const t = { pending: 0, allocated: 0, used: 0 }
  for (const m of members.value) {
    t.pending += m.pending || 0
    t.allocated += m.allocated || 0
    t.used += m.used || 0
  }
  return t
})

const error = ref('')

const fetchSummary = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api(`/v1/surplus/summary/${tontineId}`)
    const data = res?.data ?? res
    members.value = data?.members || []
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Failed to load surplus'
    members.value = []
  } finally {
    loading.value = false
  }
}

const toggleExpand = (userId) => {
  expanded.value = expanded.value === userId ? null : userId
}

const statusClass = (status) => {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
  if (status === 'allocated') return 'bg-blue-100 text-blue-700'
  if (status === 'used') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

onMounted(fetchSummary)
</script>
