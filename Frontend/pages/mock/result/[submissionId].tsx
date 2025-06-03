// Code by AkinoAlice@TyrantRey

import { GetServerSideProps } from "next"
import { useRouter } from "next/router"
import {
    Button,
    Link,
    Spinner
} from "@heroui/react"
import DefaultLayout from "@/layouts/default";

import { LangContext } from "@/contexts/LangContext";

import { useContext, useEffect, useState } from "react";
import { LanguageTable } from "@/i18n";
import { IMockResult } from "@/types/mock/create"

import { fetchExamResults } from "@/api/mock/results/submissionID"

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { resolvedUrl } = context
    const regex = /^\/mock\/result\/\d+$/
    if (!regex.test(resolvedUrl)) {
        return { notFound: true }
    }
    return {
        props: {},
    }
}

export default function SubmissionResultPage() {
    const router = useRouter()

    const { language, setLang } = useContext(LangContext);
    const submissionID = Number(router.query.submissionId) as number

    const [examResult, setExamResult] = useState<IMockResult | null>(null)
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true)

    useEffect(() => {
        // Fetch exam result from the server
        setIsPageLoading(true)
        const loadData = async () => {
            const resultData = await fetchExamResults(submissionID)
            setExamResult(resultData)
        }
        setIsPageLoading(false)
        loadData()
    }, [submissionID])

    return (
        <DefaultLayout>
            <div className="flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-xl shadow-md p-6">
                    <h1 className="text-2xl font-bold mb-4">{LanguageTable.mock.result.examResults[language]}</h1>
                    {
                        !isPageLoading ? (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <span className="font-semibold">
                                            {LanguageTable.mock.result.examId[language]}
                                            {examResult ? examResult.exam_id : LanguageTable.mock.result.noData[language]}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            {LanguageTable.mock.result.userId[language]}
                                            {examResult ? examResult.user_id : LanguageTable.mock.result.noData[language]}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            {LanguageTable.mock.result.examName[language]}
                                            {examResult ? examResult.exam_name : LanguageTable.mock.result.noData[language]}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            {LanguageTable.mock.result.examType[language]}
                                            {examResult ? LanguageTable.mock.result[examResult.exam_type as keyof typeof LanguageTable.mock.result][language] : LanguageTable.mock.result.noData[language]}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            {LanguageTable.mock.result.examDate[language]}
                                            {examResult ? examResult.exam_date.replace("T", " ") : LanguageTable.mock.result.noData[language]}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            {LanguageTable.mock.result.score[language]}
                                            {examResult ? examResult.score : LanguageTable.mock.result.noData[language]}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">
                                            {LanguageTable.mock.result.totalQuestion[language]}
                                            {examResult ? examResult.total_question : LanguageTable.mock.result.noData[language]}
                                        </span>
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