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
              Set New<br />
              <span class="font-semibold text-emerald-400">Password</span>
            </h1>
            <p class="text-emerald-200/70 text-base leading-relaxed mb-8">
              Create a strong, secure password for your account. Make it memorable but hard to guess.
            </p>

            <!-- Password tips -->
            <div class="mb-8">
              <p class="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">Password tips</p>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Use a strong combination</p>
                    <p class="text-emerald-300/60 text-xs">Mix uppercase, lowercase, numbers & symbols</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-key" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Make it unique</p>
                    <p class="text-emerald-300/60 text-xs">Don't reuse passwords from other accounts</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Minimum 8 characters</p>
                    <p class="text-emerald-300/60 text-xs">Longer passwords are more secure</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Auto login after reset</p>
                    <p class="text-emerald-300/60 text-xs">You'll be redirected to sign in</p>
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
              <UIcon name="i-heroicons-eye-slash" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Your password is never stored in plain text</p>
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
            <h2 class="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Reset Password</h2>
            <p class="text-gray-500 dark:text-gray-400 text-lg">Enter your new password below.</p>
          </div>

          <!-- Success Message Display -->
          <div v-if="successMessage" class="mb-6">
            <div class="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p class="text-emerald-700 dark:text-emerald-300 text-sm">{{ successMessage }}</p>
              </div>
            </div>
          </div>

          <!-- Error Message Display -->
          <div v-if="errorMessage" class="mb-6">
            <div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
                <p class="text-red-700 dark:text-red-300 text-sm">{{ errorMessage }}</p>
              </div>
            </div>
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="form.newPassword" class="mb-6">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Password strength:</span>
              <span class="text-sm font-medium" :class="passwordStrengthColor">{{ passwordStrengthText }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="h-2 rounded-full transition-all duration-300" :class="passwordStrengthBarColor" :style="{ width: passwordStrengthPercentage + '%' }"></div>
            </div>
          </div>

          <!-- Form -->
          <UForm :state="form" @submit="handleSubmit" class="space-y-6">
            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">New Password <span class="text-red-500">*</span></label>
              <div class="relative">
                <UIcon name="i-heroicons-lock-closed" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <UInput v-model="form.newPassword" :type="showNewPassword ? 'text' : 'password'" placeholder="Enter new password" size="xl" required
                  :ui="{ base: 'pl-12 pr-12 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 text-base', rounded: 'rounded-xl' }" />
                <button @click="showNewPassword = !showNewPassword" type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10">
                  <UIcon :name="showNewPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-5 h-5" />
                </button>
              </div>
              <p v-if="errors.newPassword" class="text-red-500 text-sm mt-1.5">{{ errors.newPassword }}</p>
            </div>

            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password <span class="text-red-500">*</span></label>
              <div class="relative">
                <UIcon name="i-heroicons-lock-closed" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <UInput v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="Confirm new password" size="xl" required
                  :ui="{ base: 'pl-12 pr-12 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 text-base', rounded: 'rounded-xl' }" />
                <button @click="showConfirmPassword = !showConfirmPassword" type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10">
                  <UIcon :name="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-5 h-5" />
                </button>
              </div>
              
              <!-- Password matching indicator -->
              <div v-if="form.confirmPassword" class="mt-2 flex items-center gap-2">
                <UIcon :name="passwordsMatch ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" 
                       :class="passwordsMatch ? 'text-emerald-600' : 'text-red-600'" 
                       class="w-4 h-4" />
                <span :class="passwordsMatch ? 'text-emerald-600 text-sm' : 'text-red-600 text-sm'">
                  {{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}
                </span>
              </div>
              
              <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1.5">{{ errors.confirmPassword }}</p>
            </div>

            <!-- Password Requirements -->
            <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password must contain:</p>
              <ul class="space-y-1">
                <li class="flex items-center gap-2 text-sm" :class="requirements.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'">
                  <UIcon :name="requirements.length ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" class="w-4 h-4" />
                  At least 8 characters
                </li>
                <li class="flex items-center gap-2 text-sm" :class="requirements.hasUppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'">
                  <UIcon :name="requirements.hasUppercase ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" class="w-4 h-4" />
                  At least 1 uppercase letter (A-Z)
                </li>
                <li class="flex items-center gap-2 text-sm" :class="requirements.hasLowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'">
                  <UIcon :name="requirements.hasLowercase ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" class="w-4 h-4" />
                  At least 1 lowercase letter (a-z)
                </li>
                <li class="flex items-center gap-2 text-sm" :class="requirements.hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'">
                  <UIcon :name="requirements.hasNumber ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" class="w-4 h-4" />
                  At least 1 number (0-9)
                </li>
                <li class="flex items-center gap-2 text-sm" :class="requirements.hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'">
                  <UIcon :name="requirements.hasSpecialChar ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" class="w-4 h-4" />
                  At least 1 special character (!@#$%^&*)
                </li>
              </ul>
            </div>

            <UButton type="submit" :loading="loading" class="w-full justify-center mt-4" size="xl" color="emerald" :disabled="!form.newPassword || !form.confirmPassword || !requirements.length || !requirements.hasUppercase || !requirements.hasLowercase || !requirements.hasNumber || !requirements.hasSpecialChar || form.newPassword !== form.confirmPassword">
              Reset Password
            </UButton>

            <p class="text-base text-gray-500 dark:text-gray-400 text-center">
              Remember your password? <NuxtLink to="/login" class="sign-in-link font-semibold hover:underline">Back to Sign In</NuxtLink>
            </p>
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
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const errors = ref({})
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

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

// Password requirements
const requirements = computed(() => ({
  length: form.newPassword.length >= 8,
  hasUppercase: /[A-Z]/.test(form.newPassword),
  hasLowercase: /[a-z]/.test(form.newPassword),
  hasNumber: /\d/.test(form.newPassword),
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)
}))

// Password matching indicator
const passwordsMatch = computed(() => {
  return form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword
})

// Password strength calculation
const passwordStrength = computed(() => {
  const password = form.newPassword
  let strength = 0
  
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  if (/[a-z]/.test(password)) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/\d/.test(password)) strength += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1
  
  return strength
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'Weak'
  if (strength <= 4) return 'Medium'
  return 'Strong'
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'text-red-500'
  if (strength <= 4) return 'text-amber-500'
  return 'text-emerald-500'
})

const passwordStrengthPercentage = computed(() => {
  return (passwordStrength.value / 6) * 100
})

const passwordStrengthBarColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'bg-red-500'
  if (strength <= 4) return 'bg-amber-500'
  return 'bg-emerald-500'
})

// Check if reset email is available (should be after verification)
onMounted(() => {
  const resetEmail = localStorage.getItem('resetEmail')
  if (!resetEmail) {
    window.location.href = '/forgot-password'
    return
  }
})

const validateNewPassword = () => {
  if (!form.newPassword) {
    errors.value.newPassword = 'New password is required'
  } else if (form.newPassword.length < 8) {
    errors.value.newPassword = 'Password must be at least 8 characters long'
  } else if (!/[A-Z]/.test(form.newPassword)) {
    errors.value.newPassword = 'Password must contain at least 1 uppercase letter'
  } else if (!/[a-z]/.test(form.newPassword)) {
    errors.value.newPassword = 'Password must contain at least 1 lowercase letter'
  } else if (!/\d/.test(form.newPassword)) {
    errors.value.newPassword = 'Password must contain at least 1 number'
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)) {
    errors.value.newPassword = 'Password must contain at least 1 special character'
  } else {
    errors.value.newPassword = null
  }
}

const validateConfirmPassword = () => {
  if (!form.confirmPassword) {
    errors.value.confirmPassword = 'Please confirm your password'
  } else if (form.newPassword !== form.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
  } else {
    errors.value.confirmPassword = null
  }
}

const handleSubmit = async () => {
  // Clear previous messages
  errors.value = {}
  errorMessage.value = ''
  successMessage.value = ''
  
  console.log('Reset password submit attempt:', {
    newPassword: form.newPassword,
    confirmPassword: form.confirmPassword,
    requirements: requirements.value
  })
  
  // Validate passwords
  validateNewPassword()
  validateConfirmPassword()
  
  console.log('After validation:', errors.value)
  
  // Check if there are any errors
  if (errors.value.newPassword || errors.value.confirmPassword) {
    console.log('Validation errors found, stopping submission')
    return
  }
  
  console.log('Validation passed, submitting to backend...')
  loading.value = true
  
  try {
    const email = localStorage.getItem('resetEmail')
    console.log('Email from localStorage:', email)
    if (!email) {
      errorMessage.value = 'Email not found. Please start the password reset process again.'
      return
    }
    
    console.log('Making fetch request to backend...')
    const response = await fetch('http://localhost:3300/api/v1/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      successMessage.value = data.message
      
      // Clear reset email and authentication tokens from localStorage
      localStorage.removeItem('resetEmail')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else {
      errorMessage.value = data.message || 'Failed to reset password'
    }
    
  } catch (error) {
    console.error('Reset password error:', error)
    errorMessage.value = 'Unable to connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>
