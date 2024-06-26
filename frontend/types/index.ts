import { SVGProps } from "react"

export type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number
}

export interface IFiles {
    file_name: string
    file_uuid: string
}

export interface IMessageInfo {
    chatUUID: string
    questionUUID: string
    question: string
    answer: string
    files: IFiles[]
    time: string
}

type TDepartmentName =
    | "工程與科學學院"
    | "商學院"
    | "人文社會學院"
    | "資訊電機學院"
    | "建設學院"
    | "金融學院"
    | "國際科技與管理學院"
    | "建築專業學院"
    | "創能學院"
    | "通識教育中心"
    | "經營管理學院"
    | "行政單位"
    | "研究中心"
    | "其他"

export interface IDepartment {
    departmentName: TDepartmentName
}
