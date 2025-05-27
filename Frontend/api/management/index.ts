// Code by AkinoAlice@TyrantRey

import { fetcher } from "../fetcher"
import { IUserModel, IClassModel } from "@/types/management"
import { siteConfig } from "@/config/site"

export async function fetchUser(): Promise<IUserModel[]> {
    const data = await fetcher(siteConfig.api_url + "/management/user-list/", { method: "GET" })
    console.log(data)
    return data.map((user: IUserModel) => {
        return {
            user_id: user.user_id,
            username: user.username,
            role_name: user.role_name,
        }
    })

}

export async function fetchTeacher(): Promise<IUserModel[]> {
    const data = await fetcher(siteConfig.api_url + "/management/teacher-list/", { method: "GET" })
    console.log(data)
    return data.map((teacher: IUserModel) => {
        return {
            user_id: teacher.user_id,
            username: teacher.username,
            role_name: teacher.role_name,
        }
    })
}

export async function fetchClass(): Promise<IClassModel[]> {
    const data = await fetcher(siteConfig.api_url + "/management/class-list/", { method: "GET" })
    console.log(data)
    return data.map((class_: IClassModel) => {
        return {
            class_id: class_.class_id,
            classname: class_.classname,
        }
    })
}

export async function newUser(classId: number, userId: number): Promise<number> {
    const data = await fetcher(siteConfig.api_url + "/management/new-user/", {
        method: "POST",
        body: JSON.stringify({
            class_id: classId,
            user_id: userId,
        })
    })
    return data
}

export async function newClass(classname: string): Promise<number> {
    const data = await fetcher(siteConfig.api_url + "/management/new-class/", {
        method: "POST",
        body: JSON.stringify({
            classname: classname,
        })
    })
    return data
}

export async function removeUser(classId: number, userId: number): Promise<number> {
    const data = await fetcher(
        siteConfig.api_url + "/management/delete-user/?" + new URLSearchParams({
            class_id: classId.toString(),
            user_id: userId.toString(),
        }), {
        method: "DELETE",
    })
    return data
}

export async function removeClass(classId: number): Promise<number> {
    const data = await fetcher(
        siteConfig.api_url + "/management/delete-class/?" + new URLSearchParams({
            class_id: classId.toString()
        }), {
        method: "DELETE",
    })
    return data
}