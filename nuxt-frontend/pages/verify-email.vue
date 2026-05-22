<template>
  <div class="min-h-screen bg-white flex items-center justify-center p-4">
    <UCard class="w-full max-w-md border-0 shadow-lg">
      <div class="space-y-6">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-green-600">Verify Your Email</h1>
          <p class="text-gray-600">Enter the 6-digit code sent to your email</p>
          <p class="text-sm text-green-600 mt-1">{{ verificationData?.email }}</p>
        </div>

        <!-- Error display -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p class="text-red-700 text-sm font-medium">{{ errorMessage }}</p>
        </div>
        
        <div class="text-center">
          <UInput 
            v-model="verificationCode" 
            placeholder="000000" 
            maxlength="6"
            class="text-center text-2xl font-mono tracking-widest"
            :disabled="loading"
            @input="clearError"
          />
        </div>

        <UButton 
          @click="verifyEmail" 
          :loading="loading" 
          :disabled="verificationCode.length !== 6 || (countdown > 0 && maxAttemptsReached)"
          class="w-full" 
          size="lg"
          color="green"
          icon="i-heroicons-arrow-right"
        >
          {{ (countdown > 0 && maxAttemptsReached) ? `Wait ${countdown}s` : 'Verify Email' }}
        </UButton>

        <div class="text-center space-y-2">
          <p class="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          
          <div v-if="countdown > 0" class="text-sm text-gray-500">
            Resend available in {{ countdown }} seconds
          </div>
          
          <UButton 
            @click="resendCode" 
            :loading="resendLoading"
            :disabled="countdown > 0"
            variant="ghost" 
            color="green"
            size="sm"
            icon="i-heroicons-arrow-path"
          >
            {{ countdown > 0 ? `Resend (${countdown}s)` : 'Resend Code' }}
          </UButton>
        </div>

        <div class="text-center">
          <NuxtLink to="/register" class="text-sm text-gray-500 hover:text-green-600">
            ← Back to Registration
          </NuxtLink>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const { $api } = useNuxtApp()
const toast = useToast()

const verificationCode = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const verificationData = ref(null)
const countdown = ref(0)
const errorMessage = ref('')
const maxAttemptsReached = ref(false)
let countdownInterval = null

const clearError = () => {
  errorMessage.value = ''
}

const startCountdown = () => {
  countdown.value = 60
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
    }
  }, 1000)
}

onMounted(() => {
  const stored = sessionStorage.getItem('verificationData')
  if (stored) {
    verificationData.value = JSON.parse(stored)
    
    if (verificationData.value.verificationCode) {
      toast.add({
        title: '📧 Email Failed',
        description: `Your verification code is: ${verificationData.value.verificationCode}`,
        color: 'yellow',
        timeout: 10000
      })
    }
  } else {
    toast.add({
      title: 'Session Expired',
      description: 'Please register again',
      color: 'red'
    })
    navigateTo('/register')
  }
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})

const verifyEmail = async () => {
  loading.value = true
  
  try {
    console.log('Attempting verification with code:', verificationCode.value)
    
    // TODO: Backend endpoint /api/v1/auth/verify-email does not exist
    // This feature requires backend implementation
    throw new Error('Email verification not available')
    
    console.log('Verification response:', response)
    
    if (response.success) {
      toast.add({
        title: '✅ Email Verified Successfully!',
        description: 'Your account is now active. You can login.',
        color: 'green'
      })
      
      sessionStorage.removeItem('verificationData')
      await navigateTo('/login')
    } else {
      throw new Error(response.message || 'Verification failed')
    }
    
  } catch (error) {
    console.error('Verification error:', error)
    
    let title = '❌ Verification Failed'
    let message = 'Invalid verification code. Please check and try again.'
    let shouldRedirect = false
    
    if (error.data?.message) {
      message = error.data.message
      
      if (error.data.maxAttemptsReached) {
        title = '⏳ Too Many Attempts'
        message = 'Too many attempts. Please wait 60 seconds before trying again.'
        maxAttemptsReached.value = true
        countdown.value = 60
        startCountdown()
      } else if (error.data.expired) {
        title = '⏰ Session Expired'
        message = 'Verification session has expired. Please register again.'
        shouldRedirect = true
      } else if (message.includes('Invalid code')) {
        const remaining = error.data.remainingAttempts
        if (remaining !== undefined) {
          message = `Invalid verification code. ${remaining} attempts remaining.`
        }
      }
    } else if (error.message) {
      message = error.message
    }
    
    toast.add({
      title,
      description: message,
      color: 'red',
      timeout: shouldRedirect ? 3000 : 5000
    })
    
    // Also show error on page
    errorMessage.value = message
    
    if (shouldRedirect) {
      setTimeout(() => {
        sessionStorage.removeItem('verificationData')
        navigateTo('/register')
      }, 3000)
    } else {
      verificationCode.value = ''
    }
    
  } finally {
    loading.value = false
  }
}

const resendCode = async () => {
  resendLoading.value = true
  
  try {
    // TODO: Backend endpoint /api/v1/auth/resend-otp does not exist
    // This feature requires backend implementation
    throw new Error('Resend OTP not available')
    
    toast.add({
      title: '📧 Code Resent Successfully',
      description: response.message || 'New verification code sent to your email',
      color: 'green'
    })
    
    if (response.verificationCode) {
      toast.add({
        title: '📧 Your New Code',
        description: `Code: ${response.verificationCode}`,
        color: 'yellow',
        timeout: 10000
      })
    }
    
    startCountdown()
    
  } catch (error) {
    console.error('Resend error:', error)
    
    let message = 'Failed to resend code. Please try again.'
    if (error.data?.message) {
      message = error.data.message
    } else if (error.message) {
      message = error.message
    }
    
    toast.add({
      title: '❌ Resend Failed',
      description: message,
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