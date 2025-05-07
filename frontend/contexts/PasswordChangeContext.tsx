/**
 * PasswordChangeContext.tsx
 * 
 * 此檔案實現了密碼更改的上下文管理，用於處理用戶密碼修改流程。
 * 
 * 功能:
 * - 管理密碼更改表單數據
 * - 提供表單驗證邏輯
 * - 處理密碼更改的提交流程
 * - 管理密碼欄位的可見性切換
 * - 提供錯誤處理和狀態反饋
 * 
 * 資料結構:
 * - formData: 包含當前密碼、新密碼和確認密碼的表單數據
 * - errors: 存儲表單驗證錯誤信息
 * - isVisible: 控制各密碼欄位是否可見
 * - submitResult: 提交結果狀態和消息
 */

import { createContext, useState, useContext } from "react";
import { useRouter } from "next/router";
import { setCookie, getCookie, deleteCookie, hasCookie } from "cookies-next";
import { AuthContext } from "@/contexts/AuthContext";
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";
import { PasswordFormData, PasswordErrors, SubmitResult, PasswordVisibility, PasswordChangeContextType } from "@/types/Auth/passwordChange";

export const PasswordChangeContext = createContext<PasswordChangeContextType | null>(null);

/**
 * PasswordChangeProvider 元件
 * 
 * 提供密碼更改功能相關的上下文給子元件。
 * 管理密碼更改流程的所有狀態和操作。
 * 
 * @param {React.ReactNode} children - 子元件
 * @returns {React.ReactElement} 包含密碼更改上下文的 Provider 元件
 */
export const PasswordChangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const { language, setLang } = useContext(LangContext);

  const router = useRouter();
  
  // 表單數據狀態
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // 表單驗證錯誤狀態
  const [errors, setErrors] = useState<PasswordErrors>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // 密碼可見性狀態
  const [isVisible, setIsVisible] = useState<PasswordVisibility>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  
  // 提交狀態管理
  const [isLoading, setIsLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult>({ success: false, message: "" });

  /**
   * 切換密碼欄位可見性
   * 
   * @param {keyof PasswordVisibility} field - 要切換可見性的欄位名稱
   */
  const toggleVisibility = (field: keyof PasswordVisibility) => {
    setIsVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  /**
   * 處理表單輸入變更
   * 更新表單數據並清除對應欄位的錯誤信息
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 輸入事件對象
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 清除對應字段的錯誤
    setErrors(prev => ({
      ...prev,
      [name]: ""
    }));
  };

  /**
   * 驗證表單數據
   * 檢查各欄位是否符合要求並設置錯誤信息
   * 
   * @returns {boolean} 表單是否有效
   */
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    // 驗證當前密碼
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = LanguageTable.password.error.inputPassword[language];
      valid = false;
    }

    // 驗證新密碼
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = LanguageTable.password.error.newPassword[language];
      valid = false;
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = LanguageTable.password.error.atLeast8Char[language];
      valid = false;
    }

    // 驗證確認密碼
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = LanguageTable.password.error.notMatch[language];
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  /**
   * 處理表單提交
   * 驗證表單並執行密碼更改流程
   * 
   * @param {React.FormEvent} e - 表單提交事件對象
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證表單
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitResult({ success: false, message: "" });

    try {
      // 模擬 API 調用延遲
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 獲取當前登入用戶信息
      if (!hasCookie("userInfo") || !hasCookie("jwt")) {
        setSubmitResult({
          success: false,
          message: LanguageTable.password.error.userNotFound[language]
        });
        setIsLoading(false);
        return;
      }

      // 1. 從 Cookie 中獲取用戶信息
      const userInfoStr = getCookie("userInfo") as string;
      if (!userInfoStr) {
        setSubmitResult({
          success: false,
          message: LanguageTable.password.error.userNotFound[language]
        });
        setIsLoading(false);
        return;
      }

      const currentUser = JSON.parse(userInfoStr);

      // 2. 從 localStorage 獲取用戶數據 (僅用於模擬驗證，實際應用應使用後端 API)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // 3. 在所有用戶中找到當前用戶
      const userIndex = users.findIndex((u: any) =>
        u.id === currentUser.id &&
        u.email === currentUser.email
      );

      if (userIndex === -1) {
        setSubmitResult({
          success: false,
          message: LanguageTable.password.error.userNotFound[language]
        });
        setIsLoading(false);
        return;
      }

      // 4. 驗證當前密碼是否正確
      if (formData.currentPassword === users[userIndex].password) {
        // 5. 更新用戶密碼
        users[userIndex].password = formData.newPassword;

        // 6. 保存更新後的用戶列表 (僅模擬用途，實際應使用後端 API)
        localStorage.setItem('users', JSON.stringify(users));

        // 7. 顯示成功消息
        setSubmitResult({
          success: true,
          message: LanguageTable.password.success[language]
        });

        // 8. 清空表單
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // 9. 延遲登出
        setTimeout(() => {
          logout();
          router.push("/login");
        }, 3000);
      } else {
        // 10. 密碼不正確
        setSubmitResult({
          success: false,
          message: LanguageTable.password.error.incorrect[language]
        });
      }
    } catch (error) {
      console.error("密碼更改失敗:", error);
      setSubmitResult({
        success: false,
        message: LanguageTable.password.error.cantChange[language]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 提供給上下文的值
  const value = {
    isLoading,
    errors,
    formData,
    submitResult,
    handleChange,
    handleSubmit,
    toggleVisibility,
    isVisible
  };

  return (
    <PasswordChangeContext.Provider value={value}>
      {children}
    </PasswordChangeContext.Provider>
  );
};

/**
 * 自定義 hook 用於簡化密碼更改上下文的使用
 * 提供類型安全的上下文訪問
 * 
 * @returns {PasswordChangeContextType} 密碼更改上下文
 * @throws {Error} 如果在 PasswordChangeProvider 外部使用
 */
export const usePasswordChange = () => {
  const context = useContext(PasswordChangeContext);
  if (!context) {
    throw new Error("usePasswordChange 必須在 PasswordChangeProvider 內使用");
  }
  return context;
};