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
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";

export const LoginButton = () => {
  const { role, setRole } = useContext(AuthContext);
  const { language, setLang } = useContext(LangContext);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const logoutModal = useDisclosure();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (hasCookie("role") && hasCookie("jwt")) {
      const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
      setRole(userRole);
      setIsLoggedIn(true);
    }
  }, [setRole, language]);

  function logout() {
    deleteCookie("role");
    deleteCookie("jwt");
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
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
          const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
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
            {LanguageTable.nav.loginForm.login[language]}
          </Button>
          <Modal
            isOpen={logoutModal.isOpen}
            onOpenChange={logoutModal.onOpenChange}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col">
                    {LanguageTable.nav.loginForm.logout[language]}: {role}
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
                      {LanguageTable.nav.loginForm.confirm[language]}
                    </Button>
                    <Button color="primary" onPress={onClose}>
                      {LanguageTable.nav.loginForm.cancel[language]}
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
            className="bg-transparent text-medium mr-3"
            onPressEnd={() => {
              setUsername("");
              setPassword("");
              onOpen();
            }}
          >
            {LanguageTable.nav.loginForm.login[language]}
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
                  <ModalHeader className="flex flex-col">
                    {LanguageTable.nav.loginForm.login[language]}
                  </ModalHeader>
                  <ModalBody>
                    <Input
                      value={username}
                      onValueChange={setUsername}
                      autoFocus
                      label={LanguageTable.nav.loginForm.username.username[language]}
                      placeholder={LanguageTable.nav.loginForm.username.input[language]}
                      variant="bordered"
                    />
                    <Input
                      value={password}
                      onValueChange={setPassword}
                      label={LanguageTable.nav.loginForm.password.password[language]}
                      placeholder={LanguageTable.nav.loginForm.password.input[language]}
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
                      {LanguageTable.nav.loginForm.close[language]}
                    </Button>
                    <Button
                      color="primary"
                      onPress={() => {
                        submitLogin() ? onClose() : {};
                      }}
                    >
                      {LanguageTable.nav.loginForm.login[language]}
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
