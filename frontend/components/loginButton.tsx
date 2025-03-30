import { useContext } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Avatar,
} from "@nextui-org/react";
import { AuthContext } from "@/contexts/AuthContext";
import NextLink from "next/link";
import { useRouter } from "next/router";

export const LoginButton: React.FC = () => {
  const { role, isLoggedIn, logout, userInfo } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    console.log("Logout triggered");
    // 強制重新加載頁面，確保所有組件都重新讀取登入狀態
    router.push("/").then(() => {
      window.location.reload();
    });
  };

  return (
    <>
      {isLoggedIn ? (
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" color="primary">
              {role}
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions">
            <DropdownItem key="profile">
              {userInfo?.email || "使用者"}
            </DropdownItem>
            <DropdownItem key="logout" color="danger" onClick={handleLogout}>
              登出
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      ) : (
        <Button as={NextLink} color="primary" href="/login" variant="flat">
          登入
        </Button>
      )}
    </>
  );
};
