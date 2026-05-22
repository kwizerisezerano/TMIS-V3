<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Backend Connection Test</h1>
    
    <div class="space-y-4">
      <UButton @click="testConnection" :loading="testing">
        Test Backend Connection
      </UButton>
      
      <div v-if="result" class="p-4 rounded" :class="result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
        <p class="font-semibold">{{ result.success ? 'Success' : 'Error' }}</p>
        <p>{{ result.message }}</p>
        <pre v-if="result.details" class="mt-2 text-sm">{{ result.details }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
const testing = ref(false)
const result = ref(null)

const testConnection = async () => {
  testing.value = true
  result.value = null
  const { api } = useApi()
  
  try {
    const response = await api('/v1/auth/login', {
      method: 'POST',
      body: { email: 'test@test.com', password: 'test' }
    })
    
    result.value = {
      success: true,
      message: 'Backend is running and responding',
      details: JSON.stringify(response, null, 2)
    }
  } catch (error) {
    result.value = {
      success: false,
      message: 'Backend connection failed',
      details: error.message || error.toString()
    }
  } finally {
    testing.value = false
  }
}
</script>