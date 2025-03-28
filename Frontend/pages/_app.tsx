import type { AppProps } from "next/app";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { fontSans, fontMono } from "@/config/fonts";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/router";

import AuthProvider from "@/contexts/AuthContext";
import LangProvider from "@/contexts/LangContext";
import { ToastProvider } from "@heroui/toast";

import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider>
        <AuthProvider>
          <LangProvider>
            <Component {...pageProps} />
          </LangProvider>
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};
