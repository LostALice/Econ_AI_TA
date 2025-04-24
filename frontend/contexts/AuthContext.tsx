/**
 * AuthContext.tsx
 * 
 * 此檔案實現了應用程序的身份認證上下文，用於管理用戶登入狀態和角色權限。
 * 
 * 功能:
 * - 管理用戶登入狀態 (isLoggedIn)
 * - 存儲和更新用戶角色 (role: 學生/助教/教師)
 * - 提供登出功能
 * - 跨瀏覽器標籤頁同步登入狀態 (透過 localStorage 事件監聽)
 * - 保持用戶會話狀態 (透過 localStorage 持久化)
 * 
 * 資料結構:
 * - role: 字串，表示用戶角色 ('學生', '助教', '教師' 或 '未登入')
 * - userInfo: 包含用戶詳細信息的對象
 */

import { createContext, useState, useEffect } from "react";
import { TAuthRole, UserInfo } from "@/types/Auth";

// 創建認證上下文，設定默認值
export const AuthContext = createContext<TAuthRole>({
  role: "未登入",
  setRole: (role: string) => {},
  isLoggedIn: false,
  logout: () => {},
  userInfo: null,
});

/**
 * AuthProvider 元件
 * 
 * 提供認證上下文給應用程序的所有子元件。
 * 管理用戶身份狀態並提供相關功能。
 * 
 * @param {React.ReactNode} children - 子元件
 * @returns {React.ReactElement} 包含認證上下文的 Provider 元件
 */
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [role, setRoleState] = useState<string>("未登入");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // 初始化時從 localStorage 讀取用戶狀態
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // 設置用戶信息
          setUserInfo(parsedUser);
          
          // 設置角色顯示名稱
          if (parsedUser.role) {
            const displayRole = getRoleDisplayName(parsedUser.role);
            setRoleState(displayRole);
            console.log("Auth initialized with role:", displayRole);
          }
        } else {
          console.log("No stored user found");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };
    
    // 執行初始化
    initAuth();
    
    // 添加存儲事件監聽，以便在其他標籤頁修改 localStorage 時響應
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'currentUser') {
        if (event.newValue) {
          const user = JSON.parse(event.newValue);
          setUserInfo(user);
          setRoleState(getRoleDisplayName(user.role));
        } else {
          setUserInfo(null);
          setRoleState("未登入");
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * 將後端角色值轉換為前端顯示名稱
   * 
   * @param {string} roleValue - 後端存儲的角色值
   * @returns {string} 轉換後的角色顯示名稱
   */
  const getRoleDisplayName = (roleValue: string): string => {
    switch (roleValue) {
      case 'student':
        return '學生';
      case 'ta':
        return '助教';
      case 'teacher':
        return '教師';
      default:
        return '未登入';
    }
  };

  /**
   * 設置用戶角色的函數
   * 
   * @param {string} newRole - 新角色值
   */
  const setRole = (newRole: string) => {
    setRoleState(newRole);
  };

  /**
   * 登出功能
   * 清除用戶數據並重置狀態
   */
  const logout = () => {
    setRoleState("未登入");
    setUserInfo(null);
    localStorage.removeItem('currentUser');
    console.log("User logged out");
  };
  
  // 調試輸出當前認證狀態
  useEffect(() => {
    console.log("Current auth state:", { role, isLoggedIn: role !== "未登入" });
  }, [role]);

  return (
    <AuthContext.Provider 
      value={{ 
        role, 
        setRole, 
        isLoggedIn: role !== "未登入",
        logout,
        userInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
