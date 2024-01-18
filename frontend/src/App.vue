<template>
  <v-layout>
    <v-app-bar :elevation="16" :color="tenantBackgroundColor">
      <img
        alt="logo-black"
        :src="`${TENANT_LOGO}`"
        width="200"
        class="d-inline-block align-top ml-2"
        style="cursor: pointer"
      />
      <a :href="`${PATH}/`" style="text-decoration: none; color: inherit">
        <div class="mr-15 ml-4 app-bar-title" style="cursor: pointer">
          {{ TENANT }}
        </div>
      </a>
      <v-spacer></v-spacer>
      <a :href="`${PATH}/pin`">
        <v-btn class="mr-2"> My Travel Records </v-btn>
      </a>
      <a :href="`${PATH}/heatmap`">
        <v-btn class="mr-2"> Heatmap </v-btn>
      </a>
      <!-- display login state -->
      <div v-if="isLoggedIn" class="mr-2">
        <p>Logged in as {{ username }}</p>
      </div>
    </v-app-bar>
    <v-main>
      <RouterView />
    </v-main>
  </v-layout>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { TENANT, PATH, TENANT_LOGO, TENANT_BACKGROUNDCOLOR } from './js/config.js'

import { computed, ref } from 'vue'
import { getUser, login, logout } from './js/user'

// get userDetails from cookie with regex match

let isLoggedIn = computed(() => {
  return getUser() !== null
})

let username = computed(() => {
  return getUser().username
})

let tenantBackgroundColor = ref(TENANT_BACKGROUNDCOLOR || '#ffffff')

console.log('TENANT: ' + TENANT + ' PATH: ' + PATH, 'TENANT_BACKGROUNDCOLOR: ' + TENANT_BACKGROUNDCOLOR)

console.log(document.cookie)
</script>

<style>

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  width: 100%;
  max-width: 200px;

  display: block;
  margin: 0 auto 2rem;
}

/* all nav elements behind each other */
nav {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
</style>
