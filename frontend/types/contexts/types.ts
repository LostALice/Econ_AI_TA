// Code by AkinoAlice@TyrantRey

export type TLanguage = "zh" | "en";

export type TAuthRole = {
  role: string;
  setRole: (role: string) => void;
};

export interface IPageLanguage {
  language: TLanguage;
  setLang: (language: TLanguage) => void;
}
