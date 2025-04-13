import { createContext, useState, useContext } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "@/contexts/AuthContext";
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";

interface PasswordChangeContextType {
  isLoading: boolean;
  errors: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  formData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  submitResult: {
    success: boolean;
    message: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  toggleVisibility: (field: 'currentPassword' | 'newPassword' | 'confirmPassword') => void;
  isVisible: {
    currentPassword: boolean;
    newPassword: boolean;
    confirmPassword: boolean;
  };
}

export const PasswordChangeContext = createContext<PasswordChangeContextType | null>(null);

export const PasswordChangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const { language, setLang } = useContext(LangContext);

  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isVisible, setIsVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState({ success: false, message: "" });

  // 切換密碼可見性
  const toggleVisibility = (field: keyof typeof isVisible) => {
    setIsVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 處理表單輸入變更
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

  // 驗證表單
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = LanguageTable.password.error.inputPassword[language];
      valid = false;
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = LanguageTable.password.error.newPassword[language];
      valid = false;
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = LanguageTable.password.error.atLeast8Char[language];
      valid = false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = LanguageTable.password.error.notMatch[language];
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitResult({ success: false, message: "" });

    try {
      // 模擬 API 調用延遲
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 1. 從 localStorage 中獲取所有用戶
      const users = JSON.parse(localStorage.getItem('users') || '[]');

      // 2. 獲取當前登入用戶信息
      const currentUserData = localStorage.getItem('currentUser');
      if (!currentUserData) {
        setSubmitResult({
          success: false,
          message: LanguageTable.password.error.userNotFound[language]
        });
        setIsLoading(false);
        return;
      }

      const currentUser = JSON.parse(currentUserData);

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

        // 6. 保存更新後的用戶列表
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
          // router.push('/login?message=密碼已更改，請使用新密碼登入');
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

// 自定義 hook 方便使用
export const usePasswordChange = () => {
  const context = useContext(PasswordChangeContext);
  if (!context) {
    throw new Error("usePasswordChange 必須在 PasswordChangeProvider 內使用");
  }
  return context;
};