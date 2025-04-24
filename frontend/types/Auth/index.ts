/**
 * 認證系統的類型定義
 */

/**
 * 用戶信息類型
 */
export type UserInfo = {
  id?: string;
  role?: string;
  email?: string;
  studentId?: string;
  department?: string;
  [key: string]: any; // 允許其他屬性
};

/**
 * 認證上下文類型
 */
export type TAuthRole = {
  role: string;
  setRole: (role: string) => void;
  isLoggedIn: boolean;
  logout: () => void;
  userInfo: UserInfo | null;
};