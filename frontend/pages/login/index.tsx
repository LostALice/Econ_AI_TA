import DefaultLayout from "@/layouts/default";

import { useDisclosure, Button, Input, Card, CardBody, CardHeader, Divider, Select, SelectItem, Form, addToast } from "@heroui/react";
import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { setCookie, getCookie, deleteCookie, hasCookie } from "cookies-next";
import { sha3_256 } from "js-sha3";
import { siteConfig } from "@/config/site";

import { LanguageTable } from "@/i18n";
import { AuthContext } from "@/contexts/AuthContext";
import { LangContext } from "@/contexts/LangContext";
import { PasswordInput } from "@/components/login/password/passwordInput";

// 引入模擬認證
import { mockLogin, initMockUsers } from "@/api/mock/auth";

export default function LoginPage() {
  const router = useRouter();
  const { role, setRole } = useContext(AuthContext);
  const { language } = useContext(LangContext);
  
  // 身分別選項
  const roleOptions = [
    { label: "學生", value: "student" },
    { label: "助教", value: "ta" },
    { label: "教師", value: "teacher" }
  ];

  // 表單狀態
  const [formData, setFormData] = useState({
    role: "",
    username: "",
    password: "",
  });

  // 錯誤訊息狀態
  const [errors, setErrors] = useState({
    role: "",
    username: "",
    password: "",
  });

  // 登入相關狀態
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Modal controls
  const logoutModal = useDisclosure();

  // 初始化預設用戶資料
  useEffect(() => {
    initMockUsers();
  }, []);

  // 檢查用戶是否已登入
  useEffect(() => {
    // 確認用戶是否已登入
    if (hasCookie("jwt") && hasCookie("userInfo")) {
      try {
        const userInfoStr = getCookie("userInfo") as string;
        const parsedUser = JSON.parse(userInfoStr);
        
        if (parsedUser && parsedUser.role) {
          // 獲取顯示角色名稱
          setRole(getRoleDisplayName(parsedUser.role));
          setIsLoggedIn(true);
          router.push("/"); // 已登入則重定向到首頁
        }
      } catch (error) {
        console.error("解析用戶信息時發生錯誤:", error);
        // 清除可能損壞的 cookie
        deleteCookie("jwt", { path: '/' });
        deleteCookie("role", { path: '/' });
        deleteCookie("userInfo", { path: '/' });
      }
    }
  }, [setRole, language, router]);

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
      username: "",
      password: "",
    };

    let isValid = true;

    // 驗證身分別
    if (!formData.role) {
      newErrors.role = "請選擇身分別";
      isValid = false;
    }

    // 驗證電子郵件
    if (!formData.username) {
      newErrors.username = "請輸入電子郵件";
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

  // 登出功能
  const logout = () => {
    const cookieOptions = { path: '/' };
    deleteCookie("jwt", cookieOptions);
    deleteCookie("role", cookieOptions);
    deleteCookie("userInfo", cookieOptions);
    setIsLoggedIn(false);
    setFormData({
      role: "",
      username: "",
      password: "",
    });
    setRole(LanguageTable.nav.role.unsigned[language]);
    router.push("/login");
  };

  // 顯示登入成功訊息並跳轉到首頁
  const handleLoginSuccess = (roleName: string, userData: any) => {
    // 儲存用戶信息到 Cookie (避免存儲敏感信息)
    const safeUserInfo = {
      id: userData.id,
      role: roleName,
      email: userData.email,
      studentId: userData.studentId || "",
      department: userData.department || ""
    };
    
    // 設定 Cookie - 適用於開發環境
    const cookieOptions = {
      maxAge: 7 * 24 * 60 * 60, // 7天有效期
      path: "/", // 確保 cookie 在所有路徑可訪問
      sameSite: "lax" as const  // 開發環境使用 lax
    };
    
    // 設置 JWT cookie
    setCookie("jwt", userData.jwt_token || "", cookieOptions);
    setCookie("userInfo", JSON.stringify(safeUserInfo), cookieOptions);
    
    console.log("登入成功，準備跳轉...");
    
    // 顯示成功訊息
    addToast({
      color: "success",
      title: LanguageTable.login.loginSuccess[language],
      description: `${LanguageTable.login.role[roleName as keyof typeof LanguageTable.login.role][language]} ${LanguageTable.login.loginSuccess[language]}`,
    });
    
    // 設置登入狀態
    setRole(getRoleDisplayName(roleName));
    setIsLoggedIn(true);
    
    // 短暫延遲後導向首頁，確保狀態更新
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  // 檢查是否是默認帳號
  const isDefaultAccount = (username: string, password: string, role: string): boolean => {
    // 預設帳號列表
    const defaults = [
      { email: "teacher@fcu.edu.tw", password: "teacher123", role: "teacher" },
      { email: "ta@fcu.edu.tw", password: "ta123", role: "ta" },
      { email: "student@mail.fcu.edu.tw", password: "student123", role: "student" },
    ];
    
    return defaults.some(account => 
      account.email.toLowerCase() === username.toLowerCase() && 
      account.password === password && 
      account.role === role
    );
  };

  // 提交表單 - 使用模擬認證並支持異步 JWT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      // 檢查是否為預設帳號
      if (isDefaultAccount(formData.username, formData.password, formData.role)) {
        // 對預設帳號使用明文密碼進行認證
        const mockResult = await mockLogin(formData.username, formData.password, formData.role);
        
        if (mockResult.success) {
          // 模擬登入成功
          handleLoginSuccess(mockResult.role, {
            ...mockResult.userData,
            jwt_token: mockResult.jwt_token
          });
        } else {
          console.error("預設帳號登入失敗，這是不應該發生的:", mockResult.message);
          setLoginError("登入過程發生錯誤，請稍後再試。");
        }
      } else {
        // 非預設帳號使用 SHA3-256 哈希密碼進行認證
        const hashedPassword = sha3_256(formData.password);
        const mockResult = await mockLogin(formData.username, hashedPassword, formData.role);

        if (mockResult.success) {
          // 模擬登入成功
          handleLoginSuccess(mockResult.role, {
            ...mockResult.userData,
            jwt_token: mockResult.jwt_token
          });
        } else {
          // 模擬登入失敗 - 顯示錯誤
          setLoginError("帳號、密碼或身份別錯誤，請重新確認");
          addToast({
            color: "danger",
            title: LanguageTable.login.loginFail[language],
            description: "帳號、密碼或身份別錯誤，請重新確認",
          });
        }
      }
    } catch (error) {
      console.error("登入處理錯誤:", error);
      setLoginError("登入過程發生錯誤，請稍後再試。");
      addToast({
        color: "danger",
        title: LanguageTable.login.loginFail[language],
        description: "登入過程發生錯誤，請稍後再試",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 如果已登入，顯示不同的內容
  if (isLoggedIn) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center py-10 px-4 min-h-[calc(100vh-14rem)]">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-col items-center gap-3">
              <h1 className="text-2xl font-bold">{LanguageTable.login.logged[language]}</h1>
            </CardHeader>
            <CardBody className="flex flex-col items-center">
              <p className="mb-4">{LanguageTable.login.backHome[language]}</p>
              <Button color="primary" onPress={() => router.push("/")}>
                {LanguageTable.login.logged[language]}
              </Button>
              <Button color="danger" className="mt-2" onPress={() => logout()}>
                {LanguageTable.login.logout[language]}
              </Button>
            </CardBody>
          </Card>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="flex justify-center items-center py-10 px-4 min-h-[calc(100vh-14rem)]">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col items-center gap-3">
            <h1 className="text-2xl font-bold">{LanguageTable.login.system[language]}</h1>
          </CardHeader>
          <Divider />
          <CardBody>
            <Form onSubmit={handleSubmit} className="space-y-6">
              {/* 身分別選擇 */}
              <Select
                label={LanguageTable.login.SelectRole[language]}
                placeholder={LanguageTable.login.inputRole[language]}
                selectedKeys={formData.role ? [formData.role] : []}
                onChange={(e) => handleChange("role", e.target.value)}
                isRequired
                isInvalid={!!errors.role}
                errorMessage={errors.role}
              >
                {roleOptions.map((role) => (
                  <SelectItem key={role.value}>
                    {LanguageTable.login.role[role.value as keyof typeof LanguageTable.login.role][language]}
                  </SelectItem>
                ))}
              </Select>

              {/* 使用者名稱 */}
              <Input
                label={LanguageTable.login.username[language]}
                placeholder={LanguageTable.login.inputUsername[language]}
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("username", e.target.value)}
                isRequired
                isInvalid={!!errors.username}
                errorMessage={errors.username}
                type="email"
              />

              {/* 密碼 */}
              <PasswordInput
                label={LanguageTable.login.password[language]}
                placeholder={LanguageTable.login.inputPassword[language]}
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("password", e.target.value)}
                isInvalid={!!errors.password}
                errorMessage={errors.password}
              />

              {/* 顯示登入錯誤訊息 */}
              {loginError && (
                <div className="p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {loginError}
                </div>
              )}

              {/* 提交按鈕 */}
              <div className="flex flex-col space-y-4 pt-2">
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isLoading}
                  className="w-full"
                >
                  {LanguageTable.nav.login.login[language]}
                </Button>
              </div>

              {/* 預設帳號提示 */}
              <div className="mt-4 p-3 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <h3 className="font-bold mb-2">預設帳號:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>教師:</strong> teacher@fcu.edu.tw / teacher123</p>
                  <p><strong>助教:</strong> ta@fcu.edu.tw / ta123</p>
                  <p><strong>學生:</strong> student@mail.fcu.edu.tw / student123</p>
                </div>
              </div>
            </Form>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}