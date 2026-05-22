<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-md glass-card">
      <template #header>
        <div class="text-center space-y-2">
          <h1 class="text-3xl font-bold gradient-text">🏦 Ikimina</h1>
          <p class="text-gray-600">Verify your email address</p>
        </div>
      </template>

      <div class="space-y-4">
        <div class="text-center">
          <p class="text-gray-600 mb-2">
            We sent a 6-digit verification code to<br>
            <strong>{{ email }}</strong>
          </p>
          <p class="text-sm text-gray-500">
            Code expires in {{ formatTime(countdown) }}
          </p>
        </div>

        <UForm :state="form" @submit="handleVerify" class="space-y-4">
          <UFormGroup label="Verification Code" name="otp">
            <UInput 
              v-model="form.otp" 
              placeholder="Enter 6-digit code"
              maxlength="6"
              size="lg"
              class="text-center text-2xl tracking-widest"
            />
          </UFormGroup>

          <UButton 
            type="submit" 
            :loading="loading"
            size="lg"
            class="w-full"
            color="primary"
            :disabled="form.otp.length !== 6"
          >
            {{ loading ? 'Verifying...' : 'Verify Account' }}
          </UButton>
        </UForm>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            <span v-if="countdown > 0">Resend code in {{ formatTime(countdown) }}</span>
            <button v-else @click="resendCode" :disabled="resendLoading" 
                    class="text-green-600 hover:text-green-500 font-medium disabled:opacity-50">
              {{ resendLoading ? 'Sending...' : 'Resend Code' }}
            </button>
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const route = useRoute()
const toast = useToast()

const form = ref({
  otp: ''
})

const loading = ref(false)
const resendLoading = ref(false)
const email = ref('')
const verificationKey = ref(route.query.key || '')
const countdown = ref(60)

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startCountdown = () => {
  countdown.value = 60
  
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

onMounted(() => {
  startCountdown()
})

const handleVerify = async () => {
  loading.value = true

  try {
    const { verifyEmail } = useAuth()

    const response = await verifyEmail(verificationKey.value, form.value.otp)

    if (response.success) {
      toast.add({
        title: 'Success!',
        description: 'Email verified successfully. Redirecting to login...',
        color: 'green'
      })

      await navigateTo('/login')
      return
    }

  } catch (error) {
    if (error.data?.maxAttemptsReached || error.data?.expired) {
      toast.add({
        title: 'Session Expired',
        description: error.data.message,
        color: 'red'
      })
      await navigateTo('/register')
      return
    }

    toast.add({
      title: 'Verification Failed',
      description: error.data?.message || 'Invalid code. Please try again.',
      color: 'red'
    })
    form.value.otp = ''
  } finally {
    loading.value = false
  }
}

const resendCode = async () => {
  resendLoading.value = true

  try {
    const { resendOtp } = useAuth()

    const response = await resendOtp(verificationKey.value)

    toast.add({
      title: 'Code Sent',
      description: response.message,
      color: 'green'
    })

    if (response.verificationCode) {
      toast.add({
        title: 'Verification Code',
        description: `Your code: ${response.verificationCode}`,
        color: 'blue',
        timeout: 10000
      })
    }

    startCountdown()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to resend code. Please try again.',
      color: 'red'
    })
  } finally {
    resendLoading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>