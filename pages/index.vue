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
          />
        </div>

        <div class="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
      <div class="flex justify-center pb-4 lg:pb-6">
        <div class="flex items-center gap-2 text-zinc-600 text-xs">
          <span class="hidden sm:inline">Drag to rotate</span>
          <span class="hidden sm:inline">•</span>
          <span>Click marker for details</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ServerLocation {
  country: string
  city: string
  ip: string
  coordinates: { lat: number; lon: number }
  provider: string
  countryCode: string
}

// Mock data for server locations
const mockServerData: Record<string, ServerLocation> = {
  'google.com': {
    country: 'United States',
    city: 'Mountain View, CA',
    ip: '142.250.185.46',
    coordinates: { lat: 37.4056, lon: -122.0775 },
    provider: 'Google LLC',
    countryCode: 'US'
  },
  'github.com': {
    country: 'United States',
    city: 'San Francisco, CA',
    ip: '140.82.121.4',
    coordinates: { lat: 37.7749, lon: -122.4194 },
    provider: 'GitHub, Inc.',
    countryCode: 'US'
  },
  'bbc.co.uk': {
    country: 'United Kingdom',
    city: 'London',
    ip: '151.101.192.81',
    coordinates: { lat: 51.5074, lon: -0.1278 },
    provider: 'BBC',
    countryCode: 'GB'
  },
  'alibaba.com': {
    country: 'China',
    city: 'Hangzhou',
    ip: '106.11.248.146',
    coordinates: { lat: 30.2741, lon: 120.1551 },
    provider: 'Alibaba Group',
    countryCode: 'CN'
  },
  'amazon.com': {
    country: 'United States',
    city: 'Seattle, WA',
    ip: '205.251.242.103',
    coordinates: { lat: 47.6062, lon: -122.3321 },
    provider: 'Amazon.com, Inc.',
    countryCode: 'US'
  },
  'spotify.com': {
    country: 'Sweden',
    city: 'Stockholm',
    ip: '35.186.224.25',
    coordinates: { lat: 59.3293, lon: 18.0686 },
    provider: 'Spotify AB',
    countryCode: 'SE'
  },
  'toyota.com': {
    country: 'Japan',
    city: 'Tokyo',
    ip: '23.55.161.147',
    coordinates: { lat: 35.6762, lon: 139.6503 },
    provider: 'Toyota Motor Corp',
    countryCode: 'JP'
  },
  'samsung.com': {
    country: 'South Korea',
    city: 'Seoul',
    ip: '52.85.132.99',
    coordinates: { lat: 37.5665, lon: 126.9780 },
    provider: 'Samsung Electronics',
    countryCode: 'KR'
  }
}

const loading = ref(false)
const hasSearched = ref(false)
const targetLocation = ref<{ lat: number; lon: number; country: string; city: string } | null>(null)

const handleSearch = async (domain: string) => {
  loading.value = true

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200))

  // Clean domain input
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()

  // Get mock data or default to Google
  const serverData = mockServerData[cleanDomain] ?? mockServerData['google.com']!

  // Update globe with location
  targetLocation.value = {
    lat: serverData.coordinates.lat,
    lon: serverData.coordinates.lon,
    country: serverData.country,
    city: serverData.city
  }

  loading.value = false
  hasSearched.value = true
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

/* Safe area padding for iPhone notch */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .min-h-\[100dvh\] {
    min-height: 100dvh;
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
