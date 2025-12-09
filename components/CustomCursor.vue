<template>
  <div
    ref="cursorRef"
    class="custom-cursor"
    :class="{ 'cursor-clicking': isClicking, 'cursor-hovering': isHovering }"
    :style="{
      transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`
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
import { onMounted, onUnmounted, reactive, ref } from 'vue'

const cursorRef = ref<HTMLElement | null>(null)
const isClicking = ref(false)
const isHovering = ref(false)

// Target position (actual mouse)
const mousePos = reactive({ x: 0, y: 0 })
// Smoothed cursor position
const cursorPos = reactive({ x: 0, y: 0 })

let animationId: number | null = null

// Smooth lerp function
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

// Animation loop for smooth following
function animate() {
  // Smooth factor - lower = smoother/slower, higher = snappier
  const smoothFactor = 0.18

  cursorPos.x = lerp(cursorPos.x, mousePos.x, smoothFactor)
  cursorPos.y = lerp(cursorPos.y, mousePos.y, smoothFactor)

  animationId = requestAnimationFrame(animate)
}

function handleMouseMove(e: MouseEvent) {
  mousePos.x = e.clientX
  mousePos.y = e.clientY
}

function handleMouseDown() {
  isClicking.value = true
}

function handleMouseUp() {
  isClicking.value = false
}

function handleMouseOver(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('a, button, [role="button"], input, textarea, select, .cursor-pointer')) {
    isHovering.value = true
  }
}

function handleMouseOut(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('a, button, [role="button"], input, textarea, select, .cursor-pointer')) {
    isHovering.value = false
  }
}

onMounted(() => {
  // Initialize cursor position
  cursorPos.x = window.innerWidth / 2
  cursorPos.y = window.innerHeight / 2
  mousePos.x = window.innerWidth / 2
  mousePos.y = window.innerHeight / 2

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mouseover', handleMouseOver)
  document.addEventListener('mouseout', handleMouseOut)

  // Start animation loop
  animationId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('mouseover', handleMouseOver)
  document.removeEventListener('mouseout', handleMouseOut)

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
  z-index: 9999;
  margin-left: -14px;
  margin-top: -3px;
  will-change: transform;
}

.cursor-pointer {
  width: 25px;
  height: 25px;
  transform: rotate(-50deg);
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}

/* Clicking state */
.cursor-clicking .cursor-pointer {
  transform: rotate(-15deg) scale(0.85);
}

/* Hovering interactive elements */
.cursor-hovering .cursor-pointer {
  transform: rotate(-15deg) scale(1.15);
}

/* Hide on touch devices */
@media (hover: none) and (pointer: coarse) {
  .custom-cursor {
    display: none;
  }
}
</style>
