<template>
  <button 
    type="button"
    @click="$emit('click')"
    :disabled="disabled || loading"
    :class="buttonClasses"
    class="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
  >
    <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
    <Icon v-else-if="icon" :name="icon" class="w-4 h-4" />
    <slot />
  </button>
</template>

<script setup>
defineEmits(['click'])

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  icon: { type: String, default: null }
})

const buttonClasses = computed(() => {
  const { variant, size, disabled, loading } = props
  
  let classes = []
  
  // Variant classes
  switch (variant) {
    case 'primary':
      classes.push('bg-green-600 hover:bg-green-700 text-white')
      break
    case 'secondary':
      classes.push('bg-gray-600 hover:bg-gray-700 text-white')
      break
    case 'outline':
      classes.push('border border-gray-300 hover:bg-gray-50 text-gray-700')
      break
    case 'danger':
      classes.push('bg-red-600 hover:bg-red-700 text-white')
      break
  }
  
  // Size classes
  switch (size) {
    case 'sm':
      classes.push('px-3 py-1 text-sm')
      break
    case 'lg':
      classes.push('px-6 py-3 text-lg')
      break
  }
  
  // State classes
  if (disabled || loading) {
    classes.push('opacity-50 cursor-not-allowed')
  } else {
    classes.push('cursor-pointer')
  }
  
  return classes.join(' ')
})
</script>
