// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default"
import { useContext, useEffect, useState } from "react"
import { LangContext } from "@/contexts/LangContext"
import { GetServerSideProps } from "next"
import { useRouter } from "next/router"

import {
    IMockExamQuestionList,
    IMockExamInformation,
    ISubmittedQuestion,
    ISubmittedExam,
} from "@/types/mock/mock"
import { IStudentAnswer } from "@/types/mock/mock"
import { fetchMockExamQuestionList, submitExam } from "@/api/mock/mock"

import { LanguageTable } from "@/i18n"
import { ImageBox } from "@/components/chat/imageBox"
import { Timer } from "@/components/mock/timer"
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
    useDisclosure,
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
    const { isOpen: isModelOpen, onOpen: onModelOpen, onClose: onModelClose } = useDisclosure();

    const mockID = Number(router.query.mockID) as number
    const [studentAnswers, setStudentAnswers] = useState<IStudentAnswer[]>([])
    const [questionsList, SetQuestionList] = useState<IMockExamQuestionList[]>([])
    const [mockInfo, SetMockInfo] = useState<IMockExamInformation | undefined>()

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

    const onHandleAnswerChange = (newQuestionID: number, newOptionID: number) => {
        let inArray: boolean = false
        const newStudentAnswer: IStudentAnswer = {
            question_id: newQuestionID,
            answer_option_id: newOptionID,
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

    const onHandleSubmitAnswer = () => {
        console.log(studentAnswers)
        if (studentAnswers.length != questionsList.length) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.mock.answerNotComplete[language],
            })
        } else {
            onModelOpen()
        }
    }

    const onHandleForcedSubmitAnswer = async () => {
        // TODO: Send answer to the server
        if (!mockInfo) {
            console.error("No mock information found")
            return
        }

        const tempExamQuestionToBeSubmitted: ISubmittedQuestion[] = []
        for (const ans of studentAnswers) {
            tempExamQuestionToBeSubmitted.push({
                question_id: ans.question_id,
                submitted_answer_option_id: ans.answer_option_id,
            })
        }

        const tempExamToBeSubmitted: ISubmittedExam = {
            exam_id: mockInfo.exam_id,
            user_id: 0,
            submitted_questions: tempExamQuestionToBeSubmitted,
        }

        console.log(tempExamToBeSubmitted)
        const submissionID = await submitExam(tempExamToBeSubmitted)

        if (submissionID) {
            addToast({
                color: "success",
                title: LanguageTable.mock.mock.answerSubmitSuccess[language],
            })

            router.push("/mock/results/" + submissionID)
        } else {
            addToast({
                color: "warning",
                title: LanguageTable.mock.mock.answerSubmitFailed[language],
            })
            router.push("/mock")
        }

    }

    return (
        <DefaultLayout>
            <div>
                <Modal isOpen={isModelOpen} onClose={onModelClose}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">{LanguageTable.mock.mock.onSubmit[language]}</ModalHeader>
                                <ModalBody>
                                    <div>
                                        {LanguageTable.mock.mock.cantModify[language]}
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button onPress={onClose}>
                                        {LanguageTable.mock.mock.back[language]}
                                    </Button>
                                    <Button color="danger" onPress={() => {
                                        onHandleForcedSubmitAnswer()
                                        onClose()
                                    }}>
                                        {LanguageTable.mock.mock.submit[language]}
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
                <div className="max-w-5xl mx-auto shadow-md rounded-lg p-6">
                    <div className="py-3 flex justify-between">
                        {
                            mockInfo ? (
                                <>
                                    <span className="text-2xl font-bold">{LanguageTable.mock.mock.quiz[language]}:{mockInfo.exam_name}</span>
                                    <Timer duration={mockInfo.exam_duration} onTimeUp={onHandleForcedSubmitAnswer} />
                                    <span className="text-2xl font-bold">{LanguageTable.mock.mock.duration[language]}{mockInfo.exam_duration}{LanguageTable.mock.mock.minutes[language]}</span>
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
                                                onValueChange={(option_id) => onHandleAnswerChange(question.question_id, Number(option_id))}
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
                                    <div className="flex justify-center">
                                        <Button
                                            className="px-6 py-2 rounded hover:bg-slate-700 transition"
                                            onPress={onHandleSubmitAnswer}
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