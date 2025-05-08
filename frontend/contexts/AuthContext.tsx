// Code by AkinoAlice@TyrantRey
import { createContext, useState, useEffect } from "react";
import {
  setCookie,
  getCookie,
  hasCookie,
  deleteCookie,
} from "cookies-next";
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";
import { useContext } from "react";
import { TAuthRole, UserInfo } from "@/types/Auth";
import { mockVerifyToken } from "@/api/mock/auth";

export const AuthContext = createContext<TAuthRole>({
  role: "未登入",
  setRole: (role: string) => { },
  isLoggedIn: false,
  logout: () => { },
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
  const { language } = useContext(LangContext);

  // 將後端角色值轉換為前端顯示名稱
  const getRoleDisplayName = (roleValue: string): string => {
    switch (roleValue) {
      case 'student':
        return LanguageTable.login.role.student[language];
      case 'ta':
        return LanguageTable.login.role.ta[language];
      case 'teacher':
        return LanguageTable.login.role.teacher[language];
      default:
        return LanguageTable.nav.role.unsigned[language];
    }
  };

  // 初始化時從 Cookie 讀取用戶狀態
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 檢查 JWT 和用戶信息 Cookie 是否存在
        if (hasCookie("jwt") && hasCookie("userInfo")) {
          const jwtToken = getCookie("jwt") as string;
          
          // 驗證 JWT 令牌
          const verifyResult = await mockVerifyToken(jwtToken);
          
          if (verifyResult.valid) {
            // 從 Cookie 解析用戶信息
            const userInfoStr = getCookie("userInfo") as string;
            const parsedUser = JSON.parse(userInfoStr);
            
            // 檢查 role cookie 是否存在並與 userInfo 一致
            const roleCookie = getCookie("role");
            
            if (roleCookie && roleCookie === parsedUser.role) {
              // 設置用戶信息
              setUserInfo(parsedUser);

              // 設置角色顯示名稱
              const displayRole = getRoleDisplayName(parsedUser.role);
              setRoleState(displayRole);
              console.log("Auth initialized with role:", displayRole);
            } else {
              // role cookie 與 userInfo 不一致，更新 role cookie
              console.log("Role cookie inconsistent, updating...");
              if (parsedUser.role) {
                setCookie("role", parsedUser.role, { path: "/" });
                const displayRole = getRoleDisplayName(parsedUser.role);
                setRoleState(displayRole);
                setUserInfo(parsedUser);
              } else {
                console.log("User info exists but no role found, resetting to unsigned");
                resetAuthState();
              }
            }
          } else {
            console.log("JWT 驗證失敗:", verifyResult.error);
            resetAuthState();
          }
        } else {
          console.log("No valid auth cookies found");
          resetAuthState();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // 錯誤時重置狀態
        resetAuthState();
      }
    };

    // 重置認證狀態
    const resetAuthState = () => {
      setRoleState(LanguageTable.nav.role.unsigned[language]);
      setUserInfo(null);
      // 清除可能損壞的 cookie
      const cookieOptions = { path: '/' };
      deleteCookie("jwt", cookieOptions);
      deleteCookie("role", cookieOptions);
      deleteCookie("userInfo", cookieOptions);
    };

    // 執行初始化
    initAuth();
    
    // 監聽 storage 事件，確保在不同標籤頁間保持一致性（僅用於 localStorage，對 Cookie 無效，但保留以備未來使用）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userInfo' || e.key === 'jwt') {
        initAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]); // 添加 language 作為依賴項

  // 封裝 setRole 函數
  const setRole = (newRole: string) => {
    setRoleState(newRole);
  };

  /**
   * 登出功能
   * 清除用戶數據並重置狀態
   */
  const logout = () => {
    // 設置通用 Cookie 選項，確保刪除時路徑匹配
    const cookieOptions = {
      path: "/",
    };
    
    // 刪除所有認證相關的 Cookies
    deleteCookie("jwt", cookieOptions);
    deleteCookie("role", cookieOptions);
    deleteCookie("userInfo", cookieOptions);

    // 重置狀態
    setRoleState(LanguageTable.nav.role.unsigned[language]);
    setUserInfo(null);
    
    console.log("User logged out");
  };

  // 調試輸出當前狀態
  useEffect(() => {
    console.log("Current auth state:", { 
      role, 
      isLoggedIn: role !== LanguageTable.nav.role.unsigned[language],
      userInfo: userInfo ? `User ${userInfo.email}` : "No user info"
    });
  }, [role, userInfo, language]);

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        isLoggedIn: role !== LanguageTable.nav.role.unsigned[language],
        logout,
        userInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
