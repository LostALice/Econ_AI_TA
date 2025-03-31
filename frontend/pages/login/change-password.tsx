import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import DefaultLayout from "@/layouts/default";
import { Card, CardHeader, CardBody, CardFooter, Divider, Button, Input } from "@nextui-org/react";
import { PasswordChangeProvider, usePasswordChange } from "@/contexts/PasswordChangeContext";

// 實際密碼變更表單組件
const PasswordChangeForm = () => {
  const { 
    formData, 
    handleChange, 
    handleSubmit, 
    errors, 
    isLoading, 
    submitResult,
    isVisible,
    toggleVisibility
  } = usePasswordChange();
  const router = useRouter();

  return (
    <div className="container mx-auto py-12 px-4 max-w-md">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start gap-2">
          <h1 className="text-2xl font-bold">變更密碼</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            請輸入您當前的密碼和新密碼
          </p>
        </CardHeader>
        <Divider />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type={isVisible.currentPassword ? "text" : "password"}
              name="currentPassword"
              label="目前密碼"
              placeholder="請輸入目前密碼"
              value={formData.currentPassword}
              onChange={handleChange}
              isInvalid={!!errors.currentPassword}
              errorMessage={errors.currentPassword}
              endContent={
                <button 
                  className="focus:outline-none" 
                  type="button" 
                  onClick={() => toggleVisibility("currentPassword")}
                >
                  <span className="text-gray-400 text-lg">
                    {isVisible.currentPassword ? "👁️" : "👁️‍🗨️"}
                  </span>
                </button>
              }
            />
            
            <Input
              type={isVisible.newPassword ? "text" : "password"}
              name="newPassword"
              label="新密碼"
              placeholder="請輸入新密碼"
              value={formData.newPassword}
              onChange={handleChange}
              isInvalid={!!errors.newPassword}
              errorMessage={errors.newPassword}
              description="密碼長度必須至少為 8 個字元"
              endContent={
                <button 
                  className="focus:outline-none" 
                  type="button" 
                  onClick={() => toggleVisibility("newPassword")}
                >
                  <span className="text-gray-400 text-lg">
                    {isVisible.newPassword ? "👁️" : "👁️‍🗨️"}
                  </span>
                </button>
              }
            />
            
            <Input
              type={isVisible.confirmPassword ? "text" : "password"}
              name="confirmPassword"
              label="確認新密碼"
              placeholder="請再次輸入新密碼"
              value={formData.confirmPassword}
              onChange={handleChange}
              isInvalid={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword}
              endContent={
                <button 
                  className="focus:outline-none" 
                  type="button" 
                  onClick={() => toggleVisibility("confirmPassword")}
                >
                  <span className="text-gray-400 text-lg">
                    {isVisible.confirmPassword ? "👁️" : "👁️‍🗨️"}
                  </span>
                </button>
              }
            />

            {submitResult.message && (
              <div className={`p-3 rounded-md ${submitResult.success 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {submitResult.message}
              </div>
            )}
          </form>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-end gap-2">
          <Button 
            color="default" 
            variant="flat" 
            onClick={() => router.back()}
          >
            取消
          </Button>
          <Button 
            color="primary" 
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            更改密碼
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// 頁面組件
export default function ChangePasswordPage() {
  const { isLoggedIn } = useContext(AuthContext);
  const router = useRouter();
  
  // 驗證登入狀態
  if (!isLoggedIn) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  return (
    <DefaultLayout>
      <PasswordChangeProvider>
        <PasswordChangeForm />
      </PasswordChangeProvider>
    </DefaultLayout>
  );
}