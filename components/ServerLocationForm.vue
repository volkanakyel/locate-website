<template>
  <div class="w-full max-w-md mx-auto flex flex-col">
    <!-- Header with stagger animation -->
    <div class="mb-8 sm:mb-10 overflow-hidden">
      <p
        class="text-orange-500/80 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mb-3 sm:mb-4 animate-slide-up"
        style="animation-delay: 0.1s"
      >
        Server Discovery
      </p>
      <h1
        class="text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight animate-slide-up"
        style="animation-delay: 0.2s"
      >
        Find where any<br />
        <span class="text-zinc-400">website lives</span>
      </h1>
    </div>

    <!-- Search Form -->
    <form
      @submit.prevent="handleSubmit"
      class="space-y-3 sm:space-y-4 mb-6 sm:mb-8 animate-slide-up"
      style="animation-delay: 0.3s"
    >
      <div class="relative group">
        <!-- Input glow effect -->
        <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-zinc-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>

        <div class="relative">
          <input
            id="domain"
            v-model="domain"
            type="text"
            placeholder="Enter domain..."
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            class="w-full px-4 sm:px-5 py-3.5 sm:py-4 text-base sm:text-lg bg-zinc-900/80 border border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all duration-300"
            :disabled="loading"
          />

          <!-- Domain suffix hint -->
          <div
            v-if="domain && !domain.includes('.')"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm pointer-events-none"
          >
            .com
          </div>
        </div>
      </div>

      <button
        type="submit"
        :disabled="loading || !domain.trim()"
        class="relative w-full py-3.5 sm:py-4 bg-white text-zinc-900 text-sm sm:text-base font-medium rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 active:scale-[0.98] group"
      >
        <span
          class="relative z-10 flex items-center justify-center gap-2 transition-transform duration-300"
          :class="{ '-translate-y-10 opacity-0': loading }"
        >
          Locate Server
          <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>

        <!-- Loading state -->
        <span
          class="absolute inset-0 flex items-center justify-center transition-transform duration-300"
          :class="loading ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'"
        >
          <span class="flex items-center gap-2">
            <span class="loader"></span>
            <span class="text-zinc-600">Searching...</span>
          </span>
        </span>
      </button>
    </form>

    <!-- Quick Examples -->
    <div
      class="animate-slide-up"
      style="animation-delay: 0.4s"
    >
      <p class="text-zinc-600 text-xs uppercase tracking-wider mb-3 text-center sm:text-left">Try these</p>
      <div class="flex flex-wrap justify-center sm:justify-start gap-2">
        <button
          v-for="(example, index) in examples"
          :key="example"
          @click="selectExample(example)"
          class="px-3 sm:px-4 py-2 text-xs sm:text-sm text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 rounded-full transition-all duration-300 active:scale-95"
          :style="{ animationDelay: `${0.45 + index * 0.05}s` }"
        >
          {{ example }}
        </button>
      </div>
    </div>

    <!-- Results Area -->
    <div class="mt-6 sm:mt-8 min-h-[140px] sm:min-h-[160px]">
      <Transition name="result" mode="out-in">
        <!-- Error State -->
        <div
          v-if="error && !loading"
          key="error"
          class="relative overflow-hidden"
        >
          <div class="relative bg-zinc-900/50 backdrop-blur-sm border border-red-900/50 rounded-2xl p-4 sm:p-5">
            <!-- Error badge -->
            <div class="flex items-center gap-2 mb-4">
              <span class="relative flex h-2 w-2">
                <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span class="text-xs text-red-400 font-medium tracking-wide uppercase">Error</span>
            </div>

            <!-- Error message -->
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p class="text-sm text-red-300 font-medium">Could not locate server</p>
                <p class="text-xs text-zinc-500 mt-1">{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Display -->
        <div
          v-else-if="showResult && result"
          key="results"
          class="relative overflow-hidden"
        >
          <!-- Result card -->
          <div class="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <!-- Status badge -->
            <div class="flex items-center gap-2 mb-4">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span class="text-xs text-emerald-400 font-medium tracking-wide uppercase">Located</span>
            </div>

            <!-- Result grid -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-0.5">
                <p class="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider">Country</p>
                <p class="text-sm sm:text-base font-medium text-white">{{ result.country }}</p>
              </div>
              <div class="space-y-0.5">
                <p class="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider">City</p>
                <p class="text-sm sm:text-base font-medium text-white">{{ result.city }}</p>
              </div>
              <div class="space-y-0.5">
                <p class="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider">IP Address</p>
                <p class="text-xs sm:text-sm font-mono text-zinc-300">{{ result.ip }}</p>
              </div>
              <div class="space-y-0.5">
                <p class="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider">Provider</p>
                <p class="text-xs sm:text-sm text-zinc-300 truncate">{{ result.provider }}</p>
              </div>
            </div>

            <!-- Decorative corner -->
            <div class="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
              <div class="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!loading"
          key="empty"
          class="flex flex-col items-center justify-center py-6 sm:py-8"
        >
          <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-zinc-800 flex items-center justify-center mb-3 sm:mb-4">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <p class="text-zinc-500 text-xs sm:text-sm text-center leading-relaxed">
            Enter a domain to discover<br />
            <span class="text-zinc-600">where it's hosted worldwide</span>
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface ServerResult {
  success: boolean
  domain: string
  ip: string
  country: string
  countryCode: string
  city: string
  region: string
  coordinates: {
    lat: number
    lon: number
  }
  provider: string
  organization: string
  timezone: string
  error?: string
}

const emit = defineEmits<{
  search: [domain: string]
}>()

const props = defineProps<{
  loading: boolean
  hasResult?: boolean
  serverResult?: ServerResult | null
  error?: string | null
}>()

const domain = ref('')
const showResult = ref(false)

// Compute result from props for display
const result = computed(() => {
  if (props.serverResult) {
    return {
      country: props.serverResult.country,
      city: props.serverResult.city,
      ip: props.serverResult.ip,
      provider: props.serverResult.provider,
      countryCode: props.serverResult.countryCode
    }
  }
  return null
})

const examples = ['google.com', 'bbc.co.uk', 'abc.net.au', 'alibaba.com']

const selectExample = (example: string) => {
  domain.value = example
}

const handleSubmit = () => {
  if (domain.value.trim()) {
    showResult.value = false
    emit('search', domain.value)
  }
}

// Watch for serverResult prop to control visibility
watch(() => props.serverResult, (val) => {
  if (val && val.success) {
    showResult.value = true
  }
})

// Reset showResult when loading starts
watch(() => props.loading, (val) => {
  if (val) {
    showResult.value = false
  }
})

// Also watch for error to potentially show error state
watch(() => props.error, (val) => {
  if (val) {
    showResult.value = false
  }
})
</script>

<style scoped>
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  opacity: 0;
  animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.result-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.result-leave-active {
  transition: all 0.2s ease-out;
}
.result-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}
.result-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #18181b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Smooth focus transitions */
input:focus {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
}
</style>
