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
      case 'admin':
        return LanguageTable.nav.role.admin[language];
      default:
        return LanguageTable.nav.role.unsigned[language];
    }
  };

  // 初始化時從 Cookie 讀取用戶狀態
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 檢查 JWT 和用戶信息 Cookie 是否存在
        if (hasCookie("jwt") || hasCookie("userInfo") || hasCookie("role")) {
          // 嘗試從各種來源獲取角色信息
          const roleCookie = getCookie("role") as string;
          const userInfoStr = getCookie("userInfo") as string;
          let parsedUser = null;
          
          try {
            if (userInfoStr) {
              parsedUser = JSON.parse(userInfoStr);
            }
          } catch (e) {
            console.error("Failed to parse userInfo:", e);
          }
          
          // 如果已經有顯示角色名稱但沒有原始角色值，則手動設置原始角色值
          if (role !== LanguageTable.nav.role.unsigned[language] && (!parsedUser || !parsedUser.role)) {
            // 從顯示名稱判斷原始角色值
            let originalRole = null;
            
            if (role === LanguageTable.login.role.teacher[language]) {
              originalRole = 'teacher';
            } else if (role === LanguageTable.login.role.ta[language]) {
              originalRole = 'ta';
            } else if (role === LanguageTable.nav.role.admin[language]) {
              originalRole = 'admin';
            } else if (role === LanguageTable.login.role.student[language]) {
              originalRole = 'student';
            }
            
            if (originalRole) {
              // 創建或更新 userInfo
              const newUserInfo: UserInfo = parsedUser || {
                id: "auto-generated-id",
                email: "user@example.com",
                username: "自動創建用戶"
              };
              
              newUserInfo.role = originalRole;
              
              // 保存 userInfo 到 Cookie
              setCookie("role", originalRole, { path: "/" });
              setCookie("userInfo", JSON.stringify(newUserInfo), { path: "/" });
              
              // 更新狀態
              setUserInfo(newUserInfo);
              console.log("從顯示角色建立原始角色:", originalRole);
              return; // 提早返回，避免執行後面的代碼
            }
          }
          
          // 嘗試從 JWT 驗證或其他來源獲取信息
          let displayRole = role;
          
          if (parsedUser && parsedUser.role) {
            // 從 userInfo 取得角色
            displayRole = getRoleDisplayName(parsedUser.role);
            setRoleState(displayRole);
            setUserInfo(parsedUser);
            
            // 確保 role cookie 與 userInfo 一致
            setCookie("role", parsedUser.role, { path: "/" });
            console.log("從 userInfo 設置角色:", parsedUser.role, "顯示為:", displayRole);
          } else if (roleCookie) {
            // 從 role cookie 取得角色
            displayRole = getRoleDisplayName(roleCookie);
            setRoleState(displayRole);
            
            // 如果 userInfo 不存在或無效，創建一個新的
            const newUserInfo: UserInfo = {
              id: "cookie-based-id",
              email: "user@example.com",
              username: "Cookie用戶",
              role: roleCookie
            };
            
            setUserInfo(newUserInfo);
            setCookie("userInfo", JSON.stringify(newUserInfo), { path: "/" });
            console.log("從 role cookie 設置角色:", roleCookie, "顯示為:", displayRole);
          } else {
            // 所有驗證都失敗，重置狀態
            console.log("無法驗證用戶狀態，重置");
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
    
    // 監聽 storage 事件
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userInfo' || e.key === 'jwt' || e.key === 'role') {
        initAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language, role]); // 添加 role 作為依賴項

  // 封裝 setRole 函數，確保同時更新 userInfo
  const setRole = (newRole: string) => {
    console.log("Setting role to:", newRole);
    // 如果是直接設定的原始角色值 (如 'teacher'、'ta')
    if (['teacher', 'ta', 'student', 'admin'].includes(newRole)) {
      const displayRole = getRoleDisplayName(newRole);
      setRoleState(displayRole);
      
      // 更新 userInfo，確保 role 與顯示角色匹配
      if (userInfo) {
        const updatedUserInfo = { ...userInfo, role: newRole };
        setUserInfo(updatedUserInfo);
        setCookie("userInfo", JSON.stringify(updatedUserInfo), { path: "/" });
        setCookie("role", newRole, { path: "/" });
        console.log("Updated userInfo with role:", newRole, "顯示為:", displayRole);
      } else {
        // 如果 userInfo 不存在，創建模擬用戶
        const mockUser: UserInfo = {
          id: "mock-user-id",
          email: "mock-user@example.com",
          role: newRole,
          username: "Mock User"
        };
        setUserInfo(mockUser);
        setCookie("userInfo", JSON.stringify(mockUser), { path: "/" });
        setCookie("role", newRole, { path: "/" });
        console.log("Created mock userInfo with role:", newRole, "顯示為:", displayRole);
      }
    } else {
      // 如果是顯示名稱，則直接設定
      setRoleState(newRole);
      console.log("Set role display name directly to:", newRole);
    }
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
      userInfo: userInfo ? {
        email: userInfo.email,
        role: userInfo.role,
        username: userInfo.username
      } : "No user info"
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
