<template>
  <div class="relative flex items-center">
    <input
      v-bind="$attrs"
      type="text"
      inputmode="decimal"
      :value="modelValue"
      :placeholder="placeholder || '0.00'"
      class="w-full px-4 py-3 pr-14 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-base font-semibold"
      @keypress="onlyNumber"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span class="absolute right-3 text-gray-500 text-xs pointer-events-none">RWF</span>
  </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '0.00' }
})

const emit = defineEmits(['update:modelValue'])

const onlyNumber = (event) => {
  const charCode = event.which ? event.which : event.keyCode
  if (charCode !== 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault()
  }
  if (charCode === 46 && event.target.value.includes('.')) {
    event.preventDefault()
  }
}
</script>
