import { defineEventHandler, readBody, createError } from 'h3';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 用户数据文件路径
const usersFile = path.resolve(process.cwd(), 'config/users.json');

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  if (!username || !password) {
    return createError({ statusCode: 400, message: '用户名和密码不能为空' });
  }

  // 读取现有用户数据
  let users: Record<string, { passwordHash: string; token: string }> = {};
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  }

  if (users[username]) {
    return createError({ statusCode: 409, message: '用户名已存在' });
  }

  const passwordHash = createHash('sha256').update(password).digest('hex');
  const token = uuidv4();

  // 存储新用户
  users[username] = { passwordHash, token };
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');

  return { success: true, username, token };
});