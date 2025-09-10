import crypto from 'crypto';

const ENCRYPTION_KEY = "12345678901234567890123456789012"; // 32 
const IV = "1234567890123456"; // 16

export const encrypt = (text) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
