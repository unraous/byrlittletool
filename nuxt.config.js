export default {
  modules: [
    '@element-plus/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '文件处理工具',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  nitro: {
    temporary: {
      dir: './tmp',
    },
  },
  runtimeConfig: {
    public: {
      maxFileSize: 1073741824 // 1GB
    }
  }
};