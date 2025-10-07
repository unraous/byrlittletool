import { defineEventHandler, setResponseHeader } from 'h3';
import { processFirmware } from '~/utils/process';
import { $fetch } from 'ofetch';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;

  if (method === 'POST') {
    // 兼容 Expect: 100-continue
    console.log('POST headers:', event.node.req.headers);
    if (event.node.req.headers['expect'] === '100-continue') {
      event.node.res.writeContinue();
    }
    try {
      // 1. 获取 token
      const auth = event.node.req.headers['authorization'];
      if (!auth?.startsWith('Bearer ')) {
        event.node.res.statusCode = 401;
        return 'Unauthorized';
      }
      const token = auth.slice(7);

      // 2. 转发到 user-info 路由鉴权
      try {
        const userData = await $fetch('/api/user-info', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const username = userData.username;
        
        // 3. 获取证书
        const certDict = await $fetch('/api/get-crt');
        const certContent = certDict[Object.keys(certDict)[0]] || '';
        
        // 4. 使用流式处理文件数据
        // 创建临时文件来存储上传的数据
        const uploadTempFile = path.join(os.tmpdir(), `upload-${Date.now()}.bin`);
        const writeStream = fs.createWriteStream(uploadTempFile);
        
        // 将请求体写入临时文件
        await pipeline(event.node.req, writeStream);
        
        // 5. 从临时文件读取并处理
        const fileBuffer = fs.readFileSync(uploadTempFile);
        const arrayBuffer = new Uint8Array(fileBuffer).buffer;
        
        // 处理文件
        const processedBuffer = processFirmware(arrayBuffer, certContent, username);
        
        // 6. 清理临时文件
        fs.unlinkSync(uploadTempFile);
        
        // 7. 返回处理后的文件
        setResponseHeader(event, 'Content-Type', 'application/octet-stream');
        setResponseHeader(event, 'Content-Disposition', 'attachment; filename="processed.bin"');
        return processedBuffer;
      } catch (error) {
        // API 调用失败
        event.node.res.statusCode = 401;
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : undefined;
        return 'Authentication failed: ' + (errorMessage || 'Unknown error');
      }
    } catch (error) {
      // 整体处理失败
      event.node.res.statusCode = 500;
      return 'Processing failed: ' + ((error as { message?: string }).message || 'Unknown error');
    }
  }

  event.node.res.statusCode = 405;
  return 'Method Not Allowed';
});