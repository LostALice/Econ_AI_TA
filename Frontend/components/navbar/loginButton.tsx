import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
} from "@nextui-org/react";

import { useState, useEffect, useContext } from "react";
import { sha3_256 } from "js-sha3";
import {
  setCookie,
  getCookie,
  hasCookie,
  deleteCookie,
} from "cookies-next";

import { siteConfig } from "@/config/site";

import { AuthContext } from "@/contexts/AuthContext";

export const LoginButton = () => {
  const { role, setRole } = useContext(AuthContext);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const logoutModal = useDisclosure();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (hasCookie("role") && hasCookie("jwt")) {
      const userRole = getCookie("role") || "未登入";
      setRole(userRole);
      setIsLoggedIn(true);
    }
  }, [setRole]);

  function logout() {
    deleteCookie("role");
    deleteCookie("jwt");
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    const userRole = getCookie("role") || "未登入";
    setRole(userRole);
  }

  function submitLogin() {
    const hashed_password = sha3_256(password);

    fetch(siteConfig.api_url + "/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        hashed_password: hashed_password,
      }),
    }).then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCookie("jwt", data.jwt_token);
          setCookie("role", data.role);
          const userRole = getCookie("role") || "未登入";
          setRole(userRole);
          setIsLoggedIn(true);
          return true;
        }
        else {
          console.log("login failed");
          return false;
        }
      } else {
        console.log("login failed");
        return false;
      }
    });
    return false;
  }

  return (
    <>
      {isLoggedIn ? (
        <>
          <Button
            className="bg-transparent text-medium"
            onPressEnd={logoutModal.onOpen}
          >
            {role}
          </Button>
          <Modal
            isOpen={logoutModal.isOpen}
            onOpenChange={logoutModal.onOpenChange}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    登出: {role}
                  </ModalHeader>
                  <ModalFooter>
                    <Button
                      className="border border-danger-500"
                      color="danger"
                      variant="light"
                      onPress={() => {
                        logout();
                        onClose();
                      }}
                    >
                      確認
                    </Button>
                    <Button color="primary" onPress={onClose}>
                      取消
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      ) : (
        <>
          <Button
            className="bg-transparent text-medium"
            onPressEnd={() => {
              setUsername("");
              setPassword("");
              onOpen();
            }}
          >
            {role}
          </Button>
          <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={false}
            isKeyboardDismissDisabled={true}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    登入
                  </ModalHeader>
                  <ModalBody>
                    <Input
                      value={username}
                      onValueChange={setUsername}
                      autoFocus
                      label="使用者名稱"
                      placeholder="輸入您的使用者名稱"
                      variant="bordered"
                    />
                    <Input
                      value={password}
                      onValueChange={setPassword}
                      label="密碼"
                      placeholder="輸入您的密碼"
                      type="password"
                      variant="bordered"
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      className="border border-danger-500"
                      color="danger"
                      variant="flat"
                      onPress={onClose}
                    >
                      關閉
                    </Button>
                    <Button
                      color="primary"
                      onPress={() => {
                        submitLogin() ? onClose() : {};
                      }}
                    >
                      登入
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      )}
    </>
  );
};
