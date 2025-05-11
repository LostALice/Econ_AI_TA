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

export type TAuthRole = {
  role: string;
  setRole: (role: string) => void;
  isLoggedIn: boolean;
  logout: () => void;
  userInfo: any | null; // 添加用戶信息
};

export const AuthContext = createContext<TAuthRole>({
  role: "未登入",
  setRole: (role: string) => { },
  isLoggedIn: false,
  logout: () => { },
  userInfo: null,
});

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [role, setRoleState] = useState<string>("未登入");
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const { language, setLang } = useContext(LangContext);

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
            setRole(displayRole);
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
          setRoleState(LanguageTable.nav.role.unsigned[language]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  });

  // 轉換角色值為顯示名稱
  const getRoleDisplayName = (roleValue: string): string => {
    switch (roleValue) {
      case 'student':
        return LanguageTable.login.role.student[language];
      case 'ta':
        return LanguageTable.login.role.ta[language];
      case 'teacher':
        return LanguageTable.login.role.teacher[language];
      default:
        return LanguageTable.login.role.unsigned[language];
    }
  };
  // 封裝 setRole 函數
  const setRole = (newRole: string) => {
    setRoleState(newRole);
  };

  // 登出功能
  const logout = () => {
    // copy from default out function
    deleteCookie("role");
    deleteCookie("token");
    // setUsername("");
    // setPassword("");
    const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
    setRole(userRole);

    setRoleState(userRole);
    setUserInfo(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    console.log("User logged out");
  };

  // 調試輸出當前狀態
  useEffect(() => {
    console.log("Current auth state:", { role, isLoggedIn: role !== LanguageTable.nav.role.unsigned[language] });
  }, [role, language]);

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
