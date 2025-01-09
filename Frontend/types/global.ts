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

type TDepartmentName = "pptx" | "docx";

export interface IDepartment {
  departmentName: TDepartmentName;
}

type TPermission = true | false;

export interface ILoginPermission {
  loggedInState: TPermission;
}
