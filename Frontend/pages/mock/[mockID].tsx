// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default"
import { useContext, useEffect, useState } from "react"
import { LangContext } from "@/contexts/LangContext"
import { GetServerSideProps } from "next"
import { useRouter } from "next/router"

// import {
//     IMockExamQuestionList,
//     IMockExamInformation,
//     ISubmittedQuestion,
//     ISubmittedExam,
// } from "@/types/mock/mock"
// import { IStudentAnswer } from "@/types/mock/mock"
// import { fetchMockExamQuestionList, submitExam } from "@/api/mock/mock"

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

import {
    fetchExamInfo,
    fetchExamQuestion,
    fetchExamQuestionImage,
    fetchExamQuestionOption,
    submitExam,
} from "@/api/mock/create"

import {
    IExamsModel,
    IExamQuestionModel,
    IStudentAnswer,
    IExamSubmissionModel
} from "@/types/mock/create"
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

    const mockExamID = Number(router.query.mockID) as number
    const [mockExamQuestionList, setMockExamQuestionList] = useState<IExamQuestionModel[]>([])

    const [studentAnswers, setStudentAnswers] = useState<IStudentAnswer[]>([])
    const [mockInfo, setMockInfo] = useState<IExamsModel | undefined>()

    useEffect(() => {
        const settingUpExam = async () => {
            try {
                const exam = await fetchExamInfo(mockExamID)
                const examQuestionList = await fetchExamQuestion(mockExamID)
                if (!exam) return;
                if (!examQuestionList) return;
                setMockInfo(exam)

                const tempQuestionList: IExamQuestionModel[] = []
                const tempStudentAnswerList: IStudentAnswer[] = []
                for (const question of examQuestionList) {
                    console.log(question)
                    const questionOption = await fetchExamQuestionOption(exam.exam_id, question.question_id)
                    const questionImage = await fetchExamQuestionImage(exam.exam_id, question.question_id)
                    if (!questionOption) return
                    tempQuestionList.push({
                        question_id: question.question_id,
                        question_text: question.question_text,
                        question_options: questionOption,
                        question_images: questionImage
                    })
                    tempStudentAnswerList.push({
                        question_id: question.question_id,
                        selected_option_id: null
                    })
                }
                setMockExamQuestionList(tempQuestionList)
                setStudentAnswers(tempStudentAnswerList)
            }
            catch (e) {
                console.error(e)
                addToast({
                    title: "ERROR",
                    color: "danger",
                })
            }
        }
        settingUpExam()

    }, [mockExamID])

    const onHandleForcedSubmitAnswer = async () => { }
    const onHandleAnswerChange = async (questionId: number, optionId: number) => {
        const tempAnswer: IStudentAnswer = {
            question_id: questionId,
            selected_option_id: optionId
        }
        const studentAns = studentAnswers.map((ans) =>
            ans.question_id === questionId ? tempAnswer : ans
        );
        setStudentAnswers(studentAns)
        console.log(studentAnswers)
    }

    const onCheckIsAnswerAllFilled = (): boolean => {
        for (const ans of studentAnswers) {
            if (ans.selected_option_id === null) {
                return false
            }
        }
        return true
    }

    const onHandleSubmitAnswer = async () => {
        if (!onCheckIsAnswerAllFilled()) {
            addToast({
                title: LanguageTable.mock.mock.answerNotComplete[language],
                color: "warning"
            })
        }
        const submit_exam: IExamSubmissionModel = {
            exam_id: mockExamID,
            submission_date: new Date().toISOString(),
            answer: studentAnswers
        }
        console.log(submit_exam)
        const submissionId = await submitExam(submit_exam)
        router.push(`/mock/result/${submissionId}`)
        console.log(submissionId)
    }
    const onHandleForceSubmitAnswer = async () => {
        const submit_exam: IExamSubmissionModel = {
            exam_id: mockExamID,
            submission_date: new Date().toISOString(),
            answer: studentAnswers
        }
        console.log(submit_exam)
        const submissionId = await submitExam(submit_exam)
        router.push(`/mock/result/${submissionId}`)
        console.log(submissionId)
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
                                        onHandleSubmitAnswer()
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
                                    {mockInfo.exam_duration > -1 ? <Timer duration={mockInfo.exam_duration} onTimeUp={onHandleForceSubmitAnswer} /> : <></>}
                                    <span className="text-2xl font-bold">{LanguageTable.mock.mock.duration[language]}{mockInfo.exam_duration}{LanguageTable.mock.mock.minutes[language]}</span>
                                </>
                            )
                                : (<></>)
                        }
                    </div>
                    {
                        mockExamQuestionList.length > 0 ?
                            (
                                <>
                                    {mockExamQuestionList.map((question, qIdx) => (
                                        <div key={qIdx} className="mb-8">
                                            <p className="text-xl mb-2">{qIdx + 1}. {question.question_text}</p>
                                            <div className="overflow-x-auto mb-4">
                                                <div className="flex gap-4">
                                                    {question.question_images?.map((image, index) => (
                                                        <ImageBox key={index} base64Image={image.image_data_base64} onClose={() => (null)} />
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
                                            onPress={onModelOpen}
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