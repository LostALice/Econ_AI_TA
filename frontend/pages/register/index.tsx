import { useState } from "react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { Button, Input, Card, CardBody, CardHeader, Divider, Select, SelectItem } from "@nextui-org/react";
import DefaultLayout from "@/layouts/default";

// 身分別選項
const roleOptions = [
  { label: "學生", value: "student" },
  { label: "助教", value: "ta" },
  { label: "教師", value: "teacher" }
];

// 科系選項
const departmentOptions = [
  { label: "經濟學系", value: "economics" },
  { label: "財務金融學系", value: "finance" },
  { label: "企業管理學系", value: "business" },
  { label: "國際貿易學系", value: "international_trade" },
  { label: "會計學系", value: "accounting" },
  { label: "統計學系", value: "statistics" },
  { label: "資訊工程學系", value: "computer_science" },
  { label: "其他", value: "other" }
];

export default function RegisterPage() {
  // 表單狀態
  const [formData, setFormData] = useState({
    role: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    department: ""
  });
  
  // 錯誤訊息狀態
  const [errors, setErrors] = useState({
    role: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    department: ""
  });
  
  // 表單提交狀態
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  const router = useRouter();

  // 處理表單輸入變更
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // 清除該字段的錯誤訊息
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // 驗證電子郵件格式
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // 驗證表單
  const validateForm = () => {
    const newErrors = {
      role: "",
      email: "",
      password: "",
      confirmPassword: "",
      studentId: "",
      department: ""
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
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件格式";
      isValid = false;
    }
    
    // 驗證密碼
    if (!formData.password) {
      newErrors.password = "請輸入密碼";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "密碼長度至少需要8個字元";
      isValid = false;
    }
    
    // 驗證確認密碼
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "兩次輸入的密碼不一致";
      isValid = false;
    }
    
    // 驗證學號
    if (!formData.studentId) {
      newErrors.studentId = "請輸入學號";
      isValid = false;
    }
    
    // 驗證科系
    if (!formData.department) {
      newErrors.department = "請選擇科系";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // 提交表單 - 替換原始的 handleSubmit 函數
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // 模擬後端處理時間
    setTimeout(() => {
      try {
        // 從本地儲存獲取現有用戶
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // 檢查郵箱是否已被註冊
        const existingUser = users.find((user: any) => user.email === formData.email);
        if (existingUser) {
          alert("此電子郵件已被註冊，請使用其他電子郵件或直接登入。");
          setIsLoading(false);
          return;
        }
        
        // 檢查學號是否已被註冊
        const existingStudentId = users.find((user: any) => user.studentId === formData.studentId);
        if (existingStudentId) {
          alert("此學號已被註冊，請確認您的學號。");
          setIsLoading(false);
          return;
        }
        
        // 創建新用戶
        const newUser = {
          id: Date.now().toString(),
          role: formData.role,
          email: formData.email,
          password: formData.password, // 注意：實際應用中應加密
          studentId: formData.studentId,
          department: formData.department,
          createdAt: new Date().toISOString()
        };
        
        // 添加到用戶列表
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // 顯示成功訊息
        alert("註冊成功！請使用您的電子郵件和密碼登入。");
        
        // 重定向到登入頁面
        router.push("/login");
      } catch (error) {
        console.error("註冊處理錯誤:", error);
        alert("註冊過程發生錯誤，請稍後再試。");
      } finally {
        setIsLoading(false);
      }
    }, 1000); // 模擬 1 秒的處理時間
  };

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);
  const toggleConfirmPasswordVisibility = () => setIsConfirmPasswordVisible(!isConfirmPasswordVisible);

  return (
    <DefaultLayout>
      <div className="flex justify-center items-center py-10 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col items-center gap-3">
            <h1 className="text-2xl font-bold">創建新帳號</h1>
          </CardHeader>
          <Divider />
          <CardBody>
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
                placeholder="至少8個字元"
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
              
              {/* 確認密碼 */}
              <Input
                label="確認密碼"
                placeholder="再次輸入密碼"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                isRequired
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword}
                type={isConfirmPasswordVisible ? "text" : "password"}
                endContent={
                  <button 
                    type="button" 
                    onClick={toggleConfirmPasswordVisibility}
                    className="focus:outline-none"
                  >
                    {isConfirmPasswordVisible ? "隱藏" : "顯示"}
                  </button>
                }
              />
              
              {/* 學號 */}
              <Input
                label="學號"
                placeholder="請輸入您的學號"
                value={formData.studentId}
                onChange={(e) => handleChange("studentId", e.target.value)}
                isRequired
                isInvalid={!!errors.studentId}
                errorMessage={errors.studentId}
              />
              
              {/* 科系 */}
              <Select
                label="科系"
                placeholder="請選擇您的科系"
                selectedKeys={formData.department ? [formData.department] : []}
                onChange={(e) => handleChange("department", e.target.value)}
                isRequired
                isInvalid={!!errors.department}
                errorMessage={errors.department}
              >
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </Select>
              
              {/* 提交按鈕 */}
              <div className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  color="primary" 
                  isLoading={isLoading}
                  className="w-full"
                >
                  註冊
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  已經有帳號？{" "}
                  <NextLink href="/login" className="text-blue-600 hover:underline">
                    登入
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