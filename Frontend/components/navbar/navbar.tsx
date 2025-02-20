import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/react";

import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/navbar/theme-switch";
import { LoginButton } from "@/components/navbar/loginButton";
import { LangSwitch } from "@/components/navbar/langSwitch";

import { Logo } from "@/components/navbar/icons";
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";
import { useContext } from "react";

export const Navbar = () => {
  const { language, setLang } = useContext(LangContext);

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
            <p className="hidden sm:inline font-bold text-inherit px-1">
              {LanguageTable.nav.title[language]}
            </p>
          </NextLink>
        </NavbarBrand>

        <div className="flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                color="foreground"
                href={item.href}
              >
                {LanguageTable.nav.links[item.label as keyof typeof LanguageTable.nav.links][language]}
              </NextLink>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent className="flex sm:basis-full" justify="end">
        <NavbarItem className="flex gap-1">
          <LangSwitch />
          <LoginButton />
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </NextUINavbar>
  );
};
