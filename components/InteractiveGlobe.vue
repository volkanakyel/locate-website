<template>
  <div class="relative flex items-center justify-center w-full h-full">
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${width} ${height}`"
      class="w-full h-full cursor-grab active:cursor-grabbing select-none touch-none"
      preserveAspectRatio="xMidYMid meet"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    />
    <!-- Tooltip -->
    <Transition name="tooltip">
      <div
        v-if="showTooltip && tooltipData"
        class="absolute pointer-events-none z-50 flex flex-col items-center"
        :style="{
          left: (tooltipPosition.x - 4) + 'px',
          top: tooltipPosition.y + 'px',
          transform: 'translate(-50%, -100%)'
        }"
      >
        <!-- Tooltip card -->
        <div class="px-3 py-2 bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl text-center">
          <div class="text-white font-medium text-xs whitespace-nowrap">{{ tooltipData.country }}</div>
          <div class="text-[10px] text-zinc-400 whitespace-nowrap">{{ tooltipData.city }}</div>
        </div>
        <!-- Arrow - centered via flexbox -->
        <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-900 -mt-[1px]"></div>
        <!-- Spacer to dot -->
        <div class="h-3"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3'
import type { FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface TargetLocation {
  lat: number
  lon: number
  country: string
  city: string
}

const props = defineProps<{
  targetLocation?: TargetLocation | null
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const showTooltip = ref(false)
const tooltipData = ref<{ country: string; city: string } | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })

const width = 600
const height = 600

// Non-reactive state for performance
let worldData: any[] = []
let rotation: [number, number] = [0, 0]
let velocity: [number, number] = [0, 0]
let targetRotation: [number, number] | null = null
let highlightedCountryName: string | null = null
let markerCoords: { lat: number; lon: number } | null = null
let lastProjectedCoords: [number, number] | null = null
let isDragging = false
let lastMouse: [number, number] = [0, 0]
let lastTime = 0
let rafId: number | null = null
let momentumRafId: number | null = null
let pulseIntervalId: ReturnType<typeof setInterval> | null = null
let needsRender = false
let isSpinning = false

// Momentum settings
const friction = 0.96
const minVelocity = 0.05

// Globe scale - larger for better visibility
const globeScale = 260

// Country name to ID mapping (Natural Earth country IDs)
const countryNameToId: Record<string, string[]> = {
  'United States': ['840', 'USA'],
  'United Kingdom': ['826', 'GBR'],
  'China': ['156', 'CHN'],
  'Germany': ['276', 'DEU'],
  'France': ['250', 'FRA'],
  'Japan': ['392', 'JPN'],
  'Canada': ['124', 'CAN'],
  'Australia': ['036', 'AUS'],
  'Brazil': ['076', 'BRA'],
  'India': ['356', 'IND'],
  'Russia': ['643', 'RUS'],
  'Netherlands': ['528', 'NLD'],
  'Singapore': ['702', 'SGP'],
  'Ireland': ['372', 'IRL'],
  'Sweden': ['752', 'SWE'],
  'South Korea': ['410', 'KOR'],
}

// Create orthographic projection
function createProjection() {
  return d3.geoOrthographic()
    .scale(globeScale)
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .precision(0.3)
}

// Check if country matches highlighted country
function isHighlightedCountry(d: any): boolean {
  if (!highlightedCountryName) return false
  const ids = countryNameToId[highlightedCountryName]
  if (!ids) return false
  const countryId = String(d.id)
  return ids.includes(countryId)
}

// Clamp latitude to valid range
function clampLat(lat: number): number {
  return Math.max(-60, Math.min(60, lat))
}

// Normalize longitude to -180 to 180 range
function normalizeLon(lon: number): number {
  while (lon > 180) lon -= 360
  while (lon < -180) lon += 360
  return lon
}

// Render loop using requestAnimationFrame
function render() {
  if (!needsRender || !svgRef.value || worldData.length === 0) {
    rafId = requestAnimationFrame(render)
    return
  }

  needsRender = false

  const svg = d3.select(svgRef.value)

  // Create projection with current rotation
  const projection = createProjection()
    .rotate([rotation[0], rotation[1], 0])

  const path = d3.geoPath(projection)

  // Create defs for gradients if not exists
  let defs = svg.select<SVGDefsElement>('defs')
  if (defs.empty()) {
    defs = svg.append('defs')

    // Radial gradient for 3D sphere shading (dark theme)
    const sphereGradient = defs.append('radialGradient')
      .attr('id', 'globe-gradient')
      .attr('cx', '30%')
      .attr('cy', '25%')
      .attr('r', '70%')

    sphereGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3f3f46')
    sphereGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#27272a')
    sphereGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#18181b')

    // Edge glow gradient
    const edgeGradient = defs.append('radialGradient')
      .attr('id', 'edge-shadow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%')

    edgeGradient.append('stop')
      .attr('offset', '80%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0')
    edgeGradient.append('stop')
      .attr('offset', '95%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.03')
    edgeGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.1')

    // Specular highlight
    const highlightGradient = defs.append('radialGradient')
      .attr('id', 'globe-highlight')
      .attr('cx', '25%')
      .attr('cy', '20%')
      .attr('r', '35%')

    highlightGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0.2')
    highlightGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', '0')
  }

  // Sphere background with gradient
  let sphereBg = svg.select<SVGPathElement>('.sphere-bg')
  if (sphereBg.empty()) {
    sphereBg = svg.append('path').attr('class', 'sphere-bg')
      .attr('stroke', 'none')
  }
  sphereBg
    .attr('d', path({ type: 'Sphere' }) || '')
    .attr('fill', 'url(#globe-gradient)')

  // Edge shadow for depth
  let edgeShadow = svg.select<SVGPathElement>('.edge-shadow')
  if (edgeShadow.empty()) {
    edgeShadow = svg.append('path').attr('class', 'edge-shadow')
      .attr('stroke', 'none')
      .attr('pointer-events', 'none')
  }
  edgeShadow
    .attr('d', path({ type: 'Sphere' }) || '')
    .attr('fill', 'url(#edge-shadow)')

  // Separate regular countries from highlighted country
  const regularCountries = worldData.filter(d => !isHighlightedCountry(d))
  const highlightedCountry = worldData.filter(d => isHighlightedCountry(d))

  // Regular countries
  const countries = svg.selectAll<SVGPathElement, any>('.country').data(regularCountries, (d: any) => d.id)

  countries.exit().remove()

  countries.enter()
    .append('path')
    .attr('class', 'country')
    .merge(countries)
    .attr('d', d => path(d) || '')
    .attr('fill', '#3f3f46')
    .attr('stroke', '#52525b')
    .attr('stroke-width', 0.5)

  // Highlighted country (on top)
  const highlighted = svg.selectAll<SVGPathElement, any>('.country-highlighted').data(highlightedCountry, (d: any) => d.id)

  highlighted.exit().remove()

  highlighted.enter()
    .append('path')
    .attr('class', 'country-highlighted')
    .merge(highlighted)
    .attr('d', d => path(d) || '')
    .attr('fill', '#e5e7eb')
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 1.5)
    .raise()

  // Specular highlight overlay
  let highlightPath = svg.select<SVGPathElement>('.globe-highlight')
  if (highlightPath.empty()) {
    highlightPath = svg.append('path').attr('class', 'globe-highlight')
      .attr('stroke', 'none')
      .attr('pointer-events', 'none')
  }
  highlightPath
    .attr('d', path({ type: 'Sphere' }) || '')
    .attr('fill', 'url(#globe-highlight)')
    .raise()

  // Sphere outline
  let spherePath = svg.select<SVGPathElement>('.sphere')
  if (spherePath.empty()) {
    spherePath = svg.append('path').attr('class', 'sphere')
      .attr('fill', 'none')
  }
  spherePath
    .attr('d', path({ type: 'Sphere' }) || '')
    .attr('stroke', '#52525b')
    .attr('stroke-width', 1)
    .raise()

  // Update or create marker
  if (markerCoords) {
    const projected = projection([markerCoords.lon, markerCoords.lat])

    // Check if point is on visible side of globe
    const geoPoint: [number, number] = [markerCoords.lon, markerCoords.lat]
    const distance = d3.geoDistance(geoPoint, [-rotation[0], -rotation[1]])
    const isVisible = distance < Math.PI / 2

    if (projected && isVisible) {
      // Marker group
      let markerGroup = svg.select<SVGGElement>('.marker-group')
      if (markerGroup.empty()) {
        markerGroup = svg.append('g').attr('class', 'marker-group')

        // Invisible hit area for stable hover (prevents flickering)
        markerGroup.append('circle')
          .attr('class', 'marker-hitarea')
          .attr('r', 16)
          .attr('fill', 'transparent')
          .attr('stroke', 'none')
          .style('cursor', 'pointer')
          .on('click', handleMarkerClick)
          .on('mouseenter', handleMarkerEnter)
          .on('mouseleave', handleMarkerLeave)

        // Subtle pulse ring
        markerGroup.append('circle')
          .attr('class', 'marker-pulse')
          .attr('r', 14)
          .attr('fill', 'none')
          .attr('stroke', '#f97316')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.6)
          .style('pointer-events', 'none')

        // Outer glow
        markerGroup.append('circle')
          .attr('class', 'marker-glow-outer')
          .attr('r', 8)
          .attr('fill', '#f97316')
          .attr('opacity', 0.2)
          .style('pointer-events', 'none')

        // Inner glow
        markerGroup.append('circle')
          .attr('class', 'marker-glow')
          .attr('r', 6)
          .attr('fill', '#fb923c')
          .attr('opacity', 0.4)
          .style('pointer-events', 'none')

        // Main dot with orange accent
        markerGroup.append('circle')
          .attr('class', 'marker-dot')
          .attr('r', 4)
          .attr('fill', '#f97316')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5)
          .style('pointer-events', 'none')

        // Start pulse animation
        startPulseAnimation()
      }

      markerGroup
        .attr('transform', `translate(${projected[0]}, ${projected[1]})`)
        .style('opacity', 1)
        .raise() // Always on top

      // Store projected coordinates for resize updates
      lastProjectedCoords = [projected[0], projected[1]]

      // Update tooltip position
      updateTooltipPosition()
    } else {
      svg.select('.marker-group').style('opacity', 0)
    }
  } else {
    svg.select('.marker-group').remove()
    if (pulseIntervalId) {
      clearInterval(pulseIntervalId)
      pulseIntervalId = null
    }
  }

  rafId = requestAnimationFrame(render)
}

// Momentum animation after drag release
function animateMomentum() {
  if (isDragging || isSpinning) return

  // Apply friction
  velocity[0] *= friction
  velocity[1] *= friction

  // Stop if velocity is very low
  if (Math.abs(velocity[0]) < minVelocity && Math.abs(velocity[1]) < minVelocity) {
    velocity = [0, 0]
    // Don't auto-show tooltip - user must click the marker
    return
  }

  // Update rotation
  rotation[0] = normalizeLon(rotation[0] + velocity[0])
  rotation[1] = clampLat(rotation[1] + velocity[1])
  needsRender = true

  momentumRafId = requestAnimationFrame(animateMomentum)
}

// Animate rotation to target
function animateToTarget() {
  if (!targetRotation || isSpinning) return

  isSpinning = true
  velocity = [0, 0] // Stop any momentum

  const startRotation: [number, number] = [rotation[0], rotation[1]]

  // Calculate shortest path for longitude
  let deltaLon = targetRotation[0] - startRotation[0]
  if (deltaLon > 180) deltaLon -= 360
  if (deltaLon < -180) deltaLon += 360

  const endRotation: [number, number] = [
    startRotation[0] + deltaLon,
    targetRotation[1]
  ]

  const duration = 1200
  const startTime = performance.now()

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime
    const t = Math.min(elapsed / duration, 1)
    // Smooth ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3)

    rotation[0] = startRotation[0] + (endRotation[0] - startRotation[0]) * eased
    rotation[1] = startRotation[1] + (endRotation[1] - startRotation[1]) * eased
    needsRender = true

    if (t < 1) {
      requestAnimationFrame(animate)
    } else {
      rotation[0] = normalizeLon(rotation[0])
      isSpinning = false
      showTooltip.value = true
    }
  }

  requestAnimationFrame(animate)
}

// Watch for target location changes
watch(() => props.targetLocation, (newLocation) => {
  if (newLocation) {
    // Set target rotation (negate lon for correct direction)
    targetRotation = [-newLocation.lon, -newLocation.lat]
    highlightedCountryName = newLocation.country
    markerCoords = { lat: newLocation.lat, lon: newLocation.lon }
    tooltipData.value = { country: newLocation.country, city: newLocation.city }
    showTooltip.value = false
    needsRender = true
    animateToTarget()
  }
}, { immediate: true })

onMounted(async () => {
  // Start render loop
  rafId = requestAnimationFrame(render)

  // Add resize listener for tooltip repositioning
  window.addEventListener('resize', handleResize)

  // Add touch event listeners with passive: false to allow preventDefault
  if (svgRef.value) {
    svgRef.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    svgRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    svgRef.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  // Load world data
  try {
    const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    const world: any = await response.json()
    worldData = (feature(world, world.objects.countries) as unknown as FeatureCollection<Geometry>).features
    needsRender = true
  } catch {
    worldData = [{
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]]
      },
      properties: {}
    }]
    needsRender = true
  }
})

// Update tooltip position based on current projected coordinates
function updateTooltipPosition() {
  if (!svgRef.value || !lastProjectedCoords) return

  const svg = svgRef.value
  const point = svg.createSVGPoint()
  point.x = lastProjectedCoords[0]
  point.y = lastProjectedCoords[1]

  // Transform SVG coordinates to screen coordinates
  const ctm = svg.getScreenCTM()
  if (ctm) {
    const screenPoint = point.matrixTransform(ctm)
    const containerRect = svg.parentElement?.getBoundingClientRect()

    if (containerRect) {
      tooltipPosition.value = {
        x: screenPoint.x - containerRect.left,
        y: screenPoint.y - containerRect.top
      }
    }
  }
}

// Handle window resize to update tooltip position
function handleResize() {
  if (showTooltip.value && lastProjectedCoords) {
    updateTooltipPosition()
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  // Remove touch event listeners
  if (svgRef.value) {
    svgRef.value.removeEventListener('touchstart', handleTouchStart)
    svgRef.value.removeEventListener('touchmove', handleTouchMove)
    svgRef.value.removeEventListener('touchend', handleTouchEnd)
  }

  if (rafId) cancelAnimationFrame(rafId)
  if (momentumRafId) cancelAnimationFrame(momentumRafId)
  if (pulseIntervalId) clearInterval(pulseIntervalId)
})

// Start pulse animation using D3 (animates 'r' attribute properly from center)
function startPulseAnimation() {
  if (pulseIntervalId) clearInterval(pulseIntervalId)

  function animatePulse() {
    if (!svgRef.value) return
    const svg = d3.select(svgRef.value)
    const pulse = svg.select('.marker-pulse')
    if (pulse.empty()) return

    pulse
      .attr('r', 6)
      .attr('opacity', 0.7)
      .transition()
      .duration(1800)
      .ease(d3.easeQuadOut)
      .attr('r', 28)
      .attr('opacity', 0)
  }

  // Start immediately and repeat
  animatePulse()
  pulseIntervalId = setInterval(animatePulse, 2000)
}

function getMousePosition(event: MouseEvent | Touch): [number, number] {
  const rect = svgRef.value?.getBoundingClientRect()
  if (!rect) return [0, 0]
  return [event.clientX - rect.left, event.clientY - rect.top]
}

function handleMouseDown(event: MouseEvent) {
  if (isSpinning) return
  isDragging = true
  showTooltip.value = false
  velocity = [0, 0]
  if (momentumRafId) cancelAnimationFrame(momentumRafId)
  lastMouse = getMousePosition(event)
  lastTime = performance.now()
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging) return

  const currentMouse = getMousePosition(event)
  const currentTime = performance.now()
  const dt = Math.max(currentTime - lastTime, 1)

  const dx = currentMouse[0] - lastMouse[0]
  const dy = currentMouse[1] - lastMouse[1]

  // Consistent sensitivity for smooth rotation
  const sensitivity = 0.3

  // Direct rotation update - consistent everywhere
  rotation[0] = normalizeLon(rotation[0] + dx * sensitivity)
  rotation[1] = clampLat(rotation[1] - dy * sensitivity)

  // Track velocity for momentum with time-based smoothing
  const velocityScale = 16 / dt
  const instantVelX = dx * sensitivity * velocityScale
  const instantVelY = -dy * sensitivity * velocityScale

  // Smooth velocity accumulation
  velocity[0] = velocity[0] * 0.7 + instantVelX * 0.3
  velocity[1] = velocity[1] * 0.7 + instantVelY * 0.3

  lastMouse = currentMouse
  lastTime = currentTime
  needsRender = true
}

function handleMouseUp() {
  if (!isDragging) return
  isDragging = false

  // Start momentum animation if there's velocity
  if (Math.abs(velocity[0]) > minVelocity || Math.abs(velocity[1]) > minVelocity) {
    animateMomentum()
  }
  // Don't auto-show tooltip - user must click the marker
}

// Touch handlers
function handleTouchStart(event: TouchEvent) {
  event.preventDefault()
  if (event.touches.length === 1 && !isSpinning) {
    isDragging = true
    showTooltip.value = false
    velocity = [0, 0]
    if (momentumRafId) cancelAnimationFrame(momentumRafId)
    lastMouse = getMousePosition(event.touches[0])
    lastTime = performance.now()
  }
}

function handleTouchMove(event: TouchEvent) {
  event.preventDefault()
  if (event.touches.length === 1 && isDragging) {
    const touch = event.touches[0]
    const currentMouse = getMousePosition(touch)
    const currentTime = performance.now()
    const dt = Math.max(currentTime - lastTime, 1)

    const dx = currentMouse[0] - lastMouse[0]
    const dy = currentMouse[1] - lastMouse[1]

    // Consistent sensitivity for smooth rotation
    const sensitivity = 0.3

    // Direct rotation update - consistent everywhere
    rotation[0] = normalizeLon(rotation[0] + dx * sensitivity)
    rotation[1] = clampLat(rotation[1] - dy * sensitivity)

    // Track velocity for momentum with time-based smoothing
    const velocityScale = 16 / dt
    const instantVelX = dx * sensitivity * velocityScale
    const instantVelY = -dy * sensitivity * velocityScale

    // Smooth velocity accumulation
    velocity[0] = velocity[0] * 0.7 + instantVelX * 0.3
    velocity[1] = velocity[1] * 0.7 + instantVelY * 0.3

    lastMouse = currentMouse
    lastTime = currentTime
    needsRender = true
  }
}

function handleTouchEnd() {
  if (!isDragging) return
  isDragging = false

  if (Math.abs(velocity[0]) > minVelocity || Math.abs(velocity[1]) > minVelocity) {
    animateMomentum()
  }
  // Don't auto-show tooltip - user must click the marker
}

// Handle click on marker to show/toggle tooltip
function handleMarkerClick(event: MouseEvent) {
  event.stopPropagation()
  if (tooltipData.value) {
    showTooltip.value = !showTooltip.value
  }
}

// Handle marker hover enter
function handleMarkerEnter() {
  if (svgRef.value) {
    const svg = d3.select(svgRef.value)
    svg.select('.marker-dot').transition().duration(150).attr('r', 5)
    svg.select('.marker-glow').transition().duration(150).attr('r', 7).attr('opacity', 0.5)
    svg.select('.marker-glow-outer').transition().duration(150).attr('r', 10).attr('opacity', 0.3)
  }
}

// Handle marker hover leave
function handleMarkerLeave() {
  if (svgRef.value) {
    const svg = d3.select(svgRef.value)
    svg.select('.marker-dot').transition().duration(150).attr('r', 4)
    svg.select('.marker-glow').transition().duration(150).attr('r', 6).attr('opacity', 0.4)
    svg.select('.marker-glow-outer').transition().duration(150).attr('r', 8).attr('opacity', 0.2)
  }
}

function handleReset() {
  velocity = [0, 0]
  rotation = [0, 0]
  highlightedCountryName = null
  markerCoords = null
  showTooltip.value = false
  tooltipData.value = null
  needsRender = true
  if (pulseIntervalId) {
    clearInterval(pulseIntervalId)
    pulseIntervalId = null
  }
}
</script>

<style scoped>
/* Animations are handled via D3 JavaScript for proper SVG support */

/* Tooltip transition */
.tooltip-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.tooltip-leave-active {
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
