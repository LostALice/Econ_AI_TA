// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default";
import {
    Button,
    Link,
    Tooltip
} from "@heroui/react"

import { LangContext } from "@/contexts/LangContext";
import { AuthContext } from "@/contexts/AuthContext"

import { getCookie } from "cookies-next"
import { useContext, useEffect } from "react";
import { LanguageTable } from "@/i18n";

export default function MockPage() {
    const { language, setLang } = useContext(LangContext);
    const { role, setRole } = useContext(AuthContext)

    useEffect(() => {
        const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language]
        setRole(userRole)
    })

    return (
        <DefaultLayout>
            <div className="flex items-center justify-center h-[90vh]">
                <div className="flex flex-col justify-center items-center h-full w-3/6 gap-5">
                    <Button
                        href="/mock/basic"
                        underline="hover"
                        className="w-full py-3 transition duration-200 text-center border rounded text-xl"
                        as={Link}
                    >
                        {LanguageTable.mock.index.basic[language]}
                    </Button>
                    <Button
                        as={Link}
                        href="/mock/cse"
                        underline="hover"
                        className="w-full py-3 transition duration-200 text-center border rounded text-xl"
                    >
                        {LanguageTable.mock.index.cse[language]}
                    </Button>
                    <Button
                        isDisabled={role == "Admin" ? false : true}
                        as={Link}
                        href="/mock/create"
                        underline="hover"
                        className="w-full py-3 transition duration-200 text-center border rounded text-xl"
                    >
                        {LanguageTable.mock.index.create[language]}
                    </Button>
                </div>
            </div>
        </DefaultLayout>
    )
}