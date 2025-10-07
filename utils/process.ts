import CryptoJS from 'crypto-js';
import fs from 'node:fs';
import crypto from 'node:crypto';

/**
 * 处理固件和证书，生成新文件内容
 * 新文件 = 固件 + HMAC_SHA256(text=证书+MD5(固件), key=用户名)
 * @param firmware Buffer|ArrayBuffer|string 固件内容或文件路径
 * @param cert string 证书内容
 * @param username string 用户名
 * @param options 处理选项
 * @returns Blob|Buffer 新文件内容
 */
export function processFirmware(
  firmware: Buffer | ArrayBuffer | string, 
  cert: string, 
  username: string,
  options: {
    onlyReturnHmac?: boolean;
    streaming?: boolean;
    outputPath?: string;
  } = {}
): Buffer | Blob {
  console.log('processFirmware 开始处理');
  
  // 首先判断环境
  if (typeof window !== 'undefined') {
    // 浏览器环境，使用原来的逻辑
    console.log('浏览器环境，使用原始逻辑');
    return processBrowserLogic(firmware as ArrayBuffer, cert, username);
  }
  
  // 服务端环境
  console.log('服务端环境');
  
  // 如果传入的是文件路径字符串，使用流式处理
  if (typeof firmware === 'string') {
    console.log('检测到文件路径，使用流式处理:', firmware);
    return processLargeFile(firmware, cert, username, options);
  }
  
  // 服务端内存处理逻辑
  console.log('使用服务端内存处理，输入类型:', Buffer.isBuffer(firmware) ? 'Buffer' : 'ArrayBuffer');
  return processServerMemory(firmware, cert, username, options.onlyReturnHmac || false);
}

/**
 * 浏览器环境的原始处理逻辑
 */
function processBrowserLogic(firmware: ArrayBuffer, cert: string, username: string): Blob {
  console.log('使用浏览器处理逻辑');
  
  // 固件转WordArray
  const firmwareWordArray = CryptoJS.lib.WordArray.create(firmware);
  console.log('固件大小:', firmware.byteLength);

  // 固件MD5
  const firmwareMd5 = CryptoJS.MD5(firmwareWordArray);
  console.log('固件MD5:', firmwareMd5.toString());

  // 证书内容转WordArray
  const certWordArray = CryptoJS.enc.Utf8.parse(cert);
  console.log('证书长度:', cert.length);

  // 拼接证书和MD5
  const textWordArray = certWordArray.concat(firmwareMd5);

  // HMAC_SHA256(text, key=username)
  console.log('用户名:', username);
  const hmac = CryptoJS.HmacSHA256(textWordArray, username);
  console.log('HMAC生成完成:', hmac.toString().substring(0, 20) + '...');

  // 拼接固件和HMAC
  const resultWordArray = firmwareWordArray.concat(hmac);

  // 导出为Uint8Array
  const resultUint8 = new Uint8Array(resultWordArray.sigBytes);
  for (let i = 0; i < resultWordArray.sigBytes; i++) {
    resultUint8[i] = (resultWordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  console.log('生成Blob，大小:', resultUint8.length);
  return new Blob([resultUint8]);
}

/**
 * 流式处理大文件（服务端）
 */
function processLargeFile(
  filePath: string, 
  cert: string, 
  username: string, 
  options: { onlyReturnHmac?: boolean; outputPath?: string } = {}
): Buffer {
  console.log('开始流式处理大文件');
  
  // 1. 流式计算文件MD5
  const md5Hash = crypto.createHash('md5');
  const data = fs.readFileSync(filePath);
  md5Hash.update(data);
  const firmwareMd5 = md5Hash.digest('hex');
  console.log('文件MD5计算完成:', firmwareMd5);
  
  // 2. 计算HMAC（只处理证书+MD5，数据量小）
  const certWordArray = CryptoJS.enc.Utf8.parse(cert);
  const md5WordArray = CryptoJS.enc.Hex.parse(firmwareMd5);
  const textWordArray = certWordArray.concat(md5WordArray);
  const hmac = CryptoJS.HmacSHA256(textWordArray, username);
  const hmacBuffer = Buffer.from(hmac.toString(CryptoJS.enc.Hex), 'hex');
  console.log('HMAC计算完成，大小:', hmacBuffer.length);
  
  if (options.onlyReturnHmac) {
    return hmacBuffer;
  }
  
  // 3. 如果指定了输出路径，直接写入文件
  if (options.outputPath) {
    console.log('将结果写入输出文件:', options.outputPath);
    fs.copyFileSync(filePath, options.outputPath);
    fs.appendFileSync(options.outputPath, hmacBuffer);
    return fs.readFileSync(options.outputPath);
  }
  
  // 4. 否则在内存中合并（适用于较小的文件）
  const originalBuffer = fs.readFileSync(filePath);
  return Buffer.concat([originalBuffer, hmacBuffer]);
}

/**
 * 服务端内存处理（原有逻辑）
 */
function processServerMemory(
  firmware: Buffer | ArrayBuffer, 
  cert: string, 
  username: string,
  onlyReturnHmac: boolean
): Buffer {
  console.log('使用服务端内存处理');
  
  try {
    // 固件转WordArray
    let firmwareWordArray;
    if (Buffer.isBuffer(firmware)) {
      firmwareWordArray = CryptoJS.lib.WordArray.create(new Uint8Array(firmware));
    } else {
      firmwareWordArray = CryptoJS.lib.WordArray.create(firmware);
    }
    
    const firmwareMd5 = CryptoJS.MD5(firmwareWordArray);
    const certWordArray = CryptoJS.enc.Utf8.parse(cert);
    const textWordArray = certWordArray.concat(firmwareMd5);
    const hmac = CryptoJS.HmacSHA256(textWordArray, username);
    
    const hmacBuffer = Buffer.from(hmac.toString(CryptoJS.enc.Hex), 'hex');
    if (onlyReturnHmac) {
      return hmacBuffer;
    } else {
      if (Buffer.isBuffer(firmware)) {
        return Buffer.concat([firmware, hmacBuffer]);
      } else {
        const firmwareBuffer = Buffer.from(firmware);
        return Buffer.concat([firmwareBuffer, hmacBuffer]);
      }
    }
  } catch (error) {
    console.error('处理固件时出错:', error);
    throw error;
  }
}