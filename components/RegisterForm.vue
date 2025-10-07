<template>
  <div class="login-wrapper">
    <el-card class="login-card" shadow="hover">
      <div class="login-title">
        <span>注册账号</span>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password clearable />
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="onRegister" :loading="loading" style="width: 100%">
        注册
      </el-button>
      <el-button type="text" @click="goLogin" style="width: 93%; color: #409EFF;">
        返回登陆
      </el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = ref({
  username: '',
  password: ''
});
const formRef = ref();
const loading = ref(false);
const message = ref('');

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

async function onRegister() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    message.value = '';
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.value)
      });
      if (res.ok) {
        message.value = '注册成功，请登录！';
        form.value.username = '';
        form.value.password = '';
      } else {
        const err = await res.text();
        message.value = `注册失败：${err}`;
      }
    } catch (e) {
      message.value = `注册失败：${e.message}`;
    } finally {
      loading.value = false;
    }
  });
}

function goLogin() {
  router.push('/login');
}
</script>