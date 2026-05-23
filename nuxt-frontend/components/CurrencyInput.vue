<template>
  <UInput
    v-bind="$attrs"
    type="text"
    inputmode="decimal"
    placeholder="0.00"
    :ui="{ icon: { trailing: { pointer: '' } } }"
    @keypress="onlyNumber"
  >
    <template #trailing>
      <span class="text-gray-500 text-xs pr-2">RWF</span>
    </template>
  </UInput>
</template>

<script setup>
/**
 * Global Currency Input Component
 * Automatically applies:
 * - High precision decimal support (String-based)
 * - RWF suffix for consistency
 * - inputmode="decimal" for proper keypad on mobile
 */
defineOptions({
  inheritAttrs: false
})

const onlyNumber = (event) => {
  const charCode = (event.which) ? event.which : event.keyCode;
  // Allow numbers and one decimal point
  if (charCode !== 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
  }
  // Prevent multiple decimal points
  if (charCode === 46 && event.target.value.includes('.')) {
    event.preventDefault();
  }
};
</script>
