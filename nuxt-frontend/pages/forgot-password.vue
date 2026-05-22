<template>
  <div class="min-h-screen flex flex-col" :class="{ 'dark': isDark }">
    <!-- Navigation -->
    <nav class="absolute top-0 left-0 right-0 z-50 px-0 py-5">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3 pl-16">
          <img src="~/assets/logo/logo.png" alt="Logo" class="w-20 h-20 object-contain brightness-0 invert" />
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
              Reset<br />
              <span class="font-semibold text-emerald-400">Your Password</span>
            </h1>
            <p class="text-emerald-200/70 text-base leading-relaxed mb-8">
              Don't worry, it happens to the best of us. We'll help you get back to your account in no time.
            </p>

            <!-- Key features -->
            <div class="mb-8">
              <p class="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">How it works</p>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Enter your email address</p>
                    <p class="text-emerald-300/60 text-xs">We'll send a verification code to your inbox</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Verify your identity</p>
                    <p class="text-emerald-300/60 text-xs">Enter the 6-digit code from your email</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Create new password</p>
                    <p class="text-emerald-300/60 text-xs">Choose a strong, secure password</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Access your account</p>
                    <p class="text-emerald-300/60 text-xs">Sign in with your new password</p>
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
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Verification code expires in 10 minutes</p>
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
            <h2 class="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Forgot Password?</h2>
            <p class="text-gray-500 dark:text-gray-400 text-lg">Enter your email address and we'll send you a verification code.</p>
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
            <p class="text-red-700 dark:text-red-300 text-sm">{{ errorMessage }}</p>
          </div>

          <!-- Form -->
          <UForm :state="form" @submit="handleSubmit" class="space-y-6">
            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Email address <span class="text-red-500">*</span></label>
              <div class="relative">
                <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1777550117/logo_cnn59u.png" alt="Email" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 object-contain" />
                <UInput v-model="form.email" type="email" placeholder="you@example.com" size="xl" required
                  :ui="{ base: 'pl-12 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 text-base', rounded: 'rounded-xl' }" />
              </div>
              <p v-if="errors.email" class="text-red-500 text-sm mt-1.5">{{ errors.email }}</p>
            </div>

            <UButton type="submit" :loading="loading" class="w-full justify-center mt-4" size="xl" color="emerald" :disabled="!form.email">
              Send Verification Code
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
  email: ''
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const errors = ref({})
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

const validateEmail = () => {
  const emailTrimmed = form.email.trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!emailTrimmed) {
    errors.value.email = 'Email address is required'
  } else if (!emailRegex.test(emailTrimmed)) {
    errors.value.email = 'Please enter a valid email address (e.g., name@example.com)'
  } else {
    errors.value.email = null
  }
}

const handleSubmit = async () => {
  // Clear previous messages
  errors.value = {}
  errorMessage.value = ''
  successMessage.value = ''
  
  // Validate email
  validateEmail()
  
  // Check if there are any errors
  if (errors.value.email) {
    return
  }
  
  loading.value = true
  
  try {
    const response = await fetch('http://localhost:3300/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: form.email.trim()
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      successMessage.value = data.message
      // Store email in localStorage for verification page
      localStorage.setItem('resetEmail', form.email.trim())
      
      // Redirect to verification page after 2 seconds
      setTimeout(() => {
        window.location.href = '/verify-reset-code'
      }, 2000)
    } else {
      errorMessage.value = data.message || 'Failed to send verification code. Please try again.'
    }
    
  } catch (error) {
    console.error('Forgot password error:', error)
    errorMessage.value = 'Unable to connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>
