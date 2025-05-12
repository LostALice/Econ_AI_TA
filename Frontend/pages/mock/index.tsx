// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default";
import {
    Button,
    Link,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    useDisclosure,
} from "@heroui/react"

import { IExamsInfoForStudent } from "@/types/mock/index";
import { getTargetedExamTypeList } from "@/api/mock/index"

import { LangContext } from "@/contexts/LangContext";
import { AuthContext } from "@/contexts/AuthContext"

import { getCookie } from "cookies-next"
import { useContext, useEffect, useState } from "react";
import { LanguageTable } from "@/i18n";

export default function MockPage() {
    const { isOpen: isOpenDrawer, onOpen: onOpenDrawer, onOpenChange: onOpenDrawerChange } = useDisclosure();
    const { language, setLang } = useContext(LangContext);
    const { role, setRole } = useContext(AuthContext)

    const [examLists, setExamLists] = useState<IExamsInfoForStudent[]>([]);


    useEffect(() => {
        const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language]
        setRole(userRole)
    })

    const handleFetchExamTypeList = async (examType: string) => {
        const exam_data = await getTargetedExamTypeList(examType)
        console.log(exam_data)
        setExamLists(exam_data)
    }

    return (
        <DefaultLayout>
            <Drawer isOpen={isOpenDrawer} placement="left" onOpenChange={onOpenDrawerChange}>
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">
                                {LanguageTable.mock.crate.examList[language]}
                            </DrawerHeader>
                            <DrawerBody>
                                {
                                    examLists.map((exam) => (
                                        <Button
                                            as={Link}
                                            href={`/mock/${exam.exam_id}`}
                                            key={exam.exam_id}
                                            onPress={() => {
                                                onClose()
                                            }}
                                        >
                                            {exam.exam_name}
                                        </Button>
                                    ))
                                }
                            </DrawerBody>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
            <div className="flex items-center justify-center h-[90vh]">
                <div className="flex flex-col justify-center items-center h-full w-3/6 gap-5">
                    {
                        role == LanguageTable.nav.role.unsigned[language] ?
                            (
                                <Button
                                    className="border text-medium border-none"
                                    as={Link}
                                    href="/login"
                                >
                                    {LanguageTable.mock.index.loginFirst[language]}
                                </Button>

                            ) : (
                                <></>
                            )
                    }
                    <Button
                        onPress={() => {
                            handleFetchExamTypeList("basic")
                            onOpenDrawer()
                        }}
                        className="w-full py-3 transition duration-200 text-center border rounded text-xl"
                        isDisabled={role == LanguageTable.nav.role.unsigned[language] ? true : false}
                    >
                        {LanguageTable.mock.index.basic[language]}
                    </Button>
                    <Button
                        onPress={() => {
                            handleFetchExamTypeList("cse")
                            onOpenDrawer()
                        }}
                        isDisabled={role == LanguageTable.nav.role.unsigned[language] ? true : false}
                        className="w-full py-3 transition duration-200 text-center border rounded text-xl"
                    >
                        {LanguageTable.mock.index.cse[language]}
                    </Button>
                    {

                        ["Teacher", "Ta", "Admin"].includes(role) ?
                            <>
                                <Button
                                    as={Link}
                                    href="/mock/create"
                                    underline="hover"
                                    className="w-full py-3 transition duration-200 text-center border rounded text-xl"
                                >
                                    {LanguageTable.mock.index.create[language]}
                                </Button>
                                <Button
                                    as={Link}
                                    href="/mock/result"
                                    underline="hover"
                                    className="w-full py-3 transition duration-200 text-center border rounded text-xl"
                                >
                                    {LanguageTable.mock.index.result[language]}
                                </Button>
                            </>
                            : <></>
                    }
                </div>
            </div>
        </DefaultLayout>
    )
}