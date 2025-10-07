<template>
  <div class="login-wrapper">
    <el-card class="login-card" shadow="hover" height="400px">
      <div class="login-title">
        <span>文件处理</span>
      </div>
      <el-form :model="form" label-width="120px">
        <el-form-item label="证书选择">
          <el-select v-model="selectedCertName" placeholder="请选择证书" @change="onCertChange" style="width: 220px;">
            <el-option
              v-for="(content, name) in certDict"
              :key="name"
              :label="name"
              :value="name"
            />
            <el-option
              key="custom"
              label="自定义上传"
              value="custom"
            />
          </el-select>
          <el-upload
            v-if="selectedCertName === 'custom'"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleCustomCert"
            accept=".crt,.pem"
            style="margin-top: 8px;"
          >
            <el-button type="primary" size="small">上传证书文件</el-button>
          </el-upload>
          <div v-if="selectedCertName === 'custom' && customCertName" style="margin-top: 8px; color: #409EFF;">
            已上传证书：{{ customCertName }}
          </div>
        </el-form-item>
        <el-form-item label="固件文件">
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="handleFirmwareChange"
            :limit="1"
            accept=".bin,.hex"
            style="width: 320px;"
          >
            <el-button type="primary" style="width: 220px;">选择固件</el-button>
          </el-upload>
          <el-button type="success" style="width: 220px;" @click="processFiles" :loading="processing" :disabled="!canProcess">
            处理文件
          </el-button>
        </el-form-item>
      </el-form>
      <el-result
        v-if="processed"
        icon="success"
        title="文件处理成功（UI简直难看到爆炸）"
        sub-title="您可以下载处理后的文件"
      >
        <template #extra>
          <el-button type="primary" @click="downloadFile">下载文件</el-button>
        </template>
      </el-result>
    </el-card>
    <el-card class="login-card" shadow="hover" height="400px">
      <div class="login-title">
        <span>用户信息</span>
      </div>
      <div class="user-info-content">
        <div v-if="username">
          <span>用户名：</span>
          <b>{{ username }}</b>
        </div>
        <div v-if="token">
          <span>Token：</span>
          <el-input v-model="token" readonly size="small" style="width: 200px; margin-top: 8px;">
            <template #append>
              <el-button @click="copyToken" type="primary" size="small">复制</el-button>
            </template>
          </el-input>
        </div>
        <el-button type="danger" size="small" @click="logout" style="margin-top: 16px;">
          登出
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { processFirmware } from '~/utils/process';

const router = useRouter();

const form = ref({
  firmware: null
});
const processing = ref(false);
const processed = ref(false);
const processedFileUrl = ref('');
const certContent = ref('');
const username = ref('');
const token = ref('');
const selectedCertName = ref('');
const certDict = ref({});
const customCertName = ref('');

const canProcess = computed(() => !!form.value.firmware && !!certContent.value && !!username.value);

function checkLogin() {
  const t = localStorage.getItem('token');
  token.value = t || '';
  if (!t) {
    router.push('/login');
    return false;
  }
  return true;
}

async function fetchUserInfo() {
  const t = localStorage.getItem('token');
  token.value = t || '';
  const response = await fetch('/api/user-info', {
    headers: { 'Authorization': `Bearer ${t}` }
  });
  if (response.ok) {
    const data = await response.json();
    username.value = data.username;
    // 不要在这里赋值 certContent 或 certDict
  } else {
    router.push('/login');
    throw new Error('无法获取用户信息');
  }
}

async function fetchCertDict() {
  const response = await fetch('/api/get-crt');
  if (response.ok) {
    certDict.value = await response.json();
  }
}

function onCertChange(name) {
  certContent.value = certDict.value[name] || '';
}

function handleFirmwareChange(file) {
  form.value.firmware = file.raw;
}

function handleCustomCert(file) {
  customCertName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    certContent.value = e.target.result;
    ElMessage.success('证书上传成功！');
  };
  reader.readAsText(file.raw);
}

async function processFiles() {
  if (!canProcess.value) return;
  processing.value = true;
  try {
    const firmwareArrayBuffer = await form.value.firmware.arrayBuffer();
    const blob = processFirmware(firmwareArrayBuffer, certContent.value, username.value);
    processedFileUrl.value = URL.createObjectURL(blob);
    processed.value = true;
  } catch (error) {
    ElMessage.error(`处理失败: ${error.message}`);
  } finally {
    processing.value = false;
  }
}

function downloadFile() {
  if (processedFileUrl.value && form.value.firmware) {
    // 获取原始文件名和后缀
    const originName = form.value.firmware.name || 'processed_firmware.bin';
    const ext = originName.includes('.') ? originName.substring(originName.lastIndexOf('.')) : '.bin';
    const saveName = 'processed_firmware' + ext;

    const link = document.createElement('a');
    link.href = processedFileUrl.value;
    link.download = saveName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function copyToken() {
  navigator.clipboard.writeText(token.value);
  ElMessage.success('Token已复制');
}

function logout() {
  localStorage.removeItem('token');
  router.push('/login');
}

onMounted(() => {
  fetchCertDict();
  if (checkLogin()) {
    fetchUserInfo();
  }
});
</script>

<style scoped>
.user-info-content {
  font-size: 15px;
  color: #333;
  text-align: center;
}
</style>