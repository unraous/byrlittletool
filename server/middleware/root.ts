import { defineEventHandler, setResponseHeader } from 'h3';
import { processFirmware } from '~/utils/process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';
import { getUserFromToken } from '~/server/utils/auth';
import { getCerts } from '~/server/utils/certs';

export default defineEventHandler(async (event) => {
  console.log('======= 收到请求 =======');
  console.log(`路径: ${event.path}, 方法: ${event.method}`);
  
  if (event.path === '/' && event.method === 'POST') {
    console.log('处理根路径POST请求');
    console.log('请求头:', JSON.stringify(event.node.req.headers, null, 2));
    
    // 兼容 Expect: 100-continue
    if (event.node.req.headers['expect'] === '100-continue') {
      console.log('检测到Expect头，发送100 Continue响应');
      event.node.res.writeContinue();
    }
    
    try {
      // 1. 获取 token
      console.log('步骤1: 获取Authorization头');
      const auth = event.node.req.headers['authorization'];
      if (!auth?.startsWith('Bearer ')) {
        console.log('错误: 没有提供有效的Bearer Token');
        event.node.res.statusCode = 401;
        return 'Unauthorized';
      }
      const token = auth.slice(7);
      console.log('获取到Token:', token.substring(0, 8) + '...');

      try {
        // 2. 验证token
        console.log('步骤2: 验证Token');
        const username = await getUserFromToken(token) ?? (() => { throw new Error('Invalid token'); })();
        console.log('Token有效，用户名:', username);
        
        // 3. 获取证书
        console.log('步骤3: 获取证书');
        const certDict = await getCerts();
        const certKey = Object.keys(certDict)[0];
        console.log('证书键:', certKey);
        const certContent = certDict[certKey] || '';
        console.log('证书长度:', certContent.length);
        
        // 4. 流式处理文件数据
        console.log('步骤4: 处理上传文件');
        const uploadTempFile = path.join(os.tmpdir(), `upload-${Date.now()}.bin`);
        console.log('临时文件路径:', uploadTempFile);
        const writeStream = fs.createWriteStream(uploadTempFile);
        
        console.log('开始将请求体写入临时文件...');
        await pipeline(event.node.req, writeStream);
        console.log('请求体已写入临时文件');
        
        // 5. 从临时文件读取并处理
        console.log('步骤5: 读取临时文件');
        const fileStats = fs.statSync(uploadTempFile);
        console.log('临时文件大小:', fileStats.size, '字节');

        // 修复大文件处理逻辑
        console.log('步骤6: 分块处理大文件');
        let processedBuffer; // 在外部声明变量

        if (fileStats.size > 100 * 1024 * 1024) { // 文件大于100MB时分块处理
          console.log('文件过大，使用流式处理');
          
          const outputTempFile = path.join(os.tmpdir(), `processed-${Date.now()}.bin`);
          
          // 直接传入文件路径，让processFirmware处理流式计算
          processedBuffer = processFirmware(uploadTempFile, certContent, username, {
            streaming: true,
            outputPath: outputTempFile
          });
          
          console.log('流式处理完成，文件大小:', processedBuffer.length);
        } else {
          // 小文件直接处理
          const fileBuffer = fs.readFileSync(uploadTempFile);
          processedBuffer = processFirmware(fileBuffer, certContent, username);
        }

        // 6. 清理临时文件
        console.log('步骤7: 清理临时文件');
        fs.unlinkSync(uploadTempFile);
        console.log('临时文件已删除');
        
        // 7. 返回处理后的文件
        console.log('步骤8: 返回处理后的文件');
        setResponseHeader(event, 'Content-Type', 'application/octet-stream');
        setResponseHeader(event, 'Content-Disposition', 'attachment; filename="processed.bin"');
        console.log('======= 请求处理完成 =======');
        return processedBuffer;
      } catch (error) {
        console.log('认证或处理失败:', error);
        event.node.res.statusCode = 401;
        return 'Authentication failed: ' + ((error as any).message || 'Unknown error');
      }
    } catch (error) {
      console.log('整体处理失败:', error);
      event.node.res.statusCode = 500;
      return 'Processing failed: ' + ((error as any).message || 'Unknown error');
    }
  }
  
  // 不处理非根路径POST请求
  console.log('不处理的请求类型:', event.path, event.method);
  return;
});