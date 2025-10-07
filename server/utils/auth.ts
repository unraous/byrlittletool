import fs from 'node:fs';
import path from 'node:path';
import { UserData } from '~/types';
/**
 * 从配置文件读取token对应的用户信息
 */
export async function getUserFromToken(token: string): Promise<string> {
  const usersFilePath = path.resolve(process.cwd(), 'config/users.json');
  
  try {
    const usersContent = await fs.promises.readFile(usersFilePath, 'utf-8');
    const users: Record<string, UserData> = JSON.parse(usersContent);
    
    // 遍历用户查找匹配的token
    for (const [username, userData] of Object.entries(users)) {
      if (userData.token === token) {
        return username;
      }
    }
    
    throw new Error('Invalid token');
  } catch (error) {
    console.error('Error reading users file:', error);
    throw new Error('Authentication failed');
  }
}