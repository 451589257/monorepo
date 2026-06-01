/**
 * 前端密码传输加密工具（浏览器端）。
 *
 * 与后端 RSA 解密约定保持一致：
 * - 算法：RSA-OAEP，哈希 SHA-256
 * - 公钥格式：SPKI / PEM（`-----BEGIN PUBLIC KEY-----`）
 * - 密文编码：Base64
 *
 * 依赖浏览器原生 WebCrypto（`crypto.subtle`），不引入第三方加密库。
 */

const PEM_HEADER = '-----BEGIN PUBLIC KEY-----';
const PEM_FOOTER = '-----END PUBLIC KEY-----';

/** 把 PEM(SPKI) 公钥转成 WebCrypto 需要的 ArrayBuffer */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem.replace(PEM_HEADER, '').replace(PEM_FOOTER, '').replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** ArrayBuffer → Base64 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * 用 RSA 公钥加密密码，返回 Base64 密文。
 *
 * @param plain 明文密码
 * @param publicKeyPem 后端下发的 SPKI/PEM 公钥
 * @returns Base64 编码的密文
 */
export async function encryptPassword(plain: string, publicKeyPem: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
  const encoded = new TextEncoder().encode(plain);
  const cipher = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, encoded);
  return arrayBufferToBase64(cipher);
}
