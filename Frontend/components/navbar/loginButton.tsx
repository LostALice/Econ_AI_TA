import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownItem,
  DropdownMenu,
  Link
} from "@heroui/react";
import { useRouter } from "next/router";

import { useContext } from "react";


import { AuthContext } from "@/contexts/AuthContext";
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";

export const LoginButton = () => {
  const { role, userInfo, logout } = useContext(AuthContext);
  const { language, setLang } = useContext(LangContext);

  const router = useRouter();
  const isLoggedIn = [LanguageTable.nav.role.unsigned.en, LanguageTable.nav.role.unsigned.zh].includes(role);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navigateToChangePassword = () => {
    router.push("/login/password");
  };

  const navigateToProfile = () => {
    router.push("/login/profile");
  };
  if (isLoggedIn) {
    return (
      <Button
        className="border bg-transparent text-medium border-none"
        as={Link}
        href="/login"
      >
        {LanguageTable.nav.login.loginBtn.login[language]}
      </Button>
    );
  }

  // 已登入時顯示下拉菜單
  return (
    <Dropdown
      placement="bottom-end"
      as={Button}
      className="border text-medium border-none"
    >
      <DropdownTrigger>
        <Button
          className="border bg-transparent text-medium border-none"
        >
          {LanguageTable.nav.role[role.toLowerCase() as keyof typeof LanguageTable.nav.role][language]}
          {/* {userInfo?.studentId ? `(${userInfo.studentId})` : ''} */}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="user-option">
        <DropdownItem key="profile" textValue={LanguageTable.nav.login.loginBtn.profile[language]} onPress={navigateToProfile}>
          {LanguageTable.nav.login.loginBtn.profile[language]}
        </DropdownItem>
        <DropdownItem key="settings" textValue={LanguageTable.nav.login.loginBtn.settings[language]} onPress={navigateToChangePassword}>
          {LanguageTable.nav.login.loginBtn.settings[language]}
        </DropdownItem>
        <DropdownItem key="management" textValue={LanguageTable.nav.login.loginBtn.management[language]} onPress={() => router.push("/management")}>
          {LanguageTable.nav.login.loginBtn.management[language]}
        </DropdownItem>
        <DropdownItem
          key="logout"
          color="danger"
          textValue={LanguageTable.nav.login.loginBtn.logout[language]}
          className="text-danger"
          onPress={handleLogout}
        >
          {LanguageTable.nav.login.loginBtn.logout[language]}
        </DropdownItem>

      </DropdownMenu>
    </Dropdown>
  );
};
