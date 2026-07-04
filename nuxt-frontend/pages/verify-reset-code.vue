<template>
  <div class="min-h-screen flex flex-col" :class="{ 'dark': isDark }">
    <!-- Navigation -->
    <nav class="absolute top-0 left-0 right-0 z-50 px-0 py-5">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3 pl-16">
          <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1783173071/logo_yfob25.png" alt="Logo" class="w-20 h-20 object-contain brightness-0 invert" />
          <span class="font-bold text-2xl text-white">The Future</span>
        </NuxtLink>
        <div class="flex items-center gap-10 pr-16">
          <NuxtLink to="/" active-class="text-emerald-400" class="text-base font-medium transition-colors" :class="isDark ? 'text-white/80 hover:text-white' : 'text-gray-900 hover:text-emerald-700'">Home</NuxtLink>
          <NuxtLink to="/apply" active-class="text-emerald-400" class="text-base font-medium transition-colors" :class="isDark ? 'text-white/80 hover:text-white' : 'text-gray-900 hover:text-emerald-700'">Apply</NuxtLink>
          <NuxtLink to="/login" active-class="text-emerald-400" class="text-base font-medium transition-colors" :class="isDark ? 'text-white/80 hover:text-white' : 'text-gray-900 hover:text-emerald-700'">Sign In</NuxtLink>
          <button @click="toggleDark" class="p-2 rounded-lg transition-colors" :class="isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-900 hover:text-emerald-700'">
            <UIcon :name="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="flex-1 flex">
      <!-- Left Side - Dark Emerald with Curve -->
      <div class="hidden lg:flex lg:w-[45%] bg-emerald-950 flex-col items-start justify-between pt-32 pb-16 px-16 relative overflow-hidden min-h-screen">
        <!-- Subtle background pattern -->
        <div class="absolute inset-0 opacity-[0.02]" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 24px 24px;"></div>
        
        <!-- Content -->
        <div class="relative z-10 w-full flex-1 flex flex-col justify-between">
          <div>
            <h1 class="text-4xl font-light text-white leading-tight mb-3">
              Verify<br />
              <span class="font-semibold text-emerald-400">Your Code</span>
            </h1>
            <p class="text-emerald-200/70 text-base leading-relaxed mb-8">
              Enter the 6-digit verification code sent to your email address. This helps us keep your account secure.
            </p>

            <!-- Key features -->
            <div class="mb-8">
              <p class="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">Security features</p>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Maximum 3 attempts</p>
                    <p class="text-emerald-300/60 text-xs">Account protection against unauthorized access</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-clock" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">10-minute expiration</p>
                    <p class="text-emerald-300/60 text-xs">Code expires for enhanced security</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Resend option available</p>
                    <p class="text-emerald-300/60 text-xs">Request a new code if needed</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Check your inbox</p>
                    <p class="text-emerald-300/60 text-xs">Code sent to your registered email</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom info -->
          <div class="border-t border-emerald-800/50 pt-6 space-y-3">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Secure & encrypted — your data is protected</p>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Didn't receive the code? Check spam folder</p>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Need help? Contact support anytime</p>
            </div>
          </div>
        </div>

        <!-- Curved divider SVG -->
        <div class="absolute right-0 top-0 bottom-0 w-32 hidden lg:block">
          <svg class="h-full w-full" viewBox="0 0 100 800" preserveAspectRatio="none">
            <path class="curve-fill" d="M100,0 Q0,400 100,800 L100,800 L100,0 Z" />
          </svg>
        </div>
      </div>

      <!-- Right Side - White Form -->
      <div class="flex-1 lg:w-[55%] flex items-center justify-center p-10 lg:p-20" :class="isDark ? 'bg-[#1e293b]' : 'bg-white'">
        <div class="w-full max-w-lg">
          <div class="mb-10">
            <h2 class="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Enter Verification Code</h2>
            <p class="text-gray-500 dark:text-gray-400 text-lg">We sent a 6-digit code to {{ email }}</p>
          </div>

          <!-- Success Message Display -->
          <div v-if="successMessage" class="mb-6">
            <p class="text-emerald-700 dark:text-emerald-300 text-sm">{{ successMessage }}</p>
          </div>

          <!-- Error Message Display -->
          <div v-if="errorMessage" class="mb-6">
            <p class="text-red-700 dark:text-red-300 text-sm">{{ errorMessage }}</p>
          </div>

          <!-- Attempts Remaining -->
          <div v-if="attemptsRemaining !== null" class="mb-6">
            <p class="text-amber-700 dark:text-amber-300 text-sm">
              {{ attemptsRemaining }} attempts remaining
            </p>
          </div>

          <!-- Form -->
          <UForm :state="form" @submit="handleSubmit" class="space-y-6">
            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Verification Code <span class="text-red-500">*</span></label>
              <div class="flex gap-2 justify-center">
                <input
                  v-for="(digit, index) in 6"
                  :key="index"
                  v-model="form.code[index]"
                  type="text"
                  maxlength="1"
                  class="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
                  @input="handleInput(index, $event)"
                  @keydown="handleKeydown(index, $event)"
                  @paste="handlePaste"
                />
              </div>
              <p v-if="errors.code" class="text-red-500 text-sm mt-1.5 text-center">{{ errors.code }}</p>
            </div>

            <!-- Loading indicator -->
            <div v-if="loading" class="text-center">
              <div class="inline-flex items-center gap-2 text-emerald-600">
                <div class="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-sm">Verifying code...</span>
              </div>
            </div>

            <div class="text-center space-y-3">
              <button
                type="button"
                @click="resendCode"
                :disabled="loading || resendDisabled"
                class="text-emerald-600 dark:text-emerald-400 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ resendDisabled ? `Resend code in ${resendCountdown}s` : 'Resend verification code' }}
              </button>
              
              <p class="text-base text-gray-500 dark:text-gray-400">
                Wrong email? <NuxtLink to="/forgot-password" class="sign-in-link font-semibold hover:underline">Go back</NuxtLink>
              </p>
            </div>
          </UForm>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.curve-fill {
  fill: white;
}
.dark .curve-fill {
  fill: #1e293b !important;
}
.sign-in-link {
  color: #047857 !important;
}
.dark .sign-in-link {
  color: #34d399 !important;
}
</style>

<script setup>
const form = reactive({
  code: ['', '', '', '', '', '']
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const errors = ref({})
const attemptsRemaining = ref(3)
const resendDisabled = ref(false)
const resendCountdown = ref(0)
const email = ref('')

const colorMode = useColorMode()
const isDark = computed(() => {
  if (colorMode.value === 'dark') return true
  if (colorMode.value === 'light') return false
  if (typeof window !== 'undefined' && colorMode.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
})

const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

// Get email from localStorage
onMounted(() => {
  const storedEmail = localStorage.getItem('resetEmail')
  if (!storedEmail) {
    window.location.href = '/forgot-password'
    return
  }
  email.value = storedEmail
  
  // Focus first input
  const firstInput = document.querySelector('input')
  if (firstInput) {
    firstInput.focus()
  }
})

const validateCode = () => {
  const code = form.code.join('')
  if (!code || code.length !== 6) {
    errors.value.code = 'Please enter all 6 digits'
  } else if (!/^\d{6}$/.test(code)) {
    errors.value.code = 'Verification code must be 6 digits'
  } else {
    errors.value.code = null
  }
}

const handleInput = (index, event) => {
  const value = event.target.value
  if (!/^\d*$/.test(value)) {
    form.code[index] = ''
    return
  }
  
  form.code[index] = value
  
  // Move to next input
  if (value && index < 5) {
    const nextInput = document.querySelectorAll('input')[index + 1]
    if (nextInput) {
      nextInput.focus()
    }
  }

  validateCode()

  // Check if all 6 digits are entered for auto-submit
  const allDigits = form.code.join('')
  if (allDigits.length === 6 && /^\d{6}$/.test(allDigits)) {
    setTimeout(() => {
      handleSubmit()
    }, 500) // Small delay for better UX
  }
}

const handleKeydown = (index, event) => {
  // Handle backspace
  if (event.key === 'Backspace' && !form.code[index] && index > 0) {
    const prevInput = document.querySelectorAll('input')[index - 1]
    if (prevInput) {
      prevInput.focus()
    }
  }
  
  // Handle arrow keys
  if (event.key === 'ArrowLeft' && index > 0) {
    const prevInput = document.querySelectorAll('input')[index - 1]
    if (prevInput) {
      prevInput.focus()
    }
  } else if (event.key === 'ArrowRight' && index < 5) {
    const nextInput = document.querySelectorAll('input')[index + 1]
    if (nextInput) {
      nextInput.focus()
    }
  }
}

const handlePaste = (event) => {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  
  for (let i = 0; i < pastedData.length; i++) {
    form.code[i] = pastedData[i]
  }
  
  validateCode()
  
  // Auto-submit if 6 digits were pasted
  if (pastedData.length === 6) {
    setTimeout(() => {
      handleSubmit()
    }, 500)
  }
}

const handleSubmit = async () => {
  // Clear previous messages
  errors.value = {}
  errorMessage.value = ''
  successMessage.value = ''
  
  // Validate code
  validateCode()
  
  // Check if there are any errors
  if (errors.value.code) {
    return
  }
  
  loading.value = true
  
  try {
    const code = form.code.join('')
    const response = await fetch('http://localhost:3300/api/v1/auth/verify-reset-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        code: code
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      successMessage.value = data.message
      
      // Store tokens and user data
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        window.location.href = '/reset-password'
      }, 2000)
    } else {
      errorMessage.value = data.message || 'Invalid verification code'
      console.log('Debug frontend - data:', data, 'attemptsRemaining:', data.attemptsRemaining)

      // Update attempts remaining from backend
      if (data.attemptsRemaining !== undefined) {
        attemptsRemaining.value = data.attemptsRemaining
      }
    }
    
  } catch (error) {
    console.error('Verify code error:', error)
    errorMessage.value = 'Unable to connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

const resendCode = async () => {
  if (resendDisabled.value) return
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await fetch('http://localhost:3300/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      successMessage.value = 'New verification code sent successfully!'
      
      // Reset form and attempts
      form.code = ['', '', '', '', '', '']
      attemptsRemaining.value = 3
      
      // Start countdown for resend
      resendDisabled.value = true
      resendCountdown.value = 60
      
      const countdownInterval = setInterval(() => {
        resendCountdown.value--
        if (resendCountdown.value <= 0) {
          clearInterval(countdownInterval)
          resendDisabled.value = false
        }
      }, 1000)
      
      // Focus first input
      setTimeout(() => {
        const firstInput = document.querySelector('input')
        if (firstInput) {
          firstInput.focus()
        }
      }, 100)
      
    } else {
      errorMessage.value = data.message || 'Failed to resend verification code'
    }
    
  } catch (error) {
    console.error('Resend code error:', error)
    errorMessage.value = 'Unable to connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>
