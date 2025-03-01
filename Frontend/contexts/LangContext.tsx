// Code by AkinoAlice@TyrantRey

import { createContext, useState } from "react";

import { IPageLanguage, TLanguage } from "@/types/contexts/types"

export const LangContext = createContext<IPageLanguage>({
  language: "zh",
  setLang: (language: TLanguage) => { },
});


const LangProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLang] = useState<TLanguage>("zh");
  return (
    <LangContext.Provider value={{ language, setLang }}>
      {children}
    </LangContext.Provider>
  );
};

export default LangProvider;
