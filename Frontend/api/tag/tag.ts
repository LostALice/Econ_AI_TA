// # Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site"
import { fetcher } from "../fetcher"
import { TagModel } from "@/types/tag/tag"

export async function fetchQuestionTag(questionId: number): Promise<TagModel[]> {
    try {
        const response = await fetcher(siteConfig.api_url + `/mock/tag/question/${questionId}/`,
            { method: "GET" }
        )
        console.log(response)
        return response as TagModel[]
    }
    catch (e) {
        console.error(e)
        return []
    }
}

export async function fetchTagList(): Promise<TagModel[]> {
    try {
        const response = await fetcher(siteConfig.api_url + `/mock/tag/list/`,
            { method: "GET" }
        )
        console.log(response)
        return response as TagModel[]
    }
    catch (e) {
        console.error(e)
        return []
    }
}
export async function fetchTag(tag_id: number): Promise<TagModel | null> {
    try {
        const response = await fetcher(siteConfig.api_url + `/mock/tag/${tag_id}/`,
            { method: "GET" }
        )
        console.log(response)
        return response
    }
    catch (e) {
        console.error(e)
        return null
    }
}

export async function createTag(tag_name: string, tag_description: string): Promise<boolean | null> {
    try {
        const response = await fetcher(siteConfig.api_url + `/mock/tag/create/?` +
            new URLSearchParams({
                tag_name: tag_name,
                tag_description: tag_description,
            }),
            { method: "POST" }
        )
        console.log(response)
        return response
    }
    catch (e) {
        console.error(e)
        return null
    }
}
export async function removeTag(tag_id: number): Promise<boolean | null> {
    try {
        const response = await fetcher(siteConfig.api_url + `/mock/tag/delete/?` +
            new URLSearchParams({
                tag_id: tag_id.toString(),
            }),
            { method: "DELETE" }
        )
        console.log(response)
        return response
    }
    catch (e) {
        console.error(e)
        return null
    }
}

export async function addQuestionTag(questionId: number, tag_id: number): Promise<boolean | null> {
    try {
        const response = await fetcher(siteConfig.api_url + `/mock/tag/add/${questionId}/?` +
            new URLSearchParams({
                tag_id: tag_id.toString(),
            }),
            { method: "POST" }
        )
        console.log(response)
        return response
    }
    catch (e) {
        console.error(e)
        return null
    }
}
export async function removeQuestionTag(questionId: number, tag_id: number): Promise<boolean | null> {
    try {
        const response = await fetcher(siteConfig.api_url + `/mock/tag/remove/${questionId}/?` +
            new URLSearchParams({
                tag_id: tag_id.toString(),
            }),
            { method: "DELETE" }
        )
        console.log(response)
        return response
    }
    catch (e) {
        console.error(e)
        return null
    }
}
