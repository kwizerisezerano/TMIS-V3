<template>
  <div class="text-center py-8">
    <div class="inline-flex items-center gap-2 text-gray-500">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
      {{ text }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: 'Loading...' }
})
</script>