import { createContext, useState } from "react";

export type TAuthRole = {
  role: string;
  setRole: (role: string) => void;
};

export const AuthContext = createContext<TAuthRole>({
  role: "未登入",
  setRole: (role: string) => {},
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
