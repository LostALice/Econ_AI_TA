// Code by AkinoAlice@TyrantRey

import { IFiles } from "@/types/global";

export interface TAskQuestionRequestFormat {
  chatID: string;
  question: string;
  userID: string | "guest";
  collection: string | "default";
}

export interface TAskQuestionResponseFormat {
  questionUUID: string;
  answer: string;
  files: IFiles[];
}

export interface IDocsFormat {
  fileID: string;
  fileName: string;
  lastUpdate: string;
}

export interface IMessageInfo {
  chatUUID: string;
  questionUUID: string;
  question: string;
  answer: string;
  files: IFiles[];
  time: string;
}

export type TQuestionMode = "CHATTING" | "TESTING" | "THEOREM";
