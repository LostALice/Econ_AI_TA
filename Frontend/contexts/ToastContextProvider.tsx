// Code by AkinoAlice@TyrantRey

import { HeroUIProvider } from '@heroui/react'
import { ToastProvider } from "@heroui/toast";


const ToastMessageProvide: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <HeroUIProvider>
      <ToastProvider />
      {children}
    </HeroUIProvider>
  );
};

export default ToastMessageProvide;
