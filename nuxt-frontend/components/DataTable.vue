<template>
  <div class="w-full">
    <!-- Search and Filters -->
    <div class="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div class="relative flex-1">
        <input 
          v-model="searchQuery" 
          :placeholder="searchPlaceholder" 
          class="w-full px-4 py-2.5 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                 text-sm sm:text-base"
          type="search"
          aria-label="Search"
        />
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="list-style: none; display: inline-block;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <USelect 
        v-if="filters.length > 0"
        v-model="selectedFilter" 
        :options="filters" 
        class="w-full sm:w-40"
        placeholder="Filter..."
      />
    </div>

    <!-- Loading State -->
    <LoadingSpinner v-if="loading" :text="loadingText" />
    
    <!-- Desktop Table View -->
    <div v-else-if="!isMobile" class="overflow-x-auto -mx-4 sm:mx-0">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="item in paginatedData" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td 
              v-for="column in columns" 
              :key="column.key"
              class="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 dark:text-gray-100"
              :class="column.class || ''"
            >
              <slot :name="column.key" :item="item" :value="getNestedValue(item, column.key)">
                {{ formatValue(getNestedValue(item, column.key), column.type) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div v-else class="space-y-3">
      <div v-for="item in paginatedData" :key="item.id" 
           class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div v-for="column in columns" :key="column.key" class="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide pr-4">
            {{ column.label }}
          </span>
          <span class="text-sm text-gray-900 dark:text-gray-100 text-right flex-1">
            <slot :name="column.key" :item="item" :value="getNestedValue(item, column.key)">
              {{ formatValue(getNestedValue(item, column.key), column.type) }}
            </slot>
          </span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
      <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredData.length) }} of {{ filteredData.length }} {{ itemName }}
      </div>
      <UPagination 
        v-if="totalPages > 1" 
        v-model="currentPage" 
        :page-count="totalPages" 
        :total="filteredData.length"
        size="sm"
      />
    </div>
  </div>
</template>

<script setup>
// Detect mobile view
const isMobile = ref(false)

onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 640
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
  onUnmounted(() => window.removeEventListener('resize', checkMobile))
})

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: 'Search...' },
  loadingText: { type: String, default: 'Loading...' },
  itemName: { type: String, default: 'items' },
  filters: { type: Array, default: () => [] },
  itemsPerPage: { type: Number, default: 6 }
})

const searchQuery = ref('')
const selectedFilter = ref('')
const currentPage = ref(1)

// Memoized search function for better performance
const searchInItem = (item, query, columns) => {
  return columns.some(column => {
    const value = getNestedValue(item, column.key)
    return String(value || '').toLowerCase().includes(query)
  })
}

const filteredData = computed(() => {
  let filtered = props.data
  
  // Search across all fields with memoization
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => searchInItem(item, query, props.columns))
  }
  
  // Apply filter
  if (selectedFilter.value && props.filters.length > 0) {
    const filterConfig = props.filters.find(f => f.value === selectedFilter.value)
    if (filterConfig && filterConfig.filterFn) {
      filtered = filtered.filter(filterConfig.filterFn)
    }
  }
  
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / props.itemsPerPage))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredData.value.slice(start, end)
})

// Reset pagination when search/filter changes
watch([searchQuery, selectedFilter], () => {
  currentPage.value = 1
})

// Optimized nested value getter with caching
const valueCache = new Map()
const getNestedValue = (obj, path) => {
  const cacheKey = `${obj.id}-${path}`
  if (valueCache.has(cacheKey)) {
    return valueCache.get(cacheKey)
  }
  
  const value = path.split('.').reduce((current, key) => current?.[key], obj)
  valueCache.set(cacheKey, value)
  return value
}

const formatValue = (value, type) => {
  if (!value && value !== 0) return ''
  
  switch (type) {
    case 'currency':
      return `RWF ${Number(value).toLocaleString()}`
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'status':
      return String(value).charAt(0).toUpperCase() + String(value).slice(1)
    default:
      return value
  }
}

// Clear cache when data changes
watch(() => props.data, () => {
  valueCache.clear()
})
</script>
