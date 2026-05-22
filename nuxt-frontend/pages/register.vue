<template>
  <div class="min-h-screen bg-white flex items-center justify-center p-4">
    <UCard class="w-full max-w-md border-0 shadow-lg">
      <div class="text-center p-6">
        <h1 class="text-2xl font-bold text-green-600">Join The Future</h1>
        <p class="text-gray-600">Start Your Tontine Journey</p>
      </div>

      <div class="p-6">
        <UForm :state="form" @submit="handleRegister" :validate="validate" class="space-y-4">
          <UFormGroup label="Full Name" name="names" :error="errors.names">
            <UInput v-model="form.names" placeholder="Your full name" :disabled="loading" size="lg" required />
          </UFormGroup>

          <UFormGroup label="Email" name="email" :error="errors.email">
            <UInput v-model="form.email" type="email" placeholder="your@email.com" :disabled="loading" size="lg" required />
          </UFormGroup>

          <UFormGroup label="Phone" name="phone" :error="errors.phone">
            <UInput v-model="form.phone" placeholder="0781234567" :disabled="loading" size="lg" required />
          </UFormGroup>

          <UFormGroup label="Password" name="password" :error="errors.password">
            <div class="relative">
              <UInput v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Password" :disabled="loading" size="lg" required />
              <button @click="showPassword = !showPassword" type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10">
                <Icon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-5 h-5" />
              </button>
            </div>
            <template #help>
              <p class="text-xs text-gray-500 mt-1">
                Must contain: uppercase, lowercase, number, symbol (min 8 chars)
              </p>
            </template>
          </UFormGroup>

          <div class="flex items-start gap-2">
            <UCheckbox v-model="form.agreeToTerms" :disabled="loading" required />
            <div class="text-sm text-gray-600">
              I agree to the 
              <NuxtLink to="/terms" target="_blank" class="text-green-600 hover:underline">
                Terms and Conditions
              </NuxtLink>
            </div>
          </div>

          <UButton type="submit" :loading="loading" :disabled="!form.agreeToTerms || !isFormValid || loading" class="w-full justify-center" size="lg" color="green" icon="i-heroicons-users">
            Join The Future
          </UButton>
        </UForm>

        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600">
            Already a member? 
            <NuxtLink to="/login" class="text-green-600 hover:underline">
              Login here
            </NuxtLink>
          </p>
        </div>
      </div>
    </UCard>



    <UModal v-model="showErrorModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-red-600">Registration Failed</h3>
          </div>
        </template>

        <div class="py-4">
          <p class="text-gray-700">{{ errorMessage }}</p>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showErrorModal = false" variant="outline">
              Try Again
            </UButton>
            <UButton @click="navigateTo('/login')" color="green" v-if="errorMessage.includes('already exists')">
              Go to Login
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const toast = useToast()

const form = reactive({
  names: '',
  email: '',
  phone: '',
  password: '',
  agreeToTerms: false
})

const loading = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')
const errors = ref({})
const showPassword = ref(false)

const validate = (state) => {
  const errors = []
  
  if (!state.names || state.names.length < 2) {
    errors.push({ path: 'names', message: 'Full name must be at least 2 characters' })
  } else if (!/^[a-zA-Z\s]+$/.test(state.names)) {
    errors.push({ path: 'names', message: 'Full name can only contain letters and spaces' })
  }
  
  if (!state.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
    errors.push({ path: 'email', message: 'Please enter a valid email address' })
  }
  
  if (!state.phone || !/^07[0-9]{8}$/.test(state.phone)) {
    errors.push({ path: 'phone', message: 'Phone must be 10 digits starting with 07' })
  }
  
  if (!state.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(state.password)) {
    errors.push({ path: 'password', message: 'Password must contain uppercase, lowercase, number, symbol (min 8 chars)' })
  }
  
  return errors
}

const isFormValid = computed(() => {
  return form.names.length >= 2 && 
         /^[a-zA-Z\s]+$/.test(form.names) &&
         /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
         /^07[0-9]{8}$/.test(form.phone) &&
         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(form.password) &&
         form.agreeToTerms
})

const handleRegister = async () => {
  loading.value = true
  
  try {
    const response = await $fetch('http://localhost:3300/api/v1/auth/register', {
      method: 'POST',
      body: {
        names: form.names,
        email: form.email,
        phone: form.phone,
        password: form.password
      }
    })
    
    if (response.success) {
      Object.keys(form).forEach(key => {
        if (key !== 'agreeToTerms') form[key] = ''
      })
      
      toast.add({
        title: '✅ Registration Successful!',
        description: 'Please check your email for verification code',
        color: 'green'
      })
      
      const verificationData = {
        verificationKey: response.verificationKey,
        email: form.email,
        verificationCode: response.verificationCode
      }
      
      sessionStorage.setItem('verificationData', JSON.stringify(verificationData))
      await navigateTo('/verify-email')
    }
    
  } catch (error) {
    let message = 'Registration failed. Please try again.'
    
    if (error.data?.message) {
      if (error.data.message.includes('already exists')) {
        message = 'Account already exists! This email or phone is already registered. Please login instead.'
      } else {
        message = error.data.message
      }
    }
    
    errorMessage.value = message
    showErrorModal.value = true
    
    toast.add({
      title: '❌ Registration Failed',
      description: message,
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