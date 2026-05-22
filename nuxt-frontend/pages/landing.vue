<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white">
      <div class="absolute inset-0 bg-black opacity-10"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div class="text-center">
          <h1 class="text-4xl sm:text-6xl font-bold mb-6">
            The Future
          </h1>
          <p class="text-xl sm:text-2xl mb-8 text-green-100">
            Digital Tontine Management System
          </p>
          <p class="text-lg mb-12 max-w-3xl mx-auto text-green-50">
            Founded at Runda on 14/01/2024 - A modern savings and investment platform for mutual financial assistance among members
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton @click="navigateTo('/apply')" size="xl" color="white" variant="solid" class="px-8 py-4">
              Start Your Journey
            </UButton>
            <UButton @click="navigateTo('/login')" size="xl" color="green" variant="outline" class="px-8 py-4 border-white text-white hover:bg-white hover:text-green-600">
              Member Login
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Why Choose The Future?</h2>
          <p class="text-lg text-gray-600">Modern technology meets traditional savings wisdom</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6 rounded-lg bg-green-50 border border-green-200">
            <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="i-heroicons-banknotes" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Monthly Savings</h3>
            <p class="text-gray-600">Save 20,000 RWF monthly with your fellow members</p>
          </div>
          
          <div class="text-center p-6 rounded-lg bg-blue-50 border border-blue-200">
            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="i-heroicons-document-text" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Easy Loans</h3>
            <p class="text-gray-600">Access loans up to 2/3 of your savings at 1.7% monthly interest</p>
          </div>
          
          <div class="text-center p-6 rounded-lg bg-purple-50 border border-purple-200">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="i-heroicons-users" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-3">Limited Members</h3>
            <p class="text-gray-600">Exclusive group of maximum 20 committed members</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Constitution Highlights -->
    <div class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Our Constitution</h2>
          <p class="text-lg text-gray-600">Established on 14/01/2024 at Runda</p>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UCard class="p-6">
            <h3 class="text-xl font-semibold mb-4 text-green-600">Key Objectives</h3>
            <ul class="space-y-3 text-gray-700">
              <li class="flex items-start">
                <Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                Promote savings among members
              </li>
              <li class="flex items-start">
                <Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                Facilitate mutual financial assistance
              </li>
              <li class="flex items-start">
                <Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                Foster member advancement activities
              </li>
            </ul>
          </UCard>
          
          <UCard class="p-6">
            <h3 class="text-xl font-semibold mb-4 text-blue-600">Member Benefits</h3>
            <ul class="space-y-3 text-gray-700">
              <li class="flex items-start">
                <Icon name="i-heroicons-currency-dollar" class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                Monthly contribution: 20,000 RWF
              </li>
              <li class="flex items-start">
                <Icon name="i-heroicons-clock" class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                Loan repayment: Maximum 6 months
              </li>
              <li class="flex items-start">
                <Icon name="i-heroicons-shield-check" class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                Interest rate: 1.7% per month
              </li>
            </ul>
          </UCard>
        </div>
        
        <div class="mt-8">
          <UCard class="p-6">
            <h3 class="text-xl font-semibold mb-4 text-purple-600">Leadership Structure</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Executive Committee</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>President: Florien NDAGIJIMANA</li>
                  <li>V/President: Dr. Athanase HATEGEKIMANA</li>
                  <li>Secretary: NIYONGOMBWA Didier</li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Advisors</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>RUZIGANA Victor</li>
                  <li>HABIMANA Adolphe</li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Auditors</h4>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>President: KWIZERA Ivan</li>
                  <li>V/President: DUSABIMANA Edmond</li>
                  <li>Secretary: NIYIRORA Jean Damascene</li>
                </ul>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Rules & Penalties -->
    <div class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Rules & Penalties</h2>
          <p class="text-lg text-gray-600">Clear guidelines for all members</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <UCard class="p-6 border-l-4 border-red-500">
            <h3 class="text-xl font-semibold mb-4 text-red-600">Penalties</h3>
            <ul class="space-y-3 text-gray-700">
              <li class="flex justify-between">
                <span>Unexcused absence</span>
                <span class="font-semibold">5,000 RWF</span>
              </li>
              <li class="flex justify-between">
                <span>Late payment (10th-17th)</span>
                <span class="font-semibold">1,000 RWF</span>
              </li>
              <li class="flex justify-between">
                <span>Payment after 17th</span>
                <span class="font-semibold">1% of contribution</span>
              </li>
              <li class="flex justify-between">
                <span>Late to meeting (15+ min)</span>
                <span class="font-semibold">1,000 RWF</span>
              </li>
            </ul>
          </UCard>
          
          <UCard class="p-6 border-l-4 border-green-500">
            <h3 class="text-xl font-semibold mb-4 text-green-600">Member Obligations</h3>
            <ul class="space-y-3 text-gray-700">
              <li class="flex items-start">
                <Icon name="i-heroicons-check" class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                Monthly contribution of 20,000 RWF
              </li>
              <li class="flex items-start">
                <Icon name="i-heroicons-check" class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                Attend all association meetings
              </li>
              <li class="flex items-start">
                <Icon name="i-heroicons-check" class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                Repay loans within 6 months
              </li>
              <li class="flex items-start">
                <Icon name="i-heroicons-check" class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                Maintain good conduct and morals
              </li>
            </ul>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p class="text-gray-400">
          © 2024 The Future Association. Founded at Runda, Southern Province, Rwanda.
        </p>
        <p class="text-gray-500 mt-2">
          Headquarters: Kamonyi District, Runda Sector, Gihara Cell, Bimba Village
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth'
})
</script>