<template>
  <div class="login-wrapper">
    <el-card class="login-card" shadow="hover">
      <div class="login-title">
        <span>文件处理工具登录</span>
      </div>
      <el-form :model="passwordForm" :rules="rules" ref="passwordFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="passwordForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" placeholder="请输入密码" show-password clearable />
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="handlePasswordLogin" :loading="loading" style="width: 100%">
        登录
      </el-button>
      <el-button type="text" @click="goRegister" style="width: 93%; color: #409EFF; text-align: center;">
        没有账号？立即注册
      </el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const emit = defineEmits(['login-success']);
const router = useRouter();

const loading = ref(false);

const passwordForm = ref({
  username: '',
  password: ''
});

const passwordFormRef = ref();

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    router.push('/');
  }
});

async function handlePasswordLogin() {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: passwordForm.value.username,
          password: passwordForm.value.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('Token stored in localStorage');
        }
        emit('login-success', passwordForm.value.username);
      } else {
        const error = await response.text();
        ElMessage.error(`登录失败: ${error}`);
        throw new Error(error);
      }
    } catch (error) {
      ElMessage.error(`登录失败: ${error.message}`);
    } finally {
      loading.value = false;
    }
  });
}

function goRegister() {
  router.push('/register');
}
</script>
