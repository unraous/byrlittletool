import { defineEventHandler, createError, readBody, setCookie } from 'h3';
import { createHash } from 'crypto';
import { Users } from '~/types/users';
import users from '~/config/users.json' assert { type: 'json' };

const typedUsers: Users = users;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;
  
  if (!username || !password) {
    return createError({ statusCode: 400, message: 'Username and password required' });
  }
  
  const user = typedUsers[username as keyof Users];
  const passwordHash = createHash('sha256').update(password).digest('hex');
  
  if (!user || passwordHash !== user.passwordHash) {
    return createError({ statusCode: 401, message: 'Invalid credentials' });
  }
  
  // 创建会话
  const session = Buffer.from(JSON.stringify({ username, timestamp: Date.now() })).toString('base64');
  
  setCookie(event, 'session', session, {
    httpOnly: true,
    path: '/',
    maxAge: 3600,
    sameSite: 'strict'
  });
  
  return {
    success: true,
    username,
    token: user.token
  };
});