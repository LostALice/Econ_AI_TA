// Code by AkinoAlice@TyrantRey

import { createContext, useState } from "react";

import { TAuthRole } from "@/types/contexts/types"

export const AuthContext = createContext<TAuthRole>({
  role: "未登入",
  setRole: (role: string) => { },
});


const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [role, setRole] = useState<string>("未登入");
  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
