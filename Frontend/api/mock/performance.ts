// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";

import { IMockResult } from "@/types/mock/create";
import { fetcher } from "../fetcher";

export async function fetchMockResultByClass(class_id: number): Promise<IMockResult[]> {
    try {
        const resp = await fetcher(siteConfig.api_url + `/result/class/${class_id}/`, { method: "GET" });
        console.log(resp)
        return resp as IMockResult[]
    }
    catch (err) {
        console.error(err)
        return []
    }
}
export async function fetchMockResultByExam(exam_id: number): Promise<IMockResult[]> {
    try {
        const resp = await fetcher(siteConfig.api_url + `/result/exam/${exam_id}/`, { method: "GET" });
        console.log(resp)
        return resp as IMockResult[]
    }
    catch (err) {
        console.error(err)
        return []
    }
}
export async function fetchMockResultByUser(user_id: number): Promise<IMockResult[]> {
    try {
        const resp = await fetcher(siteConfig.api_url + `/result/user/${user_id}/`, { method: "GET" });
        console.log(resp)
        return resp as IMockResult[]
    }
    catch (err) {
        console.error(err)
        return []
    }
}

// export async function fetchMockExcelByClass(class_id: number): Promise<IMockResult[]> {
//     try {
//         const resp = await fetcher(siteConfig.api_url + `/result/class/${class_id}/`, { method: "GET" });
//         console.log(resp)
//         return resp as IMockResult[]
//     }
//     catch (err) {
//         console.error(err)
//         return []
//     }
// }
// export async function fetchMockExcelByExam(exam_id: number): Promise<IMockResult[]> {
//     try {
//         const resp = await fetcher(siteConfig.api_url + `/result/exam/${exam_id}/`, { method: "GET" });
//         console.log(resp)
//         return resp as IMockResult[]
//     }
//     catch (err) {
//         console.error(err)
//         return []
//     }
// }
// export async function fetchMockExcelByUser(user_id: number): Promise<IMockResult[]> {
//     try {
//         const resp = await fetcher(siteConfig.api_url + `/result/user/${user_id}/`, { method: "GET" });
//         console.log(resp)
//         return resp as IMockResult[]
//     }
//     catch (err) {
//         console.error(err)
//         return []
//     }
// }