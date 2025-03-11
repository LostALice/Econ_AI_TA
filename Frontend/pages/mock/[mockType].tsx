// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default";
import { useContext } from "react";
import { LangContext } from "@/contexts/LangContext";
import { useRouter } from "next/router"


export default function MockPage() {
    const { language, setLang } = useContext(LangContext);
    const router = useRouter()

    return (
        <DefaultLayout>
            <div>This is a {router.query.mockType} exam page.</div>
        </DefaultLayout>
    )
}