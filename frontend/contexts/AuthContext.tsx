import { createContext, useState, useEffect } from "react";

export type TAuthRole = {
  role: string;
  setRole: (role: string) => void;
  isLoggedIn: boolean;
  logout: () => void;
  userInfo: any | null; // 添加用戶信息
};

export const AuthContext = createContext<TAuthRole>({
  role: "未登入",
  setRole: (role: string) => {},
  isLoggedIn: false,
  logout: () => {},
  userInfo: null,
});

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [role, setRoleState] = useState<string>("未登入");
  const [userInfo, setUserInfo] = useState<any | null>(null);
  
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

  // 轉換角色值為顯示名稱
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

  // 封裝 setRole 函數
  const setRole = (newRole: string) => {
    setRoleState(newRole);
  };

  // 登出功能
  const logout = () => {
    setRoleState("未登入");
    setUserInfo(null);
    localStorage.removeItem('currentUser');
    console.log("User logged out");
  };
  
  // 調試輸出當前狀態
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
