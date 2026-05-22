<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Process Refund</h3>
      </template>

      <UForm :state="form" @submit="processRefund">
        <UFormGroup label="Refund Amount" name="amount">
          <UInput v-model="form.amount" type="number" placeholder="Enter amount" />
        </UFormGroup>

        <UFormGroup label="Reason" name="reason">
          <UTextarea v-model="form.reason" placeholder="Reason for refund" />
        </UFormGroup>

        <div class="flex justify-end gap-2 mt-4">
          <UButton variant="ghost" @click="isOpen = false">Cancel</UButton>
          <UButton type="submit" :loading="loading">Process Refund</UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup>
const props = defineProps({
  contribution: Object,
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'refunded'])

const { processRefund: apiProcessRefund } = usePayments()
const { user } = useAuth()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive({
  amount: props.contribution?.amount || 0,
  reason: ''
})

const loading = ref(false)

const processRefund = async () => {
  loading.value = true
  try {
    await apiProcessRefund({
      userId: user.value.id,
      contributionId: props.contribution.id,
      refundAmount: form.amount,
      reason: form.reason
    })

    toast.add({
      title: 'Success',
      description: 'Refund processed successfully',
      color: 'green'
    })

    emit('refunded')
    isOpen.value = false
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to process refund',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}
</script>