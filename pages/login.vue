<template>
  <div>
    <LoginForm v-if="!isLoggedIn" @login-success="handleLoginSuccess" />
    <FileProcess v-else :username="currentUser" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LoginForm from '~/components/LoginForm.vue';
import FileProcess from '~/components/FileProcess.vue';

const isLoggedIn = ref(false);
const currentUser = ref('');

function handleLoginSuccess(username) {
  isLoggedIn.value = true;
  currentUser.value = username;
}
</script>