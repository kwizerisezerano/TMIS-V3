<template>
  <span 
    :class="badgeClasses" 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
  >
    {{ formattedStatus }}
  </span>
</template>

<script setup>
const props = defineProps({
  status: { type: String, required: true },
  type: { type: String, default: 'default' }
})

const badgeClasses = computed(() => {
  const { status, type } = props
  
  if (type === 'role') {
    return status === 'admin' 
      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
  }
  
  if (type === 'verification') {
    return status === 'verified' || status === '1' || status === true
      ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
  }
  
  return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
})

const formattedStatus = computed(() => {
  const { status, type } = props
  
  if (type === 'verification') {
    return status === 'verified' || status === '1' || status === true ? 'Verified' : 'Pending'
  }
  
  return String(status).charAt(0).toUpperCase() + String(status).slice(1)
})
</script>