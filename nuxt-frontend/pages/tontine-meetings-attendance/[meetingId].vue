<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Mark Attendance</h1>
        <p v-if="meeting" class="text-gray-600 dark:text-gray-400">{{ meeting.title }} - {{ formatDate(meeting.meeting_date) }}</p>
      </div>
      <UButton @click="$router.back()" variant="outline">
        Back
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading attendance...</p>
    </div>

    <div v-else-if="attendance.length === 0" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">No members found.</p>
    </div>

    <div v-else>
      <div class="overflow-x-auto mb-6">
        <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="member in attendance" :key="member.user_id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ member.names }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ member.email }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <select 
                    v-model="member.status" 
                    class="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                  
                  <!-- Arrival time field - always visible -->
                  <input 
                    v-model="member.arrival_time" 
                    type="datetime-local" 
                    class="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                    placeholder="Arrival time"
                  />
                  
                  <!-- Excuse reason field - always visible -->
                  <input 
                    v-model="member.excuse_reason" 
                    type="text" 
                    class="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                    placeholder="Excuse reason"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end">
        <UButton @click="saveAttendance" color="green" :loading="saving">
          Save Attendance
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const { user, initAuth } = useAuth()
const meetingId = route.params.meetingId

const meeting = ref(null)
const members = ref([])
const attendance = ref([])
const loading = ref(true)
const saving = ref(false)

const fetchMeetingAndMembers = async () => {
  const { api } = useApi()
  try {
    // Fetch meeting details to get tontine_id
    const response = await api('/v1/meetings')
    const allMeetings = response.data?.meetings || []
    meeting.value = allMeetings.find(m => m.id == meetingId)
    
    if (!meeting.value) {
      console.error('Meeting not found')
      return
    }

    // Fetch all members of the tontine
    const membersResponse = await api(`/v1/members/tontine/${meeting.value.tontine_id}`)
    const membersData = membersResponse.data?.members || []
    members.value = membersData

    // Fetch existing attendance records if any
    try {
      const attendanceResponse = await api(`/v1/meetings/${meetingId}/attendance`)
      const existingAttendance = attendanceResponse.data || []
      
      // Build attendance list with all members
      attendance.value = members.value.map(member => {
        const existingRecord = existingAttendance.find(a => a.user_id === member.user_id)
        return {
          userId: member.user_id,
          user_id: member.user_id,
          names: member.names,
          email: member.email,
          status: existingRecord ? existingRecord.status : 'present',
          arrival_time: existingRecord ? existingRecord.arrival_time : '',
          excuse_reason: existingRecord ? existingRecord.excuse_reason || '' : '',
          penalty_applied: existingRecord ? existingRecord.penalty_applied : 0
        }
      })
    } catch (err) {
      // If no attendance records exist, create list with all members defaulting to present
      attendance.value = members.value.map(member => ({
        userId: member.user_id,
        user_id: member.user_id,
        names: member.names,
        email: member.email,
        status: 'present',
        arrival_time: '',
        excuse_reason: '',
        penalty_applied: 0
      }))
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}

const saveAttendance = async () => {
  saving.value = true
  const { api } = useApi()
  try {
    if (!user.value) {
      return
    }

    const attendancePayload = attendance.value.map(a => ({
      userId: a.userId,
      status: a.status,
      arrival_time: a.arrival_time || null,
      excuse_reason: a.excuse_reason || null
    }))
    
    await api(`/v1/meetings/${meetingId}/attendance`, {
      method: 'PUT',
      body: {
        attendance: attendancePayload,
        markedBy: user.value.id
      }
    })
    
    router.back()
  } catch (error) {
    console.error('Error saving attendance:', error)
  } finally {
    saving.value = false
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

onMounted(() => {
  initAuth()
  fetchMeetingAndMembers()
})
</script>
