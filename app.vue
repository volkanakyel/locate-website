<template>
  <div class="app-wrapper">
    <CustomCursor />
    <NuxtPage />
  </div>
</template>

<style>
/* Hide default cursor globally */
.app-wrapper,
.app-wrapper * {
  cursor: none !important;
}

/* Show default cursor on touch devices */
@media (hover: none) and (pointer: coarse) {
  .app-wrapper,
  .app-wrapper * {
    cursor: auto !important;
  }
}
</style>
