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
  const { language, setLang } = useContext(LangContext);
  // 使用 addToast 函數而不是 useToast hook
  
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Modal controls
  const logoutModal = useDisclosure();

  // 初始化預設用戶資料
  useEffect(() => {
    initMockUsers();
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    if (hasCookie("role") && hasCookie("jwt")) {
      const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
      setRole(userRole);
      setIsLoggedIn(true);
      router.push("/"); // Redirect to home if already logged in
    }
  }, [setRole, language, router]);

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
    deleteCookie("role");
    deleteCookie("jwt");
    setIsLoggedIn(false);
    setFormData({
      role: "",
      username: "",
      password: "",
    });
    const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
    setRole(userRole);
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  // 顯示登入成功訊息並跳轉到首頁
  const handleLoginSuccess = (roleName: string) => {
    // 在跳轉前，先將用戶信息保存到 localStorage，以便 AuthContext 能夠讀取
    const userDetails = {
      role: roleName, 
      // 可以添加其他用戶信息
    };
    localStorage.setItem('currentUser', JSON.stringify(userDetails));
    
    console.log("登入成功，準備跳轉...");
    
    // 直接強制跳轉，不使用 setTimeout
    window.location.href = "/";
    
    // 顯示成功訊息 (由於強制跳轉，這可能不會顯示很久)
    addToast({
      color: "success",
      title: LanguageTable.login.loginSuccess[language],
      description: `${LanguageTable.login.role[roleName as keyof typeof LanguageTable.login.role][language]} ${LanguageTable.login.loginSuccess[language]}`,
    });
  };

  // 提交表單 - 優先使用模擬認證，當後端 API 可用時再使用 API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      // 使用SHA3-256哈希密碼
      const hashedPassword = sha3_256(formData.password);

      // 先嘗試模擬登入
      const mockResult = mockLogin(formData.username, hashedPassword, formData.role);

      if (mockResult.success) {
        // 模擬登入成功
        setCookie("jwt", mockResult.jwt_token);
        setCookie("role", mockResult.role);

        const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
        setRole(userRole);

        // 顯示成功訊息並直接導向首頁
        if (mockResult.role) {
          handleLoginSuccess(mockResult.role);
        } else {
          // Fallback to a default role if undefined
          handleLoginSuccess("student");
        }
        return;
      }

      // 檢查API URL是否有效配置，否則直接顯示錯誤信息
      if (!siteConfig.api_url) {
        setLoginError("API URL未配置，無法連接到後端伺服器。請聯繫管理員或使用預設帳號。");
        addToast({
          color: "danger",
          title: LanguageTable.login.loginFail[language],
          description: "API URL未配置，無法連接到後端伺服器",
        });
        setIsLoading(false);
        return;
      }

      // 如果模擬登入失敗且後端 API 可用，嘗試使用 API 登入
      try {
        const apiUrl = `${siteConfig.api_url}/authorization/login/`;
        console.log("嘗試連接API:", apiUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超時
        
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            hashed_password: hashedPassword,
            role: formData.role,
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            // API 登入成功
            setCookie("jwt", data.jwt_token);
            // 顯示成功訊息並導向首頁
            if (data.role) {
              handleLoginSuccess(data.role);
            } else {
              // Fallback to a default role if undefined
              handleLoginSuccess("student");
            }
            const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
            setRole(userRole);

            // 顯示成功訊息並導向首頁
            handleLoginSuccess(data.role);
          } else {
            // API返回成功但登入失敗
            setLoginError(data.message || "帳號、密碼或身分別錯誤，請重新確認");
            addToast({
              color: "danger",
              title: LanguageTable.login.loginFail[language],
              description: data.message || "帳號、密碼或身分別錯誤，請重新確認",
            });
          }
        } else {
          // API回應不成功
          setLoginError("伺服器回應錯誤，請稍後再試");
          addToast({
            color: "danger",
            title: LanguageTable.login.loginFail[language],
            description: "伺服器回應錯誤，請稍後再試",
          });
        }
      } catch (apiError: any) {
        console.error("API 連接錯誤:", apiError);
        
        // 處理超時或連線被中止的情況
        if (apiError.name === 'AbortError') {
          setLoginError("伺服器連接超時，請稍後再試。請嘗試使用預設帳號。");
          addToast({
            color: "warning",
            title: "連接超時",
            description: "伺服器連接超時，建議使用預設帳號登入",
          });
          return;
        }
        
        // 如果 API 連接失敗但模擬登入的錯誤信息也不合適，顯示更明確的錯誤
        setLoginError("無法連接到後端伺服器。請確認伺服器是否運行或使用預設帳號。");
        addToast({
          color: "warning",
          title: "伺服器無法連接",
          description: "建議使用提供的預設帳號登入",
        });
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

  // If already logged in, we could show different content or redirect
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