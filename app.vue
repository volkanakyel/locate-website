<template>
  <div id="app-root">
    <ClientOnly>
      <CustomCursor />
    </ClientOnly>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  // Check if touch device and add class to html element
  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches

  if (!isTouchDevice) {
    document.documentElement.classList.add('custom-cursor-enabled')
  }
})
</script>

<style>
/* Hide default cursor globally when custom cursor is enabled */
html.custom-cursor-enabled,
html.custom-cursor-enabled * {
  cursor: none !important;
}

/* Ensure cursor is hidden on all interactive elements too */
html.custom-cursor-enabled a,
html.custom-cursor-enabled button,
html.custom-cursor-enabled input,
html.custom-cursor-enabled textarea,
html.custom-cursor-enabled select,
html.custom-cursor-enabled [role="button"],
html.custom-cursor-enabled [tabindex] {
  cursor: none !important;
}

/* Ensure iframes and embeds also hide cursor */
html.custom-cursor-enabled iframe,
html.custom-cursor-enabled embed,
html.custom-cursor-enabled object {
  cursor: none !important;
}

/* Fallback: Show default cursor on touch devices */
@media (hover: none) and (pointer: coarse) {
  html,
  html * {
    cursor: auto !important;
  }
}
</style>
