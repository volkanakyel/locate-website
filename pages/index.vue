<template>
  <div class="min-h-[100dvh] bg-zinc-950 relative overflow-hidden">
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-[20%] left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[10%] lg:top-[5%] w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-orange-500/5 rounded-full blur-[100px] lg:blur-[120px]"></div>
      <div class="absolute -bottom-[10%] left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-[10%] lg:bottom-[10%] w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-zinc-500/5 rounded-full blur-[80px] lg:blur-[100px]"></div>
      <div class="lg:hidden absolute top-[30%] left-1/2 -translate-x-1/2 w-[100vw] h-[60vh] bg-orange-500/[0.02] rounded-full blur-[80px]"></div>
    </div>

    <div class="relative z-10 min-h-[100dvh] flex flex-col lg:flex-row">
      <div
        class="relative w-full lg:w-1/2 h-[45vh] sm:h-[50vh] lg:h-screen order-1 lg:order-2 flex items-center justify-center"
        :class="{ 'globe-active': hasSearched }"
      >
        <div class="relative w-full h-full flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div class="relative w-full h-full max-w-[400px] lg:max-w-[500px] aspect-square flex items-center justify-center globe-wrapper">
            <InteractiveGlobe :target-location="targetLocation" />
          </div>
        </div>
      </div>
      <div class="relative w-full lg:w-1/2 min-h-[55vh] lg:min-h-screen order-2 lg:order-1 flex items-start lg:items-center justify-center">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-950 lg:hidden pointer-events-none z-10"></div>

        <div class="relative z-20 w-full px-6 sm:px-8 lg:px-12 xl:px-20 py-8 lg:py-0">
          <ServerLocationForm
            @search="handleSearch"
            :loading="loading"
            :has-result="hasSearched"
            :server-result="serverResult"
            :error="error"
          />
        </div>

        <div class="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ServerLocationResult {
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

const loading = ref(false)
const hasSearched = ref(false)
const error = ref<string | null>(null)
const serverResult = ref<ServerLocationResult | null>(null)
const targetLocation = ref<{ lat: number; lon: number; country: string; city: string } | null>(null)

const handleSearch = async (domain: string) => {
  loading.value = true
  error.value = null
  serverResult.value = null

  try {
    const response = await fetch(`/api/server-location?domain=${encodeURIComponent(domain)}`)

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    const data: ServerLocationResult = await response.json()

    if (!data.success) {
      error.value = data.error || 'Failed to locate server'
      loading.value = false
      hasSearched.value = true
      return
    }

    serverResult.value = data

    targetLocation.value = {
      lat: data.coordinates.lat,
      lon: data.coordinates.lon,
      country: data.country,
      city: data.city
    }

    hasSearched.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
    hasSearched.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes bounce-subtle {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(4px); }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}

.globe-wrapper {
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.globe-active .globe-wrapper {
  transform: scale(1.02);
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .min-h-\[100dvh\] {
    min-height: 100dvh;
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
