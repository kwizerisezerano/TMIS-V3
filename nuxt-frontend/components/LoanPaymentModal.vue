<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Pay Loan</h3>
      </template>

      <UForm :state="form" @submit="payLoan">
        <UFormGroup label="Payment Amount" name="amount">
          <UInput v-model="form.amount" type="number" placeholder="Enter payment amount" />
        </UFormGroup>

        <UFormGroup label="Phone Number" name="phone">
          <UInput v-model="form.phone" placeholder="07xxxxxxxx" />
        </UFormGroup>

        <div class="bg-blue-50 p-3 rounded-lg mb-4">
          <p class="text-sm text-blue-700">
            Payment will be processed via Lanari Pay. You will receive an SMS confirmation.
          </p>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UButton variant="ghost" @click="isOpen = false">Cancel</UButton>
          <UButton type="submit" :loading="loading">Pay Now</UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup>
const props = defineProps({
  loan: Object,
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'paid'])

const { processLoanPayment } = usePayments()
const { user } = useAuth()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive({
  amount: 0,
  phone: user.value?.phone || ''
})

const loading = ref(false)

const payLoan = async () => {
  loading.value = true
  try {
    await processLoanPayment({
      userId: user.value.id,
      loanId: props.loan.id,
      amount: form.amount,
      paymentMethod: 'mobile_money',
      paymentData: {
        phone: form.phone,
        description: `Loan payment for ${props.loan.tontine_name || 'tontine'}`
      }
    })

    toast.add({
      title: 'Success',
      description: 'Loan payment processed successfully',
      color: 'green'
    })

    emit('paid')
    isOpen.value = false
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to process payment',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}
</script>