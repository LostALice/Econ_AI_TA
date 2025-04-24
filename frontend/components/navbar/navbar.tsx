// Code by AkinoAlice@TyrantRey

import { useContext } from "react";
import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import NextLink from "next/link";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/navbar/theme-switch";
import { LoginButton } from "@/components/navbar/loginButton";
import { LangSwitch } from "@/components/navbar/langSwitch";
import { Logo } from "@/components/navbar/icons";
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";

export const Navbar = () => {
  const { language } = useContext(LangContext);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <NextUINavbar
      maxWidth="xl"
      position="sticky"
      className="shadow-md"
      shouldHideOnScroll
    >
      <NavbarContent className="w-full flex items-center justify-between">
        <NavbarBrand className="flex items-center gap-3">
          <NextLink href="/" className="flex items-center gap-1">
            <Logo />
            <span className="hidden sm:inline font-bold text-inherit">
              {LanguageTable.nav.title[language]}
            </span>
          </NextLink>
          <div className="hidden sm:flex items-center gap-4">
            {siteConfig.navItems.map((item) => (
              <NavbarItem key={item.href}>
                <NextLink href={item.href} className="text-inherit">
                  {LanguageTable.nav.links[item.label as keyof typeof LanguageTable.nav.links][language]}
                </NextLink>
              </NavbarItem>
            ))}
          </div>
        </NavbarBrand>

        <div className="hidden sm:flex items-center gap-1">
          <LangSwitch />
          <LoginButton />
          <ThemeSwitch />
        </div>

        <div className="sm:hidden">
          <button
            onClick={() => onOpen()}
            className="p-2 rounded-md focus:outline-none focus:ring"
            aria-label="Toggle mobile menu"
          >
            {isOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            )}
          </button>
        </div>
      </NavbarContent>

      <Modal isOpen={isOpen} size="sm" onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {LanguageTable.nav.modal.menu[language]}
              </ModalHeader>
              <ModalBody>
                {siteConfig.navItems.map((item) => (
                  <NavbarItem key={item.href}>
                    <NextLink href={item.href}
                      onClick={() => onClose()}
                      className="block text-inherit"
                    >
                      {LanguageTable.nav.links[item.label as keyof typeof LanguageTable.nav.links][language]}
                    </NextLink>
                  </NavbarItem>
                ))}
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <LangSwitch />
                <ThemeSwitch />
                <LoginButton />
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </NextUINavbar>
  );
};

