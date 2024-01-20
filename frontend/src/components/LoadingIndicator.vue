<template>
  <v-progress-circular class="floating-spinner" indeterminate color="primary"></v-progress-circular>
</template>

<script></script>

<style scoped>
.floating-spinner {
    position: absolute;
    float: left;
    bottom: 5px;
    left: 5px;
    z-index: 100000;
}
</style>
