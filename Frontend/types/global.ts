// Code by AkinoAlice@TyrantRey

import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface IFiles {
  file_name: string;
  file_uuid: string;
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

// 更新題目相關的類型定義
export interface IExcelQuestion {
  id: string; // 題目ID
  question: string; // 題目內容
  options: string[]; // 選項列表
  answer: string; // 正確答案
  category: string; // 題目類別
  difficulty: string; // 難度
  modified: boolean; // 是否被修改過
  deleted?: boolean; // 是否標記為刪除
  picture?: string; // 主圖片（Base64格式）- 向後兼容
  pictures?: string[]; // 所有圖片列表（包含主圖片）- 新增支援
  sourceFile?: string; // 來源檔案名稱 - 用於合併題庫時顯示題目來源
  sourceFileId?: string; // 來源檔案ID - 用於追蹤題目來源
}

// 文件內容類型定義
export interface IDocContent {
  fileID: string;
  fileName: string;
  lastUpdate: string;
  questions: IExcelQuestion[]; // 題目列表
  originalContent?: any; // 原始檔案內容 (用於保存回檔案)
}

// Excel 文件列表項目類型定義
export interface IDocsFormat {
  fileID: string; // 檔案 ID
  fileName: string; // 檔案名稱
  docType: string; // 文件類型
  lastUpdate: string; // 最後更新時間
  uploadTime?: string; // 上傳時間（可選，用於兼容）
  questionCount: number; // 題目數量
}
