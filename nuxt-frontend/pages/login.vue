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
              Welcome<br />
              <span class="font-semibold text-emerald-400">back to The Future</span>
            </h1>
            <p class="text-emerald-200/70 text-base leading-relaxed mb-8">
              Access your dashboard, track your savings, manage loans, and stay connected with your cooperative community.
            </p>

            <!-- Key numbers -->
            <div class="grid grid-cols-3 gap-3 mb-8">
              <div class="bg-emerald-900/50 rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-emerald-400">20K</p>
                <p class="text-emerald-300/60 text-xs mt-1">RWF/month</p>
              </div>
              <div class="bg-emerald-900/50 rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-emerald-400">1.7%</p>
                <p class="text-emerald-300/60 text-xs mt-1">Loan interest</p>
              </div>
              <div class="bg-emerald-900/50 rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-emerald-400">2/3</p>
                <p class="text-emerald-300/60 text-xs mt-1">Max loan</p>
              </div>
            </div>

            <!-- What you can do -->
            <div class="mb-8">
              <p class="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">What you can do</p>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Track your savings & balance</p>
                    <p class="text-emerald-300/60 text-xs">Real-time dashboard with full history</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Request & manage loans</p>
                    <p class="text-emerald-300/60 text-xs">Up to 2/3 of savings at 1.7%/month</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-device-phone-mobile" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Pay via Mobile Money</p>
                    <p class="text-emerald-300/60 text-xs">MTN Mobile Money & Airtel Money</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-bell" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-white text-sm font-semibold">Live notifications</p>
                    <p class="text-emerald-300/60 text-xs">Instant updates on payments & approvals</p>
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
              <UIcon name="i-heroicons-users" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">20 committed members · Kamonyi, Rwanda</p>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Access your account 24/7, anytime</p>
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
            <h2 class="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Sign In</h2>
            <p class="text-gray-500 dark:text-gray-400 text-lg">Welcome back! Please login to your account.</p>
          </div>

          <!-- Error Message Display -->
          <div v-if="errorMessage" class="mb-6">
            <p class="text-red-700 dark:text-red-300 text-sm">{{ errorMessage }}</p>
          </div>
          
          <!-- Success Message Display -->
          <div v-if="successMessage" class="mb-6">
            <p class="text-emerald-700 dark:text-emerald-300 text-sm">{{ successMessage }}</p>
          </div>

          <!-- Form -->
          <UForm :state="form" @submit="handleLogin" class="space-y-6">
            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Email address <span class="text-red-500">*</span></label>
              <div class="relative">
                <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1777550117/logo_cnn59u.png" alt="Email" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 object-contain" />
                <UInput v-model="form.email" type="email" placeholder="you@example.com" size="xl" required
                  :ui="{ base: 'pl-12 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 text-base', rounded: 'rounded-xl' }" />
              </div>
              <p v-if="errors.email" class="text-red-500 text-sm mt-1.5">{{ errors.email }}</p>
            </div>

            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Password <span class="text-red-500">*</span></label>
              <div class="relative">
                <UIcon name="i-heroicons-lock-closed" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <UInput v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" size="xl" required
                  :ui="{ base: 'pl-12 pr-12 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 text-base', rounded: 'rounded-xl' }" />
                <button @click="showPassword = !showPassword" type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10">
                  <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-5 h-5" />
                </button>
              </div>
              <p v-if="errors.password" class="text-red-500 text-sm mt-1.5">{{ errors.password }}</p>
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center cursor-pointer">
                <UCheckbox v-model="form.rememberMe" class="text-emerald-600 scale-50 origin-left" />
                <span class="text-xs text-gray-600 dark:text-gray-400 -ml-1">Remember me</span>
              </label>
              <button @click="navigateToForgotPassword" class="sign-in-link text-xs text-emerald-600 hover:underline relative z-10 cursor-pointer">
                Forgot password?
              </button>
            </div>

            <UButton type="submit" :loading="loading" class="w-full justify-center mt-4" size="xl" color="emerald" :disabled="!form.email || !form.password">
              Sign In
            </UButton>

            <p class="text-base text-gray-500 dark:text-gray-400 text-center">
              New to The Future? <NuxtLink to="/apply" class="sign-in-link font-semibold hover:underline">Apply for membership</NuxtLink>
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
input[type="checkbox"]:checked {
  background-color: #059669 !important;
  border-color: #059669 !important;
}
.dark input[type="checkbox"]:checked {
  background-color: #34d399 !important;
  border-color: #34d399 !important;
}
</style>

<script setup>
const router = useRouter()
const { login } = useAuth()

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
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

const validatePassword = () => {
  if (!form.password) {
    errors.value.password = 'Password is required'
  } else if (form.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  } else {
    errors.value.password = null
  }
}

// Real-time validation watchers
watch(() => form.email, validateEmail)
watch(() => form.password, validatePassword)

const navigateToForgotPassword = () => {
  window.location.href = '/forgot-password'
}

const handleLogin = async () => {
  // Clear previous errors
  errors.value = {}
  
  // Validate form
  validateEmail()
  validatePassword()
  
  // Check if there are any errors
  if (errors.value.email || errors.value.password) {
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const authData = await login(form.email.trim(), form.password)

    successMessage.value = `Welcome back, ${authData.user.names}!`

    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Unable to connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>
