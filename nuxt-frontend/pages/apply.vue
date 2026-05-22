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
          <h1 class="text-4xl font-light text-white leading-tight mb-3">
            Together for a<br />
            <span class="font-semibold text-emerald-400">better tomorrow</span>
          </h1>
          <p class="text-emerald-200/70 text-base leading-relaxed mb-8">
            A member-driven cooperative founded in Kamonyi, Rwanda. Save monthly, access affordable loans, and grow alongside 20 committed individuals.
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

          <!-- How it works -->
          <div class="mb-8">
            <p class="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">How it works</p>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5">1</div>
                <div>
                  <p class="text-white text-sm font-semibold">Apply & get approved</p>
                  <p class="text-emerald-300/60 text-xs">Executive Committee reviews within 3 days</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5">2</div>
                <div>
                  <p class="text-white text-sm font-semibold">Contribute 20,000 RWF monthly</p>
                  <p class="text-emerald-300/60 text-xs">Via MTN Mobile Money or Airtel Money</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5">3</div>
                <div>
                  <p class="text-white text-sm font-semibold">Access loans up to 2/3 of savings</p>
                  <p class="text-emerald-300/60 text-xs">At 1.7%/month, repayable in 6 months</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5">4</div>
                <div>
                  <p class="text-white text-sm font-semibold">Attend General Assembly</p>
                  <p class="text-emerald-300/60 text-xs">Every 4 months — vote and shape decisions</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom info -->
          <div class="border-t border-emerald-800/50 pt-6 space-y-3">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Bimba Village, Runda Sector, Kamonyi District</p>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-users" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Limited to 20 members — spots are exclusive</p>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p class="text-emerald-300/70 text-sm">Founded 14 January 2024</p>
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
      <div class="flex-1 lg:w-[55%] flex items-start justify-center pt-32 pb-10 px-10 lg:pb-20 lg:px-20" :class="isDark ? 'bg-[#1e293b]' : 'bg-white'">
        <div class="w-full max-w-lg">
          <div class="mb-10">
            <h2 class="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Membership Application</h2>
            <p class="text-gray-500 dark:text-gray-400 text-lg">Fill in your details to get started.</p>
          </div>

          <!-- Success -->
          <div v-if="submitted" class="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl p-6 text-center">
            <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Application submitted</h3>
            <p class="text-emerald-700 dark:text-emerald-300 text-sm mb-4">We'll contact you within 2-3 business days.</p>
            <UButton @click="resetForm" color="emerald" variant="outline" size="sm">Submit another</UButton>
          </div>

          <!-- Form -->
          <UForm v-else :state="form" @submit="handleSubmit" class="space-y-6">
            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Full name <span class="text-red-500">*</span></label>
              <div class="relative">
                <UIcon name="i-heroicons-user" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <UInput v-model="form.names" placeholder="Enter your full name" size="xl" required
                  :ui="{ base: 'pl-12 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 text-base', rounded: 'rounded-xl' }" />
              </div>
              <p v-if="errors.names" class="text-red-500 text-sm mt-1.5">{{ errors.names }}</p>
            </div>

            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Email address <span class="text-red-500">*</span></label>
              <div class="relative">
                <UIcon name="i-heroicons-envelope" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <UInput v-model="form.email" type="email" placeholder="you@example.com" size="xl" required
                  :ui="{ base: 'pl-12 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 text-base', rounded: 'rounded-xl' }" />
              </div>
              <p v-if="errors.email" class="text-red-500 text-sm mt-1.5">{{ errors.email }}</p>
            </div>

            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Phone number <span class="text-red-500">*</span></label>
              <div class="relative">
                <UIcon name="i-heroicons-phone" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <UInput v-model="form.phone" placeholder="078XXXXXXX" size="xl" required
                  :ui="{ base: 'pl-12 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 text-base', rounded: 'rounded-xl' }" />
              </div>
              <p v-if="errors.phone" class="text-red-500 text-sm mt-1.5">{{ errors.phone }}</p>
            </div>

            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Identity document <span class="text-red-500">*</span></label>
              <div @click="$refs.fileInput.click()"
                class="relative flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all cursor-pointer"
                :class="{ 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30': selectedFile }">
                <UIcon :name="selectedFile ? 'i-heroicons-document-check' : 'i-heroicons-cloud-arrow-up'" class="w-7 h-7 flex-shrink-0" :class="selectedFile ? 'text-emerald-600' : 'text-gray-400'" />
                <div class="flex-1 min-w-0">
                  <p class="text-base text-gray-900 dark:text-white truncate">{{ selectedFile ? selectedFile.name : 'Upload ID, passport, or driver\'s license' }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">PDF, JPG, or PNG • Max 5MB</p>
                </div>
                <input ref="fileInput" type="file" @change="handleFileChange" accept=".pdf,.jpg,.jpeg,.png" class="hidden" required />
              </div>
            </div>

            <div>
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for joining <span class="text-gray-400 font-normal">(optional)</span></label>
              <div class="relative">
                <UIcon name="i-heroicons-chat-bubble-left" class="absolute left-4 top-4 w-6 h-6 text-gray-400" />
                <UTextarea v-model="form.reason" placeholder="Tell us why you want to join..." :rows="3" />
              </div>
            </div>

            <UButton type="submit" :loading="loading" class="w-full justify-center mt-4" size="xl" color="emerald" :disabled="!form.names || !form.email || !form.phone || !selectedFile || !agreedToTerms">
              Submit application
            </UButton>

            <!-- Terms checkbox -->
            <div class="flex items-start gap-3">
              <input id="terms" type="checkbox" v-model="agreedToTerms"
                class="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0" />
              <label for="terms" class="text-sm text-gray-500 dark:text-gray-400">
                I agree to the
                <button type="button" @click.stop="showTerms = true"
                  class="terms-link font-semibold transition-colors">
                  Terms and Conditions
                </button>
                of The Future Association
              </label>
            </div>

            <p class="text-base text-gray-500 dark:text-gray-400 text-center">
              Already a member? <NuxtLink to="/login" class="sign-in-link font-semibold hover:underline">Sign in</NuxtLink>
            </p>
          </UForm>

          <!-- Terms Modal -->
          <Teleport to="body">
            <div v-if="showTerms" class="fixed inset-0 z-50 flex items-center justify-center p-4"
              @click.self="showTerms = false">
              <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showTerms = false" />
              <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col z-10">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">Terms & Conditions</h3>
                  <button @click="showTerms = false"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                  </button>
                </div>
                <div class="overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white mb-1">1. Membership</p>
                    <p>Membership is strictly limited to 20 persons. New members pay their share plus 10% of its current accumulated value. Applications are reviewed and approved by the Executive Committee within 3 days.</p>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white mb-1">2. Monthly Contributions</p>
                    <p>Each member must contribute 20,000 RWF per month. Contributions are due by the 10th of each month. Late payment between the 10th–17th incurs a 1,000 RWF fine; after the 17th, an additional 200 RWF/day applies.</p>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white mb-1">3. Loans</p>
                    <p>Members may borrow up to 2/3 of their accumulated savings at 1.7% monthly interest. Loan repayment period is a maximum of 6 months. Late repayment incurs a penalty of 10% of the outstanding balance per month.</p>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white mb-1">4. Meetings & Governance</p>
                    <p>Members must attend General Assembly meetings held at least every 4 months. Unexcused absence incurs a 5,000 RWF fine. Late arrival of more than 15 minutes incurs a 1,000 RWF fine.</p>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white mb-1">5. Member Obligations</p>
                    <p>Members commit to honest participation, transparency, and mutual support. Any conduct deemed harmful to the association may result in suspension or expulsion as decided by the General Assembly.</p>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white mb-1">6. Amendments</p>
                    <p>These terms may be amended by a two-thirds majority vote at the General Assembly. All members will be notified of any changes. Statutes are effective from 14 January 2024.</p>
                  </div>
                </div>
                <div class="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                  <button @click="agreedToTerms = true; showTerms = false"
                    class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm">
                    I Understand & Agree
                  </button>
                </div>
              </div>
            </div>
          </Teleport>
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
.terms-link {
  color: #059669 !important;
}
.dark .terms-link {
  color: #34d399 !important;
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
  names: '',
  email: '',
  phone: '',
  reason: ''
})

const loading = ref(false)
const submitted = ref(false)
const selectedFile = ref(null)
const fileInput = ref(null)
const errors = ref({})
const activeField = ref(null)
const agreedToTerms = ref(false)
const showTerms = ref(false)
const colorMode = useColorMode()
const isDark = computed(() => {
  if (colorMode.value === 'dark') return true
  if (colorMode.value === 'light') return false
  if (typeof window !== 'undefined' && colorMode.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
})
const curveColor = computed(() => isDark.value ? '#0f172a' : 'white')

const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const validateNames = () => {
  const namesTrimmed = form.names.trim()
  if (!namesTrimmed) {
    errors.value.names = 'Full names are required'
  } else if (namesTrimmed.length < 3) {
    errors.value.names = 'Name must be at least 3 characters'
  } else if (namesTrimmed.length > 100) {
    errors.value.names = 'Name must not exceed 100 characters'
  } else if (namesTrimmed.split(' ').length < 2) {
    errors.value.names = 'Please provide at least first and last name'
  } else if (/\d/.test(namesTrimmed)) {
    errors.value.names = 'Name should not contain numbers'
  } else if (/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/.test(namesTrimmed)) {
    errors.value.names = 'Name should not contain special characters'
  } else {
    errors.value.names = null
  }
}

const validateEmail = () => {
  const emailTrimmed = form.email.trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'yopmail.com']
  
  if (!emailTrimmed) {
    errors.value.email = 'Email address is required'
  } else if (emailTrimmed.length > 254) {
    errors.value.email = 'Email is too long'
  } else if (!emailRegex.test(emailTrimmed)) {
    errors.value.email = 'Please enter a valid email address (e.g., name@example.com)'
  } else {
    const domain = emailTrimmed.split('@')[1]
    if (disposableDomains.includes(domain)) {
      errors.value.email = 'Please use a permanent email address'
    } else {
      errors.value.email = null
    }
  }
}

const validatePhone = () => {
  const phoneTrimmed = form.phone.replace(/\s+/g, '')
  const phoneRegex = /^(078|079|072|073)\d{7}$/
  
  if (!phoneTrimmed) {
    errors.value.phone = 'Phone number is required'
  } else if (!/^\d+$/.test(phoneTrimmed)) {
    errors.value.phone = 'Phone number must contain only digits'
  } else if (phoneTrimmed.length !== 10) {
    errors.value.phone = 'Phone number must be exactly 10 digits'
  } else if (!phoneRegex.test(phoneTrimmed)) {
    errors.value.phone = 'Please enter a valid Rwandan MTN number (078XXXXXXXX)'
  } else {
    errors.value.phone = null
  }
}

// Real-time validation watchers
watch(() => form.names, validateNames)
watch(() => form.email, validateEmail)
watch(() => form.phone, validatePhone)

const validateForm = () => {
  errors.value = {}
  validateNames()
  validateEmail()
  validatePhone()
  
  // Validate file - comprehensive rules
  if (!selectedFile.value) {
    useToast().add({
      title: 'Document Required',
      description: 'Please upload your identity document',
      color: 'red'
    })
    return false
  }
  
  // Additional file validation
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  
  if (selectedFile.value.size > maxSize) {
    errors.value.document = 'File size must not exceed 5MB'
    useToast().add({
      title: 'File Too Large',
      description: 'Please upload a file smaller than 5MB',
      color: 'red'
    })
    return false
  }
  
  if (!allowedTypes.includes(selectedFile.value.type)) {
    errors.value.document = 'Only PDF, JPG, JPEG, and PNG files are allowed'
    useToast().add({
      title: 'Invalid File Type',
      description: 'Please upload a PDF or image file',
      color: 'red'
    })
    return false
  }
  
  return !errors.value.names && !errors.value.email && !errors.value.phone
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const resetForm = () => {
  form.names = ''
  form.email = ''
  form.phone = ''
  form.reason = ''
  selectedFile.value = null
  errors.value = {}
  agreedToTerms.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  submitted.value = false
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    const formData = new FormData()
    formData.append('names', form.names)
    formData.append('email', form.email)
    formData.append('phone', form.phone)
    formData.append('reason', form.reason)
    formData.append('agreedToTerms', 'true')
    formData.append('document', selectedFile.value)
    
    const response = await fetch('http://localhost:3300/api/v1/applications', {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      submitted.value = true
    } else {
      const error = await response.json()
      useToast().add({
        title: 'Application Failed',
        description: error.message || 'Failed to submit application. Please try again.',
        color: 'red'
      })
    }
    
  } catch (error) {
    console.error('Application error:', error)
    useToast().add({
      title: 'Error',
      description: 'Unable to submit application. Please check your connection.',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>