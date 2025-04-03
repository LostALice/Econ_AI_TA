import "@/styles/globals.css";
import "@/styles/chat.css"; // 添加聊天樣式
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { fontSans, fontMono } from "@/config/fonts";
import type { AppProps } from "next/app";
import AuthProvider from "@/contexts/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <HeroUIProvider>
      <NextThemesProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};
