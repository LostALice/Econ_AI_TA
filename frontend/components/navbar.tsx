import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  Button,
} from "@nextui-org/react";

import { siteConfig } from "@/config/site";
import NextLink from "next/link";

import { ThemeSwitch } from "@/components/theme-switch";
import { LoginButton } from "@/components/loginButton";

import { Logo } from "@/components/icons";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export const Navbar = () => {
  const { role } = useContext(AuthContext);
  const isLoggedIn = role !== "未登入";

  return (
    <NextUINavbar
      maxWidth="xl"
      position="sticky"
      className="h-[10svh]"
      shouldHideOnScroll
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit px-1">
               逢甲大學課程問答機械人
            </p>
          </NextLink>
        </NavbarBrand>
        
        {/* 移除 navItems 相關代碼 */}
      </NavbarContent>

      <NavbarContent className="flex sm:basis-full" justify="end">
        <NavbarItem className="flex gap-2">
          <LoginButton />
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </NextUINavbar>
  );
};
