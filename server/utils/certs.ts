import fs from 'node:fs';
import path from 'node:path';

/**
 * 从配置文件读取证书信息
 */
export async function getCerts(): Promise<Record<string, string>> {
  const certsFilePath = path.resolve(process.cwd(), 'certs/server.crt');
  
  try {
    // 直接读取证书文件内容
    const certContent = await fs.promises.readFile(certsFilePath, 'utf-8');
    
    // 返回单个键值对字典
    return { 
      cert: certContent 
    };
  } catch (error) {
    console.error('Error reading cert file:', error);
    // 如果文件不存在或读取错误，返回空证书
    return { cert: '' };
  }
}