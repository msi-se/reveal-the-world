<template>
    <h1>Home</h1>
    <div v-if="isLoggedIn">
        <p>Logged in as {{ username }}</p>
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

let username = computed(() => {
    return getUser().username;
});

console.log(getUser());

</script>
