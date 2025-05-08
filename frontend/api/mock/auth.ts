/**
 * 模擬認證服務
 * 
 * 此文件提供前端模擬認證功能，用於開發和測試環境
 * 實際生產環境應替換為真實的後端 API 調用
 */
/*
* 使用 HS256 演算法進行簽名，純前端環境中可以正常執行
* 有後端 API 後，需修改 mockLogin() 和 mockVerifyToken()，替換成真的 API 
* 前端邏輯（如角色管理、Cookie 存儲等）可以保持不變
* 現在是純前端
*/

import { v4 as uuidv4 } from 'uuid';
import * as jose from 'jose';

/**
 * 預設用戶列表
 */
const defaultUsers = [
  {
    id: "teacher-001",
    email: "teacher@fcu.edu.tw",
    password: "teacher123",
    role: "teacher",
    studentId: "",
    department: "經濟學系",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "ta-001",
    email: "ta@fcu.edu.tw",
    password: "ta123",
    role: "ta",
    studentId: "D0123456",
    department: "經濟學系",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "student-001",
    email: "student@mail.fcu.edu.tw",
    password: "student123",
    role: "student",
    studentId: "D0987654",
    department: "經濟學系",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  }
];

// 建立一個固定的密鑰用於開發環境
// 在實際生產環境中，這應該是從安全的環境變量中獲取
const JWT_SECRET_KEY = 'economic-brain-jwt-secret-key-for-development-environment';

/**
 * 創建真正的 JWT 令牌
 * 前端開發環境下使用 jose 庫實現
 * 
 * @param payload 要編碼的數據
 * @returns JWT 令牌
 */
export async function createJWT(payload: any): Promise<string> {
  // 創建密鑰
  const secretKey = new TextEncoder().encode(JWT_SECRET_KEY);
  
  // 創建 JWT
  const jwt = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' }) // 使用 HMAC SHA-256
    .setIssuedAt() // 設置發行時間
    .setExpirationTime('7d') // 7天有效期
    .sign(secretKey); // 使用密鑰簽名
  
  return jwt;
}

/**
 * 驗證 JWT 令牌
 * 
 * @param token JWT 令牌
 * @returns 驗證結果
 */
export async function verifyJWT(token: string): Promise<{
  valid: boolean;
  payload?: any;
  error?: string;
}> {
  try {
    // 創建密鑰
    const secretKey = new TextEncoder().encode(JWT_SECRET_KEY);
    
    // 驗證 JWT
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    return { valid: true, payload };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : '令牌驗證失敗' 
    };
  }
}

// 初始化模擬用戶數據
export function initMockUsers() {
  if (typeof window !== 'undefined') {
    // 檢查 localStorage 是否已有用戶數據
    const existingUsers = localStorage.getItem('users');
    if (!existingUsers) {
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
  }
}

/**
 * 模擬登入功能
 * 
 * @param email 用戶郵箱
 * @param password 用戶密碼（使用明文或哈希）
 * @param role 用戶角色
 * @returns 登入結果，成功時包含 JWT 令牌和用戶數據
 */
export async function mockLogin(email: string, password: string, role: string) {
  if (typeof window === 'undefined') {
    return { success: false, message: '只能在瀏覽器端使用' };
  }

  // 獲取模擬用戶列表
  const usersJson = localStorage.getItem('users');
  if (!usersJson) {
    return { success: false, message: '找不到用戶數據' };
  }

  const users = JSON.parse(usersJson);
  
  // 查找匹配的用戶
  const user = users.find((u: any) => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password && 
    u.role === role
  );

  if (!user) {
    return { success: false, message: '帳號、密碼或身份別錯誤' };
  }

  try {
    // 創建 JWT token payload
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name || '',
    };
    
    // 使用 jose 庫創建真正的 JWT
    const jwtToken = await createJWT(tokenPayload);

    // 更新最後登入時間
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('users', JSON.stringify(users));

    // 返回登入成功的結果
    return {
      success: true,
      jwt_token: jwtToken,
      role: user.role,
      userData: {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department
      }
    };
  } catch (error) {
    console.error('JWT 創建失敗:', error);
    return { 
      success: false, 
      message: '認證系統錯誤，請稍後再試' 
    };
  }
}

/**
 * 模擬註冊功能
 * 
 * @param email 用戶郵箱
 * @param password 用戶密碼
 * @param role 用戶角色
 * @param studentId 學號（可選）
 * @param department 系所（可選）
 * @returns 註冊結果
 */
export async function mockRegister(
  email: string, 
  password: string, 
  role: string, 
  studentId: string = '', 
  department: string = ''
) {
  if (typeof window === 'undefined') {
    return { success: false, message: '只能在瀏覽器端使用' };
  }

  // 獲取現有用戶列表
  const usersJson = localStorage.getItem('users');
  if (!usersJson) {
    return { success: false, message: '用戶數據初始化錯誤' };
  }

  const users = JSON.parse(usersJson);
  
  // 檢查用戶是否已存在
  const existingUser = users.find((u: any) => 
    u.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    return { success: false, message: '此電子郵件已被註冊' };
  }

  // 創建新用戶
  const newUser = {
    id: `${role}-${uuidv4().substring(0, 8)}`,
    email,
    password,
    role,
    studentId,
    department,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  // 添加到用戶列表
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  try {
    // 創建 JWT token payload
    const tokenPayload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role
    };
    
    // 使用 jose 庫創建真正的 JWT
    const jwtToken = await createJWT(tokenPayload);

    // 返回註冊成功的結果
    return {
      success: true,
      jwt_token: jwtToken,
      role: newUser.role,
      userData: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        studentId: newUser.studentId,
        department: newUser.department
      }
    };
  } catch (error) {
    console.error('JWT 創建失敗:', error);
    return { 
      success: false, 
      message: '認證系統錯誤，請稍後再試' 
    };
  }
}

/**
 * 模擬檢查 JWT 令牌有效性
 * 僅用於開發和測試環境
 * 
 * @param token JWT令牌
 * @returns 驗證結果
 */
export async function mockVerifyToken(token: string) {
  if (typeof window === 'undefined' || !token) {
    return { valid: false };
  }

  try {
    const result = await verifyJWT(token);
    
    return result.valid
      ? { valid: true, userData: result.payload }
      : { valid: false, error: result.error };
  } catch (error) {
    console.error('JWT 驗證錯誤:', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : '令牌驗證失敗' 
    };
  }
}