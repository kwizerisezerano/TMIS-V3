<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold" :class="headerClass">{{ title }}</h3>
      </template>
      
      <!-- Form Mode (Create/Edit) -->
      <div v-if="mode !== 'delete' && mode !== 'view'" class="space-y-4">
        <div v-if="success" class="p-4 rounded-lg border border-green-300 bg-green-50">
          <p class="text-sm font-semibold text-green-800">
            <Icon name="i-heroicons-check-circle" class="w-4 h-4 inline mr-1" />
            {{ mode === 'edit' ? 'Branch Updated!' : 'Branch Created!' }}
          </p>
          <p class="text-sm text-green-700 mt-1">{{ success }}</p>
        </div>

        <UFormGroup label="Branch Name" required>
          <UInput v-model="formData.name" placeholder="Enter branch name" :disabled="Boolean(success)" />
        </UFormGroup>
        
        <UFormGroup label="Description">
          <UTextarea v-model="formData.description" placeholder="Describe the branch purpose" :disabled="Boolean(success)" />
        </UFormGroup>
        
        <UFormGroup label="Monthly Contribution Amount (RWF)" required>
          <UInput v-model="formData.contribution_amount" type="number" placeholder="20000" :disabled="Boolean(success)" />
        </UFormGroup>
        
        <UFormGroup label="Maximum Members" required>
          <UInput v-model="formData.max_members" type="number" placeholder="20" max="20" :disabled="Boolean(success)" />
        </UFormGroup>
        
        <UFormGroup label="Start Date">
          <UInput v-model="formData.start_date" type="date" :min="today" :disabled="Boolean(success)" />
        </UFormGroup>
        
        <UFormGroup label="End Date (Optional)">
          <UInput v-model="formData.end_date" type="date" :min="formData.start_date || today" :disabled="Boolean(success)" />
        </UFormGroup>

        <div v-if="error" class="p-4 rounded-lg border border-yellow-300 bg-yellow-50">
          <p class="text-sm font-semibold text-yellow-800">⚠️ {{ mode === 'edit' ? 'Update Failed' : 'Creation Failed' }}</p>
          <p class="text-sm text-yellow-700 mt-1">{{ error }}</p>
        </div>
      </div>

      <!-- View Mode -->
      <div v-else-if="mode === 'view'" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Branch Name</label>
            <div class="text-lg font-semibold text-green-600">{{ tontine?.name }}</div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Status</label>
            <div class="text-sm" :class="tontine?.status === 'active' ? 'text-green-600' : 'text-red-600'">{{ tontine?.status?.toUpperCase() }}</div>
          </div>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-700">Description</label>
          <div class="text-gray-900">{{ tontine?.description || 'No description' }}</div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Monthly Contribution</label>
            <div class="text-lg font-semibold text-green-600">RWF {{ Number(tontine?.contribution_amount || 0).toLocaleString() }}</div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Members</label>
            <div class="text-lg font-semibold">{{ tontine?.member_count || 0 }}/{{ tontine?.max_members }}</div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Start Date</label>
            <div class="text-gray-900">{{ formatDate(tontine?.start_date) }}</div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">End Date</label>
            <div class="text-gray-900">{{ formatDate(tontine?.end_date) || 'Not set' }}</div>
          </div>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-700">Total Contributions</label>
          <div class="text-2xl font-bold text-green-600">RWF {{ Number(tontine?.total_contributions || 0).toLocaleString() }}</div>
        </div>
      </div>

      <!-- Delete Mode -->
      <div v-else class="space-y-4">
        <div v-if="success" class="p-4 rounded-lg border border-green-300 bg-green-50">
          <p class="text-sm font-semibold text-green-800">Branch Deleted!</p>
          <p class="text-sm text-green-700 mt-1">{{ success }}</p>
        </div>

        <div class="text-center">
          <div class="text-4xl mb-4">⚠️</div>
          <h4 class="text-lg font-medium text-gray-900">{{ tontine?.name }}</h4>
          <p class="text-gray-600 mt-2">Are you sure you want to delete this branch?</p>
          <p class="text-red-600 text-sm mt-2 font-medium">This action cannot be undone and will remove all associated data.</p>
        </div>
        
        <div class="bg-red-50 p-4 rounded-lg">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-red-800">Members:</span>
              <div class="text-red-600">{{ tontine?.member_count || 0 }}</div>
            </div>
            <div>
              <span class="font-medium text-red-800">Total Contributions:</span>
              <div class="text-red-600">RWF {{ Number(tontine?.total_contributions || 0).toLocaleString() }}</div>
            </div>
          </div>
        </div>

        <div class="space-y-2 p-4 rounded-lg border border-red-200 bg-white">
          <p class="text-sm text-gray-700">Type the branch name below to confirm deletion:</p>
          <UInput
            v-model="confirmName"
            placeholder="Enter branch name"
            class="w-full"
            :disabled="Boolean(success)"
          />
          <p v-if="confirmName && !canDelete" class="text-sm text-red-600">
            Name does not match. Please type the exact branch name to enable deletion.
          </p>
        </div>

        <div v-if="error" class="p-4 rounded-lg border border-yellow-300 bg-yellow-50">
          <p class="text-sm font-semibold text-yellow-800">⚠️ Cannot Delete</p>
          <p class="text-sm text-yellow-700 mt-1">{{ error }}</p>
        </div>
      </div>
      
      <template #footer>
        <div class="flex gap-2 justify-end">
          <UButton @click="cancel" variant="outline">{{ mode === 'view' || success ? 'Close' : 'Cancel' }}</UButton>
          <UButton v-if="mode !== 'view' && !success" @click="confirm" :color="buttonColor" :loading="loading" :disabled="mode === 'delete' && !canDelete">
            {{ buttonText }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: 'create', // 'create', 'edit', 'delete', 'view'
    validator: (value) => ['create', 'edit', 'delete', 'view'].includes(value)
  },
  tontine: Object,
  loading: Boolean,
  error: String,
  success: String
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const today = new Date().toISOString().split('T')[0]

const formData = ref({
  name: '',
  description: '',
  contribution_amount: 20000,
  max_members: 20,
  start_date: '',
  end_date: ''
})

const confirmName = ref('')

const canDelete = computed(() => {
  if (props.mode !== 'delete') return true
  return confirmName.value.trim() === (props.tontine?.name || '')
})

const title = computed(() => {
  switch (props.mode) {
    case 'create': return 'Create New Branch'
    case 'edit': return 'Edit Branch'
    case 'delete': return 'Delete Branch'
    case 'view': return 'Branch Details'
    default: return 'Branch'
  }
})

const headerClass = computed(() => {
  switch (props.mode) {
    case 'delete': return 'text-red-600'
    case 'view': return 'text-blue-600'
    default: return 'text-green-600'
  }
})

const buttonText = computed(() => {
  switch (props.mode) {
    case 'create': return 'Create Branch'
    case 'edit': return 'Update Branch'
    case 'delete': return 'Yes, Delete Branch'
    default: return 'Confirm'
  }
})

const buttonColor = computed(() => {
  return props.mode === 'delete' ? 'red' : 'green'
})

const confirm = () => {
  if (props.mode === 'delete') {
    emit('confirm')
  } else {
    emit('confirm', formData.value)
  }
}

const cancel = () => {
  emit('cancel')
  isOpen.value = false
}

// Watch for tontine changes to populate form
watch([() => props.tontine, () => props.mode], ([newTontine, newMode]) => {
  if (newTontine && newMode === 'edit') {
    formData.value = {
      id: newTontine.id,
      name: newTontine.name || '',
      description: newTontine.description || '',
      contribution_amount: newTontine.contribution_amount || 20000,
      max_members: newTontine.max_members || 20,
      start_date: newTontine.start_date ? newTontine.start_date.split('T')[0] : '',
      end_date: newTontine.end_date ? newTontine.end_date.split('T')[0] : ''
    }
  } else if (newMode === 'create') {
    // Reset form for create mode
    formData.value = {
      name: '',
      description: '',
      contribution_amount: 20000,
      max_members: 20,
      start_date: '',
      end_date: ''
    }
  }
}, { immediate: true })

// Reset form when modal closes
watch(isOpen, (newValue) => {
  if (!newValue) {
    formData.value = {
      name: '',
      description: '',
      contribution_amount: 20000,
      max_members: 20,
      start_date: '',
      end_date: ''
    }
    confirmName.value = ''
  }
})

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
