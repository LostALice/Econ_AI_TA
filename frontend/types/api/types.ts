// Code by AkinoAlice@TyrantRey

import { IFiles, IDocsFormat } from "@/types/global"

export interface TAskQuestionRequestFormat {
    chatID: string
    question: string
    userID: string | "guest"
    collection: string | "default"
}

export interface TAskQuestionResponseFormat {
    questionUUID: string
    answer: string
    files: IFiles[]
}

// 重新導出 global.ts 中的 IDocsFormat 類型
export type { IDocsFormat }
