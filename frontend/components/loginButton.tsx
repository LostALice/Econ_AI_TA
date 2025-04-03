import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";

export const LoginButton = () => {
  const { role, userInfo, logout } = useContext(AuthContext);
  const router = useRouter();
  const isLoggedIn = role !== "未登入";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navigateToChangePassword = () => {
    router.push("/login/change-password");
  };
  
  const navigateToProfile = () => {
    router.push("/login/profile");
  };

  // 未登入時顯示普通登入按鈕
  if (!isLoggedIn) {
    return (
      <Button
        as={NextLink}
        color="primary"
        href="/login"
        variant="flat"
      >
        登入
      </Button>
    );
  }

  // 已登入時顯示下拉菜單
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button 
          color="primary"
          variant="flat"
          className="capitalize"
        >
          {role} {userInfo?.studentId ? `(${userInfo.studentId})` : ''}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="用戶選項">
        <DropdownItem key="profile" textValue="個人資料" onPress={navigateToProfile}>
          個人資料
        </DropdownItem>
        <DropdownItem key="settings" textValue="變更密碼" onPress={navigateToChangePassword}>
          變更密碼
        </DropdownItem>
        <DropdownItem 
          key="logout" 
          color="danger" 
          textValue="登出" 
          className="text-danger" 
          onPress={handleLogout}
        >
          登出
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
