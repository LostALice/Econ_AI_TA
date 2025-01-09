import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  ButtonGroup
} from "@nextui-org/react";

import { link as linkStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/navbar/theme-switch";
import { LoginButton } from "@/components/navbar/loginButton";
import { LangSwitch } from "@/components/navbar/langSwitch";

import { Logo } from "@/components/navbar/icons";

export const Navbar = () => {
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
              逢甲大學經濟學課程智能TA
            </p>
          </NextLink>
        </NavbarBrand>

        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent className="flex sm:basis-full" justify="end">
        <NavbarItem className="flex gap-2">
          <ButtonGroup
            className="gap-1"
          >
            <LangSwitch />
            <LoginButton />
            <ThemeSwitch />
          </ButtonGroup>
        </NavbarItem>
      </NavbarContent>
    </NextUINavbar>
  );
};
