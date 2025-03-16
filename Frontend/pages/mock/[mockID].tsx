// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default"
import { useContext, useEffect, useState } from "react"
import { LangContext } from "@/contexts/LangContext"
import { GetServerSideProps } from "next"
import { useRouter } from "next/router"

import { MockExamQuestionList, MockExamInformation } from "@/types/mock/mock"
import { IStudentAnswer } from "@/types/mock/mock"
import { fetchMockExamQuestionList } from "@/api/mock/mock"

import { LanguageTable } from "@/i18n"
import { ImageBox } from "@/components/chat/imageBox"
import {
    Link,
    Button,
    RadioGroup,
    Radio,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    addToast,
} from "@heroui/react"

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { resolvedUrl } = context
    const regex = /^\/mock\/\d+$/
    if (!regex.test(resolvedUrl)) {
        return { notFound: true }
    }

    return {
        props: {},
    }
}

export default function MockPage() {
    const router = useRouter()
    const { language, setLang } = useContext(LangContext)

    const mockID = Number(router.query.mockID) as number
    const [studentAnswers, setStudentAnswers] = useState<IStudentAnswer[]>([])
    const [questionsList, SetQuestionList] = useState<MockExamQuestionList[]>([])
    const [mockInfo, SetMockInfo] = useState<MockExamInformation | undefined>()

    useEffect(() => {
        // Fetch exam question from the server
        fetchMockExamQuestionList(mockID).then(
            (response) => {
                if (response[0].length > 0) {
                    const [mockQuestionsList, mockQuestionsInfo] = response
                    SetMockInfo(mockQuestionsInfo)
                    SetQuestionList(mockQuestionsList)
                }
                else {
                    console.error("Failed to fetch mock exam questions")
                }
            }
        )
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [mockID])

    const handelOnAnswerChange = (newQuestionID: number, newOptionID: number) => {
        let inArray: boolean = false
        const newStudentAnswer: IStudentAnswer = {
            question_id: newQuestionID,
            answer: newOptionID,
        }

        for (const prevStudentAnswer of studentAnswers) {
            if (prevStudentAnswer.question_id === newQuestionID) {
                inArray = true
                break
            }
        }

        if (inArray) {
            const updatedStudentAnswers = studentAnswers.map((answer) => {
                if (answer.question_id === newQuestionID) {
                    return newStudentAnswer
                }
                return answer
            })
            setStudentAnswers(updatedStudentAnswers)
        }
        else {
            setStudentAnswers([...studentAnswers, newStudentAnswer])
        }
    }

    const handelOnSubmitAnswer = () => {
        console.log(studentAnswers)
        if (studentAnswers.length != questionsList.length) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.mock.answerNotComplete[language],
            })
        }
    }

    return (
        <DefaultLayout>
            <div >
                <div className="max-w-5xl mx-auto shadow-md rounded-lg p-6">
                    <div className="p-3 flex justify-between">
                        {
                            mockInfo ? (
                                <>
                                    <span className="text-2xl font-bold mb-4">{LanguageTable.mock.mock.quiz[language]}:{mockInfo.exam_name}</span>
                                    <span className="text-2xl font-bold mb-4">{LanguageTable.mock.mock.duration[language]}{mockInfo.exam_duration}{LanguageTable.mock.mock.minutes[language]}</span>
                                </>
                            )
                                : (<></>)
                        }
                    </div>
                    {
                        questionsList.length > 0 ?
                            (
                                <>
                                    {questionsList.map((question, qIdx) => (
                                        <div key={qIdx} className="mb-8">
                                            <p className="text-xl mb-2">{qIdx + 1}. {question.question_text}</p>
                                            <div className="overflow-x-auto mb-4">
                                                <div className="flex gap-4">
                                                    {question.question_images.map((image, index) => (
                                                        <ImageBox key={index} base64Image={image} onClose={() => (null)} />
                                                    ))}
                                                </div>
                                            </div>
                                            <RadioGroup
                                                className="p-4 border rounded cursor-pointer grid grid-cols-1 md:grid-cols-2 gap-4"
                                                onValueChange={(option_id) => handelOnAnswerChange(question.question_id, Number(option_id))}
                                            >
                                                {question.question_options.map((option, oIdx) => (
                                                    <Radio
                                                        key={oIdx}
                                                        value={option.option_id.toString()}
                                                        className="mr-2"
                                                    >
                                                        {option.option_text}

                                                    </Radio>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    ))}
                                    <div className="flex justify-end">
                                        <Button
                                            className="px-6 py-2 rounded hover:bg-slate-700 transition"
                                            onPress={handelOnSubmitAnswer}
                                        >
                                            {LanguageTable.mock.mock.submit[language]}
                                        </Button>
                                    </div>
                                </>

                            )
                            : (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <h1>{LanguageTable.mock.mock.noQuestions[language]}</h1>
                                    <Button
                                        as={Link}
                                        href="/mock"
                                    >
                                        {LanguageTable.mock.mock.back[language]}
                                    </Button>
                                </div>
                            )
                    }
                </div>
            </div>
        </DefaultLayout >
    )
}