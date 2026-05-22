<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-green-600">ID Number</h1>
          <p class="text-gray-600">Add or update your national ID number</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline">
          Back to Dashboard
        </UButton>
      </div>

      <!-- ID Number Form -->
      <UCard class="border-0 shadow-lg mb-6">
        <div class="p-6">
          <form @submit.prevent="updateIdNumber" class="space-y-6">
            <!-- ID Number -->
            <UFormGroup label="National ID Number" required>
              <UInput 
                v-model="idNumber" 
                placeholder="Enter your 16-digit ID number"
                size="lg"
                :disabled="hasIdNumber || loading"
                :class="hasIdNumber ? 'bg-gray-50' : ''"
                maxlength="16"
              />
              <template #help>
                <p v-if="hasIdNumber" class="text-xs text-green-600">✓ ID number verified and cannot be changed</p>
                <p v-else class="text-xs text-gray-500">Enter your 16-digit national ID number (cannot be changed once added)</p>
              </template>
            </UFormGroup>

            <!-- Save Button -->
            <div class="flex justify-end">
              <UButton 
                type="submit" 
                color="green" 
                size="lg"
                :loading="loading"
                :disabled="hasIdNumber || !idNumber || idNumber.length !== 16"
              >
                {{ hasIdNumber ? 'ID Number Added' : 'Add ID Number' }}
              </UButton>
            </div>
          </form>
        </div>
      </UCard>

      <!-- Join Active Tontines Section (Members Only) -->
      <UCard v-if="!isAdmin" class="border-0 shadow-lg mb-6">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Join Active Tontines</h2>
          <div v-if="activeTontines.length === 0" class="text-center py-8">
            <p class="text-gray-500">No active tontines available to join at the moment.</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="tontine in activeTontines" :key="tontine.id" class="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h3 class="font-semibold text-blue-800">{{ tontine.name }}</h3>
                <p class="text-sm text-blue-600">Contribution: RWF {{ tontine.contribution_amount?.toLocaleString() }}</p>
                <p class="text-sm text-blue-600">Members: {{ tontine.current_members || 0 }}/{{ tontine.max_members }}</p>
              </div>
              <UButton 
                v-if="!joinedTontines.has(tontine.id)"
                color="blue" 
                size="sm"
                :loading="joiningTontine === tontine.id"
                @click.prevent.stop="joinTontine(tontine.id)"
              >
                Join
              </UButton>
              <UBadge v-else color="green" size="sm">
                Joined ✓
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Admin Section -->
      <UCard v-if="isAdmin" class="border-0 shadow-lg mb-6">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-red-600 mb-4">Admin: Add New Member</h2>
          <form @submit.prevent="registerNewUser" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormGroup label="Full Names" required>
                <UInput v-model="newUser.names" placeholder="Enter full names" size="lg" />
              </UFormGroup>
              <UFormGroup label="Email" required>
                <UInput v-model="newUser.email" type="email" placeholder="Enter email" size="lg" />
              </UFormGroup>
              <UFormGroup label="Phone" required>
                <UInput v-model="newUser.phone" placeholder="Enter phone number" size="lg" />
              </UFormGroup>
              <UFormGroup label="Password" required>
                <UInput v-model="newUser.password" type="password" placeholder="Enter password" size="lg" />
              </UFormGroup>
            </div>
            <UFormGroup label="Role">
              <USelect v-model="newUser.role" :options="roleOptions" size="lg" />
            </UFormGroup>
            <div class="flex justify-end">
              <UButton 
                type="submit" 
                color="red" 
                size="lg"
                :loading="registerLoading"
                :disabled="!newUser.names.trim() || !newUser.email.trim() || !newUser.phone.trim() || !newUser.password.trim()"
              >
                Register New Member
              </UButton>
            </div>
          </form>
        </div>
      </UCard>

      <!-- Validation Error Modal -->
      <UModal v-model="showValidationModal">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span class="text-red-600 text-lg">⚠️</span>
              </div>
              <h3 class="text-lg font-semibold text-red-600">Validation Error</h3>
            </div>
          </template>
          
          <div class="p-4">
            <p class="text-gray-700 mb-4">Please correct the following validation errors:</p>
            <div class="bg-red-50 p-3 rounded-lg border border-red-300">
              <ul class="text-sm text-red-800 space-y-1">
                <li v-for="error in validationErrors" :key="error" class="flex items-start gap-2">
                  <span class="text-red-600 mt-0.5">•</span>
                  <span>{{ error }}</span>
                </li>
              </ul>
            </div>
            <p class="text-sm text-gray-600 mt-3">Please fix these issues and try again.</p>
          </div>
          
          <template #footer>
            <div class="flex justify-end">
              <UButton color="red" @click="showValidationModal = false">Close</UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Success Modal -->
      <UModal v-model="showSuccessModal">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span class="text-green-600 text-lg">✅</span>
              </div>
              <h3 class="text-lg font-semibold text-green-600">Registration Successful</h3>
            </div>
          </template>
          
          <div class="p-4">
            <p class="text-gray-700 mb-4">New member has been successfully registered!</p>
            <div class="bg-green-50 p-3 rounded-lg border border-green-200">
              <p class="text-sm text-green-700"><strong>Name:</strong> {{ successUserInfo.names }}</p>
              <p class="text-sm text-green-700"><strong>Email:</strong> {{ successUserInfo.email }}</p>
              <p class="text-sm text-green-700"><strong>Phone:</strong> {{ successUserInfo.phone }}</p>
              <p class="text-sm text-green-700"><strong>Role:</strong> {{ successUserInfo.role }}</p>
            </div>
            <p class="text-sm text-gray-600 mt-3">✉️ Welcome email with login credentials has been sent to the new member.</p>
          </div>
          
          <template #footer>
            <div class="flex justify-end">
              <UButton color="green" @click="showSuccessModal = false">Close</UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- User Exists Modal -->
      <UModal v-model="showUserExistsModal">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span class="text-red-600 text-lg">⚠️</span>
              </div>
              <h3 class="text-lg font-semibold text-red-600">User Already Exists</h3>
            </div>
          </template>
          
          <div class="p-4">
            <p class="text-gray-700 mb-4">A user with this email or phone number already exists in the system.</p>
            <div class="bg-red-50 p-3 rounded-lg border border-red-200">
              <p class="text-sm text-red-700"><strong>Email:</strong> {{ duplicateUserInfo.email }}</p>
              <p class="text-sm text-red-700"><strong>Phone:</strong> {{ duplicateUserInfo.phone }}</p>
            </div>
            <p class="text-sm text-gray-600 mt-3">Please use different email and phone number to register a new member.</p>
          </div>
          
          <template #footer>
            <div class="flex justify-end">
              <UButton color="red" @click="showUserExistsModal = false">Close</UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Contact Information -->
      <UCard class="border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-green-600 mb-4">Need to Update Other Information?</h2>
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-gray-700 mb-3">To change your name, email, or phone number, please contact the tontine leadership:</p>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">President:</span> Florien NDAGIJIMANA</p>
              <p><span class="font-medium">Secretary:</span> NIYONGOMBWA Didier</p>
              <p class="text-gray-600 mt-3">Changes to personal information require approval from the executive committee as per association constitution.</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const loading = ref(false)
const registerLoading = ref(false)
const joiningTontine = ref(null)
const showUserExistsModal = ref(false)
const showSuccessModal = ref(false)
const showValidationModal = ref(false)
const user = ref(null)
const idNumber = ref('')
const originalIdNumber = ref('')
const duplicateUserInfo = ref({ email: '', phone: '' })
const successUserInfo = ref({ names: '', email: '', phone: '', role: '' })
const validationErrors = ref([])
const activeTontines = ref([])
const joinedTontines = ref(new Set())
const newUser = ref({
  names: '',
  email: '',
  phone: '',
  password: '',
  role: 'member'
})

const roleOptions = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' }
]

const hasIdNumber = computed(() => {
  return originalIdNumber.value && originalIdNumber.value.length > 0
})

const isAdmin = computed(() => {
  return user.value && (user.value.role === 'admin' || user.value.role === 'president')
})

// Use dynamic admin users composable
const { fetchAdminUsers, isAdminEmail } = useAdminUsers()

// Validation functions
const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]+$/
  return nameRegex.test(name.trim())
}

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

const validatePhone = (phone) => {
  const phoneRegex = /^(\+?25)?(07[0-9]{8})$/
  return phoneRegex.test(phone.trim())
}

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await loadUserProfile()
      if (!isAdmin.value) {
        await loadActiveTontines()
      }
    }
    
    // Fetch admin users dynamically
    await fetchAdminUsers()
  }
})

const loadUserProfile = async () => {
  const { api } = useApi()
  try {
    // TODO: Backend endpoint /api/v1/auth/users/:userId does not exist
    // Using /api/v1/users/:userId as alternative
    const userData = await api(`/v1/users/${user.value.id}`)
    
    originalIdNumber.value = userData.id_number || ''
    idNumber.value = userData.id_number || ''
    
  } catch (error) {
    console.error('Failed to load profile:', error)
    const toast = useToast()
    toast.add({
      title: '❌ Error',
      description: 'Failed to load profile data',
      color: 'red'
    })
  }
}

const loadActiveTontines = async () => {
  const { api } = useApi()
  try {
    const tontines = await api('/v1/tontines')
    
    // Filter active tontines that user hasn't joined
    activeTontines.value = tontines.filter(t => 
      t.status === 'active' && 
      !t.members?.some(m => m.id === user.value.id)
    )
  } catch (error) {
    console.error('Failed to load tontines:', error)
  }
}

const joinTontine = async (tontineId) => {
  joiningTontine.value = tontineId
  const { api } = useApi()
  
  try {
    console.log('Attempting to join tontine:', tontineId, 'User ID:', user.value.id)
    
    // TODO: Backend endpoint /api/v1/tontines/:id/join does not exist
    // Using /api/v1/members/tontine/:tontineId/join as alternative
    const result = await api(`/v1/members/tontine/${tontineId}/join`, {
      method: 'POST',
      body: { userId: user.value.id }
    })
    
    console.log('Response data:', result)
    
    if (result && result.success) {
      // Add to joined tontines set
      joinedTontines.value.add(tontineId)
      
      const toast = useToast()
      toast.add({
        title: '✅ Success',
        description: 'Successfully joined the tontine!',
        color: 'green'
      })
    } else {
      throw new Error(result.message || 'Failed to join tontine')
    }
  } catch (error) {
    console.error('Failed to join tontine:', error)
    const toast = useToast()
    toast.add({
      title: '❌ Error',
      description: error.message || 'Failed to join tontine',
      color: 'red'
    })
  } finally {
    joiningTontine.value = null
  }
}

const updateIdNumber = async () => {
  loading.value = true
  const { api } = useApi()
  
  try {
    // TODO: Backend endpoint PUT /api/v1/auth/users/:userId does not exist
    // Using /api/v1/users/:userId as alternative
    await api(`/v1/users/${user.value.id}`, {
      method: 'PUT',
      body: { id_number: idNumber.value }
    })
    
    if (true) {
      originalIdNumber.value = idNumber.value
      
      const toast = useToast()
      toast.add({
        title: '✅ Success',
        description: 'ID number added successfully',
        color: 'green'
      })
    } else {
      throw new Error('Update failed')
    }
    
  } catch (error) {
    console.error('Failed to update ID number:', error)
    const toast = useToast()
    toast.add({
      title: '❌ Error',
      description: 'Failed to update ID number',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const registerNewUser = async () => {
  validationErrors.value = []
  
  // Validate form - check for empty or whitespace-only fields
  if (!newUser.value.names.trim()) validationErrors.value.push('Full name is required')
  if (!newUser.value.email.trim()) validationErrors.value.push('Email is required')
  if (!newUser.value.phone.trim()) validationErrors.value.push('Phone number is required')
  if (!newUser.value.password.trim()) validationErrors.value.push('Password is required')

  // Validate name (letters and spaces only)
  if (newUser.value.names.trim() && !validateName(newUser.value.names)) {
    validationErrors.value.push('Name should contain only letters and spaces')
  }

  // Validate email format
  if (newUser.value.email.trim() && !validateEmail(newUser.value.email)) {
    validationErrors.value.push('Please enter a valid email address')
  }

  // Validate phone number (Rwanda format)
  if (newUser.value.phone.trim() && !validatePhone(newUser.value.phone)) {
    validationErrors.value.push('Please enter a valid Rwanda phone number (07xxxxxxxx)')
  }

  // Show validation modal if there are errors
  if (validationErrors.value.length > 0) {
    showValidationModal.value = true
    return
  }

  registerLoading.value = true
  
  try {
    const { api } = useApi()
    const result = await api('/v1/auth/admin/register', {
      method: 'POST',
      body: {
        names: newUser.value.names.trim(),
        email: newUser.value.email.trim(),
        phone: newUser.value.phone.trim(),
        password: newUser.value.password.trim(),
        role: newUser.value.role,
        adminId: user.value.id
      }
    })
    
    if (result && result.success) {
      // Store user info for success modal
      successUserInfo.value = {
        names: newUser.value.names.trim(),
        email: newUser.value.email.trim(),
        phone: newUser.value.phone.trim(),
        role: newUser.value.role
      }
      
      // Reset form
      newUser.value = {
        names: '',
        email: '',
        phone: '',
        password: '',
        role: 'member'
      }
      
      // Show success modal
      showSuccessModal.value = true
    } else {
      // Check if it's a duplicate user error
      if (result.message && result.message.includes('already exists')) {
        duplicateUserInfo.value = {
          email: newUser.value.email,
          phone: newUser.value.phone
        }
        showUserExistsModal.value = true
      } else {
        throw new Error(result.message || 'Registration failed')
      }
    }
    
  } catch (error) {
    console.error('Failed to register user:', error)
    const toast = useToast()
    toast.add({
      title: '❌ Error',
      description: error.message || 'Failed to register new member',
      color: 'red'
    })
  } finally {
    registerLoading.value = false
  }
}

definePageMeta({
  layout: 'default'
})
</script>