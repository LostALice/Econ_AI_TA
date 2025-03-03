// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default";
import { useContext } from "react";
import { LangContext } from "@/contexts/LangContext";

export default function MockPage() {
    const { language, setLang } = useContext(LangContext);

    return (
        <DefaultLayout>
            <div>This is a mock exam page.</div>
        </DefaultLayout>
    )
}