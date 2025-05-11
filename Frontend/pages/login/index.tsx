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

export default function LoginPage() {
  const router = useRouter();
  const { role, setRole } = useContext(AuthContext);
  const { language, setLang } = useContext(LangContext);

  // 身分別選項
  const roleOptions = [
    { label: "學生", value: "student" },
    { label: "助教", value: "ta" },
    { label: "教師", value: "teacher" }
  ];

  // 表單狀態
  const [formData, setFormData] = useState({
    role: "",
    username: "", // Changed from username to email based on original form
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

  // Check if user is already logged in
  useEffect(() => {
    if (hasCookie("role") && hasCookie("token")) {
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
    deleteCookie("token");
    setIsLoggedIn(false);
    setFormData({
      role: "",
      username: "",
      password: "",
    });
    const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
    setRole(userRole);
    router.push("/login");
  };

  // 提交表單 - 使用API進行身份驗證
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      const response = await fetch(siteConfig.api_url + "/authorization/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,  // Using username as username
          password: formData.password,
          role: formData.role,  // Added role to the request
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // 登入成功
          setCookie("token", data.jwt_token);
          setCookie("role", data.role);

          const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
          setRole(userRole);
          setIsLoggedIn(true);

          // 顯示成功訊息並導向首頁
          // alert("登入成功！歡迎回來。");
          addToast({
            color: "success",
            title: LanguageTable.login.loginSuccess[language]
          })
          router.push("/");
        } else {
          // API返回成功但登入失敗
          setLoginError(data.message || LanguageTable.login.loginSuccess[language]);
          addToast({
            color: "warning",
            title: LanguageTable.login.loginFail[language],
          });
        }
      } else {
        // API請求失敗
        setLoginError(LanguageTable.login.loginSuccess[language]);
        addToast({
          color: "warning",
          title: LanguageTable.login.loginFail[language],
        });
        console.error("API request failed:", response.status);
      }
    } catch (error) {
      console.error("登入處理錯誤:", error);
      addToast({
        color: "warning",
        title: LanguageTable.login.loginFail[language],
      });
      setLoginError("登入過程發生錯誤，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  // const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

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
              <Button color="danger" className="mt-2" onPress={() => logoutModal.onOpen()}>
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
                type="username"
              />

              {/* 密碼 */}
              <PasswordInput
                label={LanguageTable.login.password[language]}
                placeholder={LanguageTable.login.inputPassword[language]}
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("password", e.target.value)}
                isInvalid={!!errors.password}
                errorMessage={errors.password}
              >
              </PasswordInput>

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
            </Form>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}