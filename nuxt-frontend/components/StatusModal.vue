<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />
        
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
          <!-- Success Modal -->
          <div v-if="type === 'success'" class="text-center p-8">
            <div class="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
              <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">{{ title || 'Success!' }}</h3>
            <p class="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">{{ message }}</p>
            <UButton @click="handleAction" color="emerald" size="lg" class="w-full justify-center">
              {{ actionText || 'Continue' }}
            </UButton>
          </div>

          <!-- Warning Modal -->
          <div v-else-if="type === 'warning'" class="text-center p-8">
            <div class="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">{{ title || 'Warning!' }}</h3>
            <p class="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">{{ message }}</p>
            <div class="flex gap-3">
              <UButton @click="close" color="gray" variant="outline" size="lg" class="flex-1 justify-center">
                Cancel
              </UButton>
              <UButton @click="handleAction" color="amber" size="lg" class="flex-1 justify-center">
                {{ actionText || 'Proceed' }}
              </UButton>
            </div>
          </div>

          <!-- Error Modal -->
          <div v-else-if="type === 'error'" class="text-center p-8">
            <div class="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
              <UIcon name="i-heroicons-x-circle" class="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">{{ title || 'Error!' }}</h3>
            <p class="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">{{ message }}</p>
            <UButton @click="handleAction" color="red" size="lg" class="w-full justify-center">
              {{ actionText || 'Close' }}
            </UButton>
          </div>

          <!-- Info Modal -->
          <div v-else class="text-center p-8">
            <div class="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
              <UIcon name="i-heroicons-information-circle" class="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">{{ title || 'Information' }}</h3>
            <p class="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">{{ message }}</p>
            <UButton @click="handleAction" color="blue" size="lg" class="w-full justify-center">
              {{ actionText || 'Got it' }}
            </UButton>
          </div>

          <!-- Close button -->
          <button @click="close" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'success', // success, warning, error, info
    validator: (value) => ['success', 'warning', 'error', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  actionText: {
    type: String,
    default: ''
  },
  onAction: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['close', 'action'])

const close = () => {
  emit('close')
}

const handleAction = () => {
  if (props.onAction) {
    props.onAction()
  }
  emit('action')
  close()
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.9);
  opacity: 0;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s ease-out;
}
</style>
