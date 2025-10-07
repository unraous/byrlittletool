# byrTool API 文档

实现了基本的前端页面，登录登出，TOKEN，以及POST /
实现了大文件流式处理，本地在cmd和浏览器使用978MB文件均测试通过
Token会在注册之后自动生成（使用uuid），请在浏览器复制
**大文件请务必加-H "Expect:"（）**，不然Nuxt会报错

## 依赖
很常规了
```bash
npm install
```
## 运行

```bash
npm run dev
```

## API

#### POST /

处理上传的固件文件，添加 HMAC 签名。

**curl 示例**

```bash
# 基本用法
curl -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Expect:" \
  --data-binary "@firmware.bin" \
  http://localhost:3000/ \
  -o processed_firmware.bin

# PowerShell 用法
Invoke-WebRequest -Method POST `
  -Headers @{"Authorization"="Bearer $API_TOKEN"} `
  -InFile "firmware.bin" `
  -Uri "http://localhost:3000/" `
  -OutFile "processed_firmware.bin"
```

**处理逻辑**

1. 验证 Bearer Token
2. 获取用户名和证书
3. 计算固件文件的 MD5 哈希
4. 生成 HMAC-SHA256(证书 + MD5, key=用户名)
5. 返回 原文件 + HMAC 的合并结果

**由于时间原因，UI极烂，代码比UI烂，凑活看看吧（至少功能都实现了**
**（再也不拖到最后做了···）**
