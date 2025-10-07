<template>
  <div class="app-container">
    <el-config-provider>
      <el-container>
        <el-header>
          <h1>文件处理工具</h1>
          <div v-if="isLoggedIn" class="user-info">
            <span>欢迎, {{ currentUser }}</span>
            <el-button @click="logout" size="small" type="text">登出</el-button>
          </div>
        </el-header>
        <el-main>
          <NuxtPage />
        </el-main>
        <el-footer>
          <p>© 2025 文件处理工具</p>
        </el-footer>
      </el-container>
    </el-config-provider>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isLoggedIn = ref(false);
const currentUser = ref('');

function handleLoginSuccess(username) {
  isLoggedIn.value = true;
  currentUser.value = username;
}

function logout() {
  isLoggedIn.value = false;
  currentUser.value = '';
}
</script>