<template>
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
    <div class="flex-1">
      <h1 class="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500">{{ title }}</h1>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{{ description }}</p>
    </div>
    <div class="flex gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
      <slot name="actions" />
      <UButton v-if="showBackButton" @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left" size="sm" class="sm:text-base">
        <span class="hidden sm:inline">Back to Dashboard</span>
        <span class="sm:hidden">Back</span>
      </UButton>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  showBackButton: { type: Boolean, default: true }
})
</script>