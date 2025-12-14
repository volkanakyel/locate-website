<template>
  <div
    ref="cursorRef"
    class="custom-cursor"
    :class="{
      'cursor-clicking': isClicking,
      'cursor-hovering': isHovering,
      'cursor-visible': isVisible
    }"
  >
    <svg
      class="cursor-pointer"
      viewBox="0 0 36 36"
      fill="none"
    >
      <!-- Main pointer shape with white border -->
      <path
        d="M6 30L18 4L30 30L18 22L6 30Z"
        fill="#18181b"
        stroke="white"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const cursorRef = ref<HTMLElement | null>(null)
const isClicking = ref(false)
const isHovering = ref(false)
const isVisible = ref(false)

// Use non-reactive variables for performance-critical position tracking
let mouseX = 0
let mouseY = 0
let cursorX = 0
let cursorY = 0
let animationId: number | null = null
let isTouchDevice = false

// Check if this is a touch-only device
function checkTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  )
}

// Smooth lerp function
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

// Animation loop using direct DOM manipulation for performance
function animate() {
  if (!cursorRef.value || isTouchDevice) return

  // Higher factor = snappier cursor (0.25 is responsive but still smooth)
  const smoothFactor = 0.25

  cursorX = lerp(cursorX, mouseX, smoothFactor)
  cursorY = lerp(cursorY, mouseY, smoothFactor)

  // Direct DOM manipulation for best performance
  cursorRef.value.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`

  animationId = requestAnimationFrame(animate)
}

function handleMouseMove(e: MouseEvent) {
  mouseX = e.clientX
  mouseY = e.clientY

  // Show cursor on first mouse movement
  if (!isVisible.value) {
    // Initialize cursor position immediately on first move
    cursorX = mouseX
    cursorY = mouseY
    isVisible.value = true
  }
}

function handleMouseDown() {
  isClicking.value = true
}

function handleMouseUp() {
  isClicking.value = false
}

function handleMouseEnter() {
  if (!isTouchDevice) {
    isVisible.value = true
  }
}

function handleMouseLeave() {
  isVisible.value = false
}

function handleMouseOver(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('a, button, [role="button"], input, textarea, select, [data-cursor-hover]')) {
    isHovering.value = true
  }
}

function handleMouseOut(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('a, button, [role="button"], input, textarea, select, [data-cursor-hover]')) {
    isHovering.value = false
  }
}

onMounted(() => {
  // Check for touch device
  isTouchDevice = checkTouchDevice()

  if (isTouchDevice) {
    // Don't initialize cursor on touch devices
    return
  }

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove, { passive: true })
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mouseover', handleMouseOver, { passive: true })
  document.addEventListener('mouseout', handleMouseOut, { passive: true })
  document.documentElement.addEventListener('mouseenter', handleMouseEnter)
  document.documentElement.addEventListener('mouseleave', handleMouseLeave)

  // Start animation loop
  animationId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('mouseover', handleMouseOver)
  document.removeEventListener('mouseout', handleMouseOut)
  document.documentElement.removeEventListener('mouseenter', handleMouseEnter)
  document.documentElement.removeEventListener('mouseleave', handleMouseLeave)

  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 25px;
  height: 25px;
  pointer-events: none;
  z-index: 99999;
  margin-left: -12px;
  margin-top: -4px;
  will-change: transform;
  opacity: 0;
  transition: opacity 0.15s ease-out;
}

.custom-cursor.cursor-visible {
  opacity: 1;
}

.cursor-pointer {
  width: 25px;
  height: 25px;
  transform: rotate(-45deg);
  transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Clicking state */
.cursor-clicking .cursor-pointer {
  transform: rotate(-45deg) scale(0.85);
}

/* Hovering interactive elements */
.cursor-hovering .cursor-pointer {
  transform: rotate(-45deg) scale(1.2);
}

/* Hide on touch devices */
@media (hover: none) and (pointer: coarse) {
  .custom-cursor {
    display: none !important;
  }
}
</style>
