<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-green-600 mb-4">Tontine Details</h1>
      
      <div class="mb-4 flex justify-between items-center">
        <p>Tontine ID: {{ $route.params.id }}</p>
        <UButton @click="manageTontine($route.params.id)" color="primary">
          Manage Tontine
        </UButton>
      </div>
      
      <UButton @click="navigateTo('/tontines')" variant="outline">
        Back to Tontines
      </UButton>
      
      <div v-if="loading" class="mt-6 text-center">
        <p>Loading...</p>
      </div>
      
      <div v-else-if="tontine.name" class="mt-6">
        <h2 class="text-2xl font-bold">{{ tontine.name }}</h2>
        <p>{{ tontine.description }}</p>
        <p>Members: {{ tontine.members?.length || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const loading = ref(true)
const tontine = ref({})

onMounted(async () => {
  const id = useRoute().params.id
  const { api } = useApi()
  
  try {
    tontine.value = await api(`/v1/tontines/${id}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
})

const manageTontine = (tontineId) => {
  navigateTo(`/tontines/${tontineId}/manage`)
}
</script>