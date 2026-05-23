<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Meetings Management</h1>
        <p v-if="tontine" class="text-gray-600 dark:text-gray-400">{{ tontine.name }}</p>
      </div>
      <UButton @click="showCreateModal = true" color="primary">
        Schedule Meeting
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading meetings...</p>
    </div>

    <div v-else-if="meetings.length === 0" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">No meetings scheduled.</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Agenda</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date & Time</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Scheduled By</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="meeting in meetings" :key="meeting.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900 dark:text-gray-100">{{ meeting.title }}</div>
              <p v-if="meeting.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ meeting.description }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
              <div v-if="meeting.agenda" class="truncate" :title="meeting.agenda">{{ meeting.agenda }}</div>
              <span v-else class="text-gray-400 dark:text-gray-500 italic">No agenda</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
              {{ formatDate(meeting.meeting_date) }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
              {{ meeting.location }}
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 rounded text-xs" :class="getStatusClass(meeting.status)">
                {{ meeting.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
              {{ meeting.created_by_name || 'Admin' }}
            </td>
            <td class="px-6 py-4">
              <UButton 
                v-if="meeting.status === 'scheduled'" 
                @click="markAttendance(meeting)" 
                size="xs" 
                color="green"
              >
                Attendance
              </UButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Meeting Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Schedule New Meeting</h3>
        </template>
        
        <form @submit.prevent="createMeeting" class="space-y-4">
          <UFormGroup label="Title" required>
            <UInput v-model="newMeeting.title" placeholder="Meeting title" />
          </UFormGroup>
          
          <UFormGroup label="Description">
            <UTextarea v-model="newMeeting.description" placeholder="Meeting description" />
          </UFormGroup>
          
          <UFormGroup label="Agenda" required>
            <UTextarea v-model="newMeeting.agenda" placeholder="Enter meeting agenda (topics to discuss)" rows="4" />
          </UFormGroup>
          
          <UFormGroup label="Date & Time" required>
            <UInput v-model="newMeeting.meetingDate" type="datetime-local" :min="minDateTime" />
          </UFormGroup>
          
          <UFormGroup label="Location" required>
            <UInput v-model="newMeeting.location" placeholder="Meeting location" />
          </UFormGroup>
          
          <div class="flex justify-end gap-2">
            <UButton type="button" color="gray" @click="showCreateModal = false">
              Cancel
            </UButton>
            <UButton type="submit" color="primary" :loading="creating">
              Schedule Meeting
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const route = useRoute()
const { user, initAuth } = useAuth()
const tontineId = route.params.tontineId

const meetings = ref([])
const tontine = ref(null)
const loading = ref(true)
const creating = ref(false)
const showCreateModal = ref(false)

const newMeeting = ref({
  title: '',
  description: '',
  agenda: '',
  meetingDate: '',
  location: ''
})

// Set minimum date to current date/time
const minDateTime = computed(() => {
  const now = new Date()
  return now.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
})

const fetchTontine = async () => {
  const { api } = useApi()
  try {
    tontine.value = await api(`/v1/tontines/${tontineId}`)
  } catch (error) {
    console.error('Error fetching tontine:', error)
  }
}

const fetchMeetings = async () => {
  const { api } = useApi()
  try {
    const response = await api(`/v1/meetings/tontine/${tontineId}`)
    // Handle different response structures
    if (Array.isArray(response)) {
      meetings.value = response.filter(m => m && m.id)
    } else if (response && response.data) {
      // Backend returns { success: true, data: { meetings: [...], pagination: {...} } }
      const data = response.data
      if (data.meetings && Array.isArray(data.meetings)) {
        meetings.value = data.meetings.filter(m => m && m.id)
      } else if (Array.isArray(data)) {
        meetings.value = data.filter(m => m && m.id)
      } else {
        meetings.value = []
      }
    } else if (response && response.meetings) {
      meetings.value = Array.isArray(response.meetings) ? response.meetings.filter(m => m && m.id) : []
    } else {
      meetings.value = []
    }
  } catch (error) {
    console.error('Error fetching meetings:', error)
    meetings.value = []
  } finally {
    loading.value = false
  }
}

const createMeeting = async () => {
  creating.value = true
  const { api } = useApi()
  try {
    if (!user.value) {
      return
    }

    await api('/v1/meetings', {
      method: 'POST',
      body: {
        tontineId: parseInt(tontineId),
        title: newMeeting.value.title,
        description: newMeeting.value.description,
        agenda: newMeeting.value.agenda,
        meetingDate: newMeeting.value.meetingDate,
        location: newMeeting.value.location,
        createdBy: user.value.id
      }
    })
    
    showCreateModal.value = false
    newMeeting.value = { title: '', description: '', agenda: '', meetingDate: '', location: '' }
    await fetchMeetings()
  } catch (error) {
    console.error('Error creating meeting:', error)
  } finally {
    creating.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const markAttendance = (meeting) => {
  navigateTo(`/tontine-meetings-attendance/${meeting.id}`)
}

onMounted(() => {
  initAuth()
  fetchTontine()
  fetchMeetings()
})
</script>
