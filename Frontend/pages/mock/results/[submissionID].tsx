// Code by AkinoAlice@TyrantRey

import { GetServerSideProps } from "next"
import { useRouter } from "next/router"
import {
    Button,
    Link,
    Skeleton,
    Spinner
} from "@heroui/react"
import DefaultLayout from "@/layouts/default";

import { LangContext } from "@/contexts/LangContext";

import { useContext, useEffect, useState } from "react";
import { LanguageTable } from "@/i18n";
import { IExamResult } from "@/types/mock/mock"

import { fetchExamResult } from "@/api/mock/mock"

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { resolvedUrl } = context
    const regex = /^\/mock\/results\/\d+$/
    if (!regex.test(resolvedUrl)) {
        return { notFound: true }
    }
    return {
        props: {},
    }
}

export default function MockPage() {
    const router = useRouter()

    const { language, setLang } = useContext(LangContext);
    const submissionID = Number(router.query.submissionID) as number

    const [examResult, setExamResult] = useState<IExamResult | null>()

    useEffect(() => {
        // Fetch exam result from the server
        fetchExamResult(submissionID).then(
            (response) => {
                if (response) {
                    setExamResult(response)
                }
            }
        )

    }, [submissionID])

    return (
        <DefaultLayout>
            <div className="flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-xl shadow-md p-6">
                    <h1 className="text-2xl font-bold mb-4">{LanguageTable.mock.result.examResults[language]}</h1>
                    {
                        examResult ? (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <span className="font-semibold">{LanguageTable.mock.result.examId[language]}</span> {examResult.exam_id}
                                    </div>
                                    <div>
                                        <span className="font-semibold">{LanguageTable.mock.result.userId[language]}</span> {examResult.user_id}
                                    </div>
                                    <div>
                                        <span className="font-semibold">{LanguageTable.mock.result.examName[language]}</span> {examResult.exam_name}
                                    </div>
                                    <div>
                                        <span className="font-semibold">{LanguageTable.mock.result.examType[language]}</span> {examResult.exam_type}
                                    </div>
                                    <div>
                                        <span className="font-semibold">{LanguageTable.mock.result.examDate[language]}</span> {examResult.exam_date}
                                    </div>
                                    <div>
                                        <span className="font-semibold">{LanguageTable.mock.result.totalCorrectAnswer[language]}</span> {examResult.total_correct_answers}
                                    </div>
                                    <div>
                                        <span className="font-semibold">{LanguageTable.mock.result.scorePercentage[language]}</span> {examResult.score_percentage}%
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col justify-center items-center space-y-3 gap-3 rounded-lg">
                                <Spinner />
                                <span className="top-3">
                                    {LanguageTable.mock.result.loading[language]}
                                </span>
                            </div>
                        )
                    }

                </div>
                <div className="flex p-3">
                    <Button
                        as={Link}
                        href={"/mock/"}
                    >
                        {LanguageTable.mock.result.back[language]}
                    </Button>
                </div>
            </div>
        </DefaultLayout>
    )
}