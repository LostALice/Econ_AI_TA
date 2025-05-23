import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import DefaultLayout from "@/layouts/default";
import { Card, CardHeader, CardBody, CardFooter, Divider, Button, Input, Form } from "@heroui/react";
import { PasswordChangeProvider, usePasswordChange } from "@/contexts/PasswordChangeContext";

import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";
import { PasswordInput } from "@/components/login/password/passwordInput";

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
  const { language, setLang } = useContext(LangContext);

  return (
    <div className="container mx-auto py-12 px-4 max-w-xxl">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start gap-2">
          <h1 className="text-2xl font-bold">{LanguageTable.password.changePassword[language]}</h1>
        </CardHeader>
        <Divider />
        <CardBody>
          <Form onSubmit={handleSubmit} className="space-y-6 justify-between">
            <PasswordInput
              // type={isVisible.currentPassword ? "text" : "password"}
              name="currentPassword"
              label={LanguageTable.password.currentPassword[language]}
              // placeholder={LanguageTable.password.currentPassword[language]}
              value={formData.currentPassword}
              onChange={handleChange}
              isInvalid={!!errors.currentPassword}
              errorMessage={errors.currentPassword}
            // endContent={
            //   <Button
            //     className="focus:outline-none"
            //     type="button"
            //     onPress={() => toggleVisibility("currentPassword")}
            //   >
            //     <span className="text-lg">
            //       {/* {isVisible.currentPassword ? "👁️" : "👁️‍🗨️"} */}
            //       <ShowPasswordIcon isVisible={isVisible.currentPassword} />
            //     </span>
            //   </Button>

            // }
            />

            <PasswordInput
              // type={isVisible.newPassword ? "text" : "password"}
              name="newPassword"
              label={LanguageTable.password.newPassword[language]}
              // placeholder={LanguageTable.password.newPassword[language]}
              value={formData.newPassword}
              onChange={handleChange}
              isInvalid={!!errors.newPassword}
              errorMessage={errors.newPassword}
            // errorMessage={LanguageTable.password.notLessThenEightCharacter[language]}
            // endContent={
            //   <Button
            //     className="focus:outline-none"
            //     type="button"
            //     onPress={() => toggleVisibility("newPassword")}
            //   >
            //     <span className="text-gray-400 text-lg">
            //       {isVisible.newPassword ? "👁️" : "👁️‍🗨️"}
            //     </span>
            //   </Button>
            // }
            />

            <PasswordInput
              // type={isVisible.confirmPassword ? "text" : "password"}
              name="confirmPassword"
              label={LanguageTable.password.confirmPassword[language]}
              // placeholder={LanguageTable.password.confirmPassword[language]}
              value={formData.confirmPassword}
              onChange={handleChange}
              isInvalid={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword}
            // endContent={
            //   <button
            //     className="focus:outline-none"
            //     type="button"
            //     onClick={() => toggleVisibility("confirmPassword")}
            //   >
            //     <span className="text-lg">
            //       {isVisible.confirmPassword ? "👁️" : "👁️‍🗨️"}
            //     </span>
            //   </button>
            // }
            />

            {submitResult.message && (
              <div className={`p-3 rounded-md ${submitResult.success
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {submitResult.message}
              </div>
            )}
          </Form>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-end gap-2">
          <Button
            color="default"
            variant="flat"
            onPress={() => router.back()}
          >
            {LanguageTable.password.cancel[language]}
          </Button>
          <Button
            onSubmit={handleSubmit}
            isLoading={isLoading}
          >
            {LanguageTable.password.modify[language]}
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