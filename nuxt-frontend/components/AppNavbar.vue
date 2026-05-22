<template>
  <nav class="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 dark:bg-gray-900/95 dark:border-gray-700">
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-3">
          <img src="/assets/logo/logo.png" alt="The Future" class="h-16 w-16 rounded-full object-cover" />
          <span class="text-xl font-bold text-gray-900 dark:text-white">The Future</span>
        </div>
        
        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <NuxtLink to="/" active-class="text-emerald-600 dark:text-emerald-400" class="text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white">Home</NuxtLink>
          <NuxtLink to="/#pricing" active-class="text-emerald-600 dark:text-emerald-400" class="text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white">Membership</NuxtLink>
          <NuxtLink to="/#about" active-class="text-emerald-600 dark:text-emerald-400" class="text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white">About</NuxtLink>
          <NuxtLink to="/#constitution" active-class="text-emerald-600 dark:text-emerald-400" class="text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white">Constitution</NuxtLink>
          <NuxtLink to="/#contact" active-class="text-emerald-600 dark:text-emerald-400" class="text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white">Contact</NuxtLink>
        </div>
        
        <!-- Desktop Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <UButton @click="toggleColorMode" variant="ghost" class="p-2">
            <Icon :name="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'" class="w-5 h-5" />
          </UButton>
          <UButton @click="navigateTo('/login')" variant="ghost" style="color: #1e5e3e;" class="dark:text-green-400">Sign In</UButton>
          <UButton @click="navigateTo('/apply')" style="background-color: #1e5e3e; color: white;" class="px-6 py-2">Get Started</UButton>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden flex items-center space-x-2">
          <UButton @click="toggleColorMode" variant="ghost" class="p-2">
            <Icon :name="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'" class="w-5 h-5" />
          </UButton>
          <UButton @click="toggleMobileMenu" variant="ghost" class="p-2">
            <Icon :name="isMobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="w-6 h-6" />
          </UButton>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-if="isMobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div class="px-4 py-4 space-y-3">
          <NuxtLink to="/" @click="closeMobileMenu" active-class="text-emerald-600 dark:text-emerald-400" class="block text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white py-2">Home</NuxtLink>
          <NuxtLink to="/#pricing" @click="closeMobileMenu" active-class="text-emerald-600 dark:text-emerald-400" class="block text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white py-2">Membership</NuxtLink>
          <NuxtLink to="/#about" @click="closeMobileMenu" active-class="text-emerald-600 dark:text-emerald-400" class="block text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white py-2">About</NuxtLink>
          <NuxtLink to="/#constitution" @click="closeMobileMenu" active-class="text-emerald-600 dark:text-emerald-400" class="block text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white py-2">Constitution</NuxtLink>
          <NuxtLink to="/#contact" @click="closeMobileMenu" active-class="text-emerald-600 dark:text-emerald-400" class="block text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white py-2">Contact</NuxtLink>
          <div class="pt-4 space-y-3">
            <UButton @click="navigateToLogin" variant="ghost" style="color: #1e5e3e;" class="dark:text-green-400 w-full justify-center">Sign In</UButton>
            <UButton @click="navigateToApply" style="background-color: #1e5e3e; color: white;" class="w-full justify-center">Get Started</UButton>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const isMobileMenuOpen = ref(false)

const toggleColorMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const navigateToLogin = () => {
  closeMobileMenu()
  navigateTo('/login')
}

const navigateToApply = () => {
  closeMobileMenu()
  navigateTo('/apply')
}
</script>
