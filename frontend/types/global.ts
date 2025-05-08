// Code by AkinoAlice@TyrantRey

import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface IFiles {
  file_uuid: string;
  file_name: string;
}

export interface IMessageInfo {
  chatUUID: string;
  questionUUID: string;
  question: string;
  answer: string;
  files: IFiles[];
  time: string;
}

type TPermission = true | false;

export interface ILoginPermission {
  loggedInState: TPermission;
}

// 新增題目相關的類型定義
export interface IExcelQuestion {
  id: string;        // 題目ID
  question: string;  // 題目內容
  options: string[]; // 選項列表
  answer: string;    // 正確答案
  category: string;  // 題目類別
  difficulty: string; // 難度
  modified: boolean; // 是否被修改過
}

// 文件內容類型定義
export interface IDocContent {
  fileID: string;
  fileName: string;
  lastUpdate: string;
  questions: IExcelQuestion[]; // 題目列表
  originalContent?: any;      // 原始檔案內容 (用於保存回檔案)
}
