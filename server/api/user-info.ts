import { defineEventHandler, getHeader, createError } from 'h3';
import users from '../../config/users.json' assert { type: 'json' };

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return createError({ statusCode: 401, message: 'Invalid authorization header' });
  }
  const token = authHeader.substring(7);

  // 查找用户
  const userEntry = Object.entries(users).find(([_, user]) => user.token === token);
  if (!userEntry) {
    return createError({ statusCode: 401, message: 'Token invalid' });
  }
  const username = userEntry[0];

  return { username };
});