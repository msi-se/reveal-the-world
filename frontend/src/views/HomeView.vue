<template>
    <h1>Home</h1>
    <div v-if="isLoggedIn">
        <p>Logged in as {{ email }}</p>
        <button @click="logout">Logout</button>
    </div>
    <div v-else>
        <button @click="login">Login</button>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { getUser, login, logout } from '../js/user';

// get userDetails from cookie with regex match

let isLoggedIn = computed(() => {
    return getUser() !== null;
});

let email = computed(() => {
    return getUser().email;
});

console.log(getUser());

</script>
