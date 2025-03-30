import { useState, useContext } from "react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { AuthContext } from "@/contexts/AuthContext";
import { Button, Input, Card, CardBody, CardHeader, Divider, Select, SelectItem } from "@nextui-org/react";
import DefaultLayout from "@/layouts/default";

// 身分別選項
const roleOptions = [
  { label: "學生", value: "student" },
  { label: "助教", value: "ta" },
  { label: "教師", value: "teacher" }
];

export default function LoginPage() {
  // 表單狀態
  const [formData, setFormData] = useState({
    role: "",
    email: "",
    password: "",
  });
  
  // 錯誤訊息狀態
  const [errors, setErrors] = useState({
    role: "",
    email: "",
    password: "",
  });
  
  // 登入相關狀態
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // 路由器和認證上下文
  const router = useRouter();
  const { setRole } = useContext(AuthContext);

  // 處理表單輸入變更
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // 清除該字段的錯誤訊息
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: "" });
    }
    
    // 清除登入錯誤
    if (loginError) {
      setLoginError("");
    }
  };

  // 驗證表單
  const validateForm = () => {
    const newErrors = {
      role: "",
      email: "",
      password: "",
    };
    
    let isValid = true;

    // 驗證身分別
    if (!formData.role) {
      newErrors.role = "請選擇身分別";
      isValid = false;
    }
    
    // 驗證電子郵件
    if (!formData.email) {
      newErrors.email = "請輸入電子郵件";
      isValid = false;
    }
    
    // 驗證密碼
    if (!formData.password) {
      newErrors.password = "請輸入密碼";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // 提交表單
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setLoginError("");
    
    // 模擬後端處理時間
    setTimeout(() => {
      try {
        // 從本地儲存獲取用戶
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // 尋找符合條件的用戶
        const user = users.find((u: any) => 
          u.email === formData.email && 
          u.password === formData.password &&
          u.role === formData.role
        );
        
        // 在找到匹配用戶後
        if (user) {
          // 登入成功
          console.log("登入成功:", user);
          
          // 儲存已登入用戶資訊到 localStorage，確保包含完整的原始角色值
          const userToStore = {
            id: user.id,
            email: user.email,
            role: user.role, // 這是原始的角色值如 'student', 'ta', 'teacher'
            studentId: user.studentId,
            department: user.department
          };
          localStorage.setItem('currentUser', JSON.stringify(userToStore));
          console.log("保存到 localStorage:", userToStore);
          
          // 更新認證上下文
          setRole(getRoleDisplayName(user.role));
          
          // 顯示成功訊息並導向首頁
          alert("登入成功！歡迎回來。");
          router.push("/");
        } else {
          // 查找僅匹配電子郵件的用戶
          const emailMatch = users.find((u: any) => u.email === formData.email);
          
          if (emailMatch) {
            if (emailMatch.role !== formData.role) {
              setLoginError("身分別不符合，請選擇正確的身分。");
            } else {
              setLoginError("密碼不正確，請重新輸入。");
            }
          } else {
            setLoginError("找不到此電子郵件的帳號，請確認或註冊新帳號。");
          }
        }
      } catch (error) {
        console.error("登入處理錯誤:", error);
        setLoginError("登入過程發生錯誤，請稍後再試。");
      } finally {
        setIsLoading(false);
      }
    }, 1000); // 模擬 1 秒的處理時間
  };

  // 將角色值轉換為顯示名稱
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

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  return (
    <DefaultLayout>
      <div className="flex justify-center items-center py-10 px-4 min-h-[calc(100vh-14rem)]">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col items-center gap-3">
            <h1 className="text-2xl font-bold">登入系統</h1>
          </CardHeader>
          <Divider />
          <CardBody>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-5">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 身分別選擇 */}
              <Select
                label="身分別"
                placeholder="請選擇您的身分"
                selectedKeys={formData.role ? [formData.role] : []}
                onChange={(e) => handleChange("role", e.target.value)}
                isRequired
                isInvalid={!!errors.role}
                errorMessage={errors.role}
              >
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </Select>
              
              {/* 電子郵件 */}
              <Input
                label="電子郵件"
                placeholder="請輸入您的電子郵件"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                isRequired
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                type="email"
              />
              
              {/* 密碼 */}
              <Input
                label="密碼"
                placeholder="請輸入密碼"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                isRequired
                isInvalid={!!errors.password}
                errorMessage={errors.password}
                type={isPasswordVisible ? "text" : "password"}
                endContent={
                  <button 
                    type="button" 
                    onClick={togglePasswordVisibility}
                    className="focus:outline-none"
                  >
                    {isPasswordVisible ? "隱藏" : "顯示"}
                  </button>
                }
              />
              
              {/* 提交按鈕 */}
              <div className="flex flex-col space-y-4 pt-2">
                <Button 
                  type="submit" 
                  color="primary" 
                  isLoading={isLoading}
                  className="w-full"
                >
                  登入
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  還沒有帳號？{" "}
                  <NextLink href="/register" className="text-blue-600 hover:underline">
                    立即註冊
                  </NextLink>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}