/**
 * 密碼變更功能的類型定義
 */

/**
 * 表單錯誤類型
 */
export type PasswordErrors = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * 表單數據類型
 */
export type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * 提交結果類型
 */
export type SubmitResult = {
  success: boolean;
  message: string;
};

/**
 * 可見性控制類型
 */
export type PasswordVisibility = {
  currentPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
};

/**
 * 密碼變更上下文類型
 */
export interface PasswordChangeContextType {
  isLoading: boolean;
  errors: PasswordErrors;
  formData: PasswordFormData;
  submitResult: SubmitResult;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  toggleVisibility: (field: 'currentPassword' | 'newPassword' | 'confirmPassword') => void;
  isVisible: PasswordVisibility;
}