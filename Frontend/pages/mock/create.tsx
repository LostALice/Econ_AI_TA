// Code by AkinoAlice@TyrantRey

import { useContext, useState, useEffect } from "react";
import { LangContext } from "@/contexts/LangContext";
import DefaultLayout from "@/layouts/default";
import { LanguageTable } from "@/i18n";

import {
    IExamsInfo,
    IExamQuestion,
    IExamOption,
    TExamType,
    ICreateNewExamPrams,
    ICreateNewQuestionOptionsPrams,
    ICreateNewQuestionPrams,
    IModifiedQuestionOptionsPrams
} from "@/types/mock/create";

import {
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    Listbox,
    ListboxItem,
    ListboxSection,
    useDisclosure,
    Textarea,
    Input,
    Checkbox,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    NumberInput,
    RadioGroup,
    Radio,
    addToast
} from "@heroui/react";

import {
    fetchExamLists,
    createNewExam,
    createNewQuestion,
    deleteExam,
    deleteQuestion,
    modifyQuestion,
    createNewOptions
} from "@/api/mock/create";
import { ImageBox } from "@/components/chat/imageBox"

export default function MockPage() {
    const { language, setLang } = useContext(LangContext);
    const { isOpen: isOpenDrawer, onOpen: onOpenDrawer, onOpenChange: onOpenDrawerChange } = useDisclosure();
    const { isOpen: isOpenModal, onOpen: onOpenModal, onOpenChange: onOpenModalChange } = useDisclosure();

    const [currentExam, setCurrentExam] = useState<IExamsInfo>();
    const [examLists, setExamLists] = useState<IExamsInfo[] | []>([]);

    const [questionsList, setQuestionsList] = useState<IExamQuestion[] | []>([]);
    const [currentQuestion, SetCurrentQuestion] = useState<IExamQuestion | null>()

    // create exam logic
    const [createExamName, setCreateExamName] = useState<string>("")
    const [createExamDuration, setCreateExamDuration] = useState<number>(10)
    const [createExamType, setCreateExamType] = useState<TExamType>("basic")

    const [questionTextFelid, setQuestionTextFelid] = useState<string>("");
    const [base64ImageFelidList, setBase64ImageFelidList] = useState<string[] | []>([])
    const [optionsFelid, setOptionsFelid] = useState<IExamOption[]>([
        { option_id: 1, option_text: "", is_correct: false },
        { option_id: 2, option_text: "", is_correct: false },
        { option_id: 3, option_text: "", is_correct: false },
        { option_id: 4, option_text: "", is_correct: false },
    ]);

    useEffect(() => {
        fetchExamLists().then((data) => {
            if (data.length == 0) {
                setExamLists([])
            } else {
                setExamLists(data)
            }
        })
        const handlePaste = (event: ClipboardEvent) => {
            const item = event.clipboardData?.items[0]
            if (!item) { return }

            if (item.type.includes("image")) {
                const file = item.getAsFile()
                if (file) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        let base64String = e.target?.result as string
                        if (base64String) {
                            base64String = base64String.split(",")[1]
                            setBase64ImageFelidList(prev => [...prev, base64String])
                        }
                    }
                    reader.readAsDataURL(file)
                }
            }
        }
        window.addEventListener("paste", handlePaste)
        return () => {
            window.removeEventListener("paste", handlePaste)
        }
    }, [base64ImageFelidList])

    const handleRemoveImage = (indexToRemove: number) => {
        setBase64ImageFelidList(prevList =>
            prevList.filter((_, index) => index !== indexToRemove)
        )
    }
    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target
        if (!files || files.length === 0) { return }
        if (base64ImageFelidList.length > 3) { return }

        const reader = new FileReader()
        reader.readAsDataURL(files[0])
        reader.onload = () => {
            if (reader.result) {
                let base64ImageString = reader.result as string
                base64ImageString = base64ImageString.split(",")[1]
                setBase64ImageFelidList([...base64ImageFelidList, base64ImageString])
            }
            else {
                console.error("File reader failed")
            }
        }
    }

    const handleExamChange = (exam_id: number): IExamQuestion[] => {
        const examQuestionList = examLists.filter(
            (exam) => exam.exam_id == exam_id
        )
        setCurrentExam(examQuestionList[0])

        if (examQuestionList[0].exam_questions) {
            return examQuestionList[0].exam_questions
        }
        else {
            return []
        }

    }

    const handleOptionChange = (index: number, field: keyof IExamOption, value: string | boolean) => {
        const newOptions = [...optionsFelid];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setOptionsFelid(newOptions);
    };

    const handleSelectedQuestion = (selectedQuestion: IExamQuestion) => {
        SetCurrentQuestion(selectedQuestion)
        setQuestionTextFelid(selectedQuestion.question_text)

        if (selectedQuestion.question_images && selectedQuestion.question_images.length > 0) {
            setBase64ImageFelidList(selectedQuestion.question_images)
        }
        else {
            setBase64ImageFelidList([])
        }

        if (selectedQuestion.question_options) {
            setOptionsFelid(selectedQuestion.question_options)
        }

    }

    const handleCreateExam = async () => {
        // validate
        if (createExamName == "") {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.titleNoNullError[language],
            });
            return
        }

        if (createExamDuration <= 0) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.durationSubZeroError[language],
            });
            return
        }

        const examPrams: ICreateNewExamPrams = {
            exam_name: createExamName,
            exam_type: createExamType,
            exam_date: new Date().toLocaleString(),
            exam_duration: createExamDuration,
        }
        const newMockData = await createNewExam(examPrams)
        console.log(newMockData)
        if (newMockData) {
            setExamLists([...examLists, newMockData])
            addToast({
                color: "success",
                title: LanguageTable.mock.crate.examCreateSuccess[language],
            })
        }
        else {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.examCreateFailed[language],
            })
        }
    }

    const handleCreateQuestion = async (examId: number) => {
        const questionPrams: ICreateNewQuestionPrams = {
            exam_id: examId,
            question_text: LanguageTable.mock.crate.newTempQuestion[language],
        }

        const newQuestionData = await createNewQuestion(questionPrams)

        const optionsPrams: ICreateNewQuestionOptionsPrams[] = [
            { question_id: newQuestionData.question_id, option_text: "", is_correct: false },
            { question_id: newQuestionData.question_id, option_text: "", is_correct: false },
            { question_id: newQuestionData.question_id, option_text: "", is_correct: false },
            { question_id: newQuestionData.question_id, option_text: "", is_correct: false },
        ]

        const newOptionsData = await createNewOptions(optionsPrams)

        if (newQuestionData && newOptionsData) {
            const newEmptyQuestion: IExamQuestion = {
                exam_id: newQuestionData.exam_id,
                question_id: newQuestionData.question_id,
                question_text: newQuestionData.question_text,
                question_options: newOptionsData,
                question_images: [],
            }

            setQuestionsList([...questionsList, newEmptyQuestion])
            addToast({
                color: "success",
                title: LanguageTable.mock.crate.questionCreateSuccess[language],
            })
        }
        else {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.questionCreateFailed[language],
            })
        }
    }

    const handleDeleteExam = async (currentExam: IExamsInfo) => {
        // TODO: Implement create question logic
        if (!currentExam) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noExamSelectedError[language],
            })
            return
        }
        const updatedExamLists = examLists.filter(
            (exam) => exam.exam_id !== currentExam.exam_id
        )

        const success = await deleteExam(currentExam.exam_id)
        if (success) {
            addToast({
                color: "success",
                title: LanguageTable.mock.crate.questionCreateSuccess[language],
            })
            setExamLists(updatedExamLists)
        } else {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.questionCreateFailed[language],
            })
        }
    }

    const handleDeleteQuestion = async (currentQuestion: IExamQuestion) => {
        if (!currentExam) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noQuestionSelectedError[language],
            })
            return
        }
        console.log(currentQuestion.question_id)
        const success = await deleteQuestion(currentQuestion.question_id)
        console.log(success)

        if (success) {
            const updatedQuestionsList = questionsList.filter(
                (question) => question.question_id !== currentQuestion.question_id
            )
            setQuestionsList(updatedQuestionsList)
            addToast({
                color: "success",
                title: LanguageTable.mock.crate.questionCreateSuccess[language],
            })
        } else {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.questionCreateFailed[language],
            })
        }
    }

    const handleSaveQuestion = async (currentExamQuestion: IExamQuestion) => {
        // update question content
        if (!currentExam) { return }

        if (questionTextFelid == "") {
            addToast({
                color: "danger",
                title: LanguageTable.mock.crate.missingEnterQuestionText[language],
            });
        }
        let haveCorrectAnswer = 0
        for (const option of optionsFelid) {
            if (option.option_text == "") {
                addToast({
                    color: "danger",
                    title: LanguageTable.mock.crate.missingOptionText[language],
                });
                return;
            }
            if (option.is_correct) {
                haveCorrectAnswer++;
            }
        }
        if (haveCorrectAnswer === 0) {
            addToast({
                color: "danger",
                title: LanguageTable.mock.crate.missingCorrect[language],
            });
            return;
        }
        else if (haveCorrectAnswer > 1) {
            addToast({
                color: "danger",
                title: LanguageTable.mock.crate.tooManyCorrectAnswer[language],
            });
        }

        const savedOptions: IModifiedQuestionOptionsPrams[] = optionsFelid.map((option) => ({
            option_id: option.option_id,
            question_id: currentExamQuestion.question_id,
            option_text: option.option_text,
            is_correct: option.is_correct,
        }));

        const savedQuestion: IExamQuestion = {
            exam_id: currentExam.exam_id,
            question_id: currentExamQuestion.question_id,
            question_text: questionTextFelid,
            question_options: savedOptions,
            question_images: base64ImageFelidList,
        }

        console.log(savedQuestion)
        const success = await modifyQuestion(savedQuestion)

        if (success) {
            fetchExamLists().then((data) => {
                if (data.length == 0) {
                    setExamLists([])
                } else {
                    setExamLists(data)
                    const tempQuestionList = data.filter((exam: IExamsInfo) => exam.exam_id == savedQuestion.exam_id)
                    console.log(tempQuestionList)
                    setQuestionsList(tempQuestionList[0].exam_questions)
                }
            })
            addToast({
                color: "success",
                title: LanguageTable.mock.crate.questionCreateSuccess[language],
            })
        } else {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.questionCreateFailed[language],
            })
        }

    }

    return (
        <>
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
                                                key={exam.exam_id}
                                                onPress={() => {
                                                    const questions = handleExamChange(exam.exam_id)
                                                    setQuestionsList(questions)
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

                <Modal isOpen={isOpenModal} onOpenChange={onOpenModalChange}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1"></ModalHeader>
                                <ModalBody>
                                    <span>{LanguageTable.mock.crate.examTitle[language]}</span>
                                    <Input
                                        onValueChange={(value) => {
                                            setCreateExamName(value)
                                        }}
                                        validate={(value) => {
                                            if (value == "") {
                                                return LanguageTable.mock.crate.titleNoNullError[language]
                                            }
                                        }}
                                    />
                                    <span>{LanguageTable.mock.crate.examDuration[language]}</span>
                                    <NumberInput
                                        aria-label="exam duration"
                                        onValueChange={setCreateExamDuration}
                                        validate={(value) => {
                                            if (value <= 0) {
                                                return LanguageTable.mock.crate.durationSubZeroError[language]
                                            }
                                        }}
                                    />
                                    <RadioGroup
                                        label={LanguageTable.mock.crate.typeOfExam[language]}
                                        className="flex justify-between"
                                        defaultValue="basic"
                                        value={createExamType}
                                        onValueChange={(value) => setCreateExamType(value as TExamType)}
                                    >
                                        <Radio value="basic">{LanguageTable.mock.crate.basic[language]}</Radio>
                                        <Radio value="cse">{LanguageTable.mock.crate.cse[language]}</Radio>
                                    </RadioGroup>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="light" onPress={onClose}>
                                        {LanguageTable.mock.crate.close[language]}
                                    </Button>
                                    <Button color="primary" onPress={() => {
                                        handleCreateExam()
                                        onClose()
                                    }}>
                                        {LanguageTable.mock.crate.confirm[language]}
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
                <div className="flex justify-between p-1">
                    <Button onPress={onOpenDrawer}>
                        {LanguageTable.mock.crate.examList[language]}
                    </Button>
                    <div className="flex items-center justify-center">
                        {LanguageTable.mock.crate.currentExam[language]} {currentExam ? (LanguageTable.mock.crate[currentExam?.exam_type][language]) : (<></>)} {currentExam?.exam_name || LanguageTable.mock.crate.selected[language]}
                    </div>
                </div>
                <div className="flex justify-normal">
                    <div className="w-1/4 h-full">
                        <Listbox aria-label="Actions" className="truncate">
                            <ListboxSection title={LanguageTable.mock.crate.question[language]}>
                                {
                                    questionsList.length > 0 ?
                                        (questionsList.map((question, index) => {
                                            return (
                                                <ListboxItem
                                                    onPress={() => handleSelectedQuestion(question)}
                                                    key={index}
                                                    className="truncate"
                                                    description={index + 1 + ". " + question.question_text}
                                                    textValue="1"
                                                />
                                            )
                                        })) : (
                                            <ListboxItem
                                                description={LanguageTable.mock.crate.noItem[language]}
                                                textValue="1"
                                                onPress={() => {
                                                    if (currentExam) {
                                                        handleCreateQuestion(currentExam.exam_id)
                                                    }
                                                    else {
                                                        return addToast({
                                                            color: "warning",
                                                            title: LanguageTable.mock.crate.noExamSelectedError[language],
                                                        })
                                                    }
                                                }}
                                            />
                                        )
                                }
                            </ListboxSection>
                            <ListboxSection title={LanguageTable.mock.crate.newOrDeleteExam[language]}>
                                <ListboxItem
                                    onPress={() => {
                                        setCreateExamName("")
                                        setCreateExamDuration(0)
                                        onOpenModal()
                                    }}
                                    color="primary"
                                    description={LanguageTable.mock.crate.newMockExam[language]}
                                    textValue="1"
                                />
                                <ListboxItem
                                    className="text-danger"
                                    color="danger"
                                    onPress={() => {
                                        if (currentExam) {
                                            handleDeleteExam(currentExam)
                                        } else {
                                            return addToast({
                                                color: "warning",
                                                title: LanguageTable.mock.crate.noExamSelectedError[language]
                                            })
                                        }
                                    }}
                                    description={LanguageTable.mock.crate.deleteExam[language]}
                                    textValue="1"
                                />
                            </ListboxSection>
                            <ListboxSection
                                title={LanguageTable.mock.crate.newOrDeleteQuestion[language]}
                            >
                                <ListboxItem
                                    color="primary"
                                    onPress={() => {
                                        setBase64ImageFelidList([])
                                        setQuestionTextFelid("")
                                        setOptionsFelid([
                                            { option_id: 1, option_text: "", is_correct: false },
                                            { option_id: 2, option_text: "", is_correct: false },
                                            { option_id: 3, option_text: "", is_correct: false },
                                            { option_id: 4, option_text: "", is_correct: false },
                                        ])
                                        if (currentExam) {
                                            handleCreateQuestion(currentExam?.exam_id)
                                        } else {
                                            return addToast({
                                                color: "warning",
                                                title: LanguageTable.mock.crate.noExamSelectedError[language]
                                            })
                                        }
                                    }}
                                    description={LanguageTable.mock.crate.newQuestion[language]}
                                    textValue="1"
                                />
                                <ListboxItem
                                    className="text-danger"
                                    color="danger"
                                    onPress={() => {
                                        if (currentQuestion) {
                                            // handleDeleteQuestion(currentExam?.exam_id)
                                            handleDeleteQuestion(currentQuestion)
                                        } else {
                                            return addToast({
                                                color: "warning",
                                                title: LanguageTable.mock.crate.noQuestionSelectedError[language]
                                            })
                                        }
                                    }}
                                    description={LanguageTable.mock.crate.deleteQuestion[language]}
                                    textValue="1"
                                />
                            </ListboxSection>
                        </Listbox>
                    </div>
                    <div className="w-full">
                        <div className="max-w mx-auto p-6">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Question Text */}
                                <div className="flex flex-col">
                                    <h2 className="text-xl mb-1">
                                        {LanguageTable.mock.crate.questionContent[language]}
                                    </h2>
                                    <Textarea
                                        rows={4}
                                        placeholder={LanguageTable.mock.crate.enterQuestionText[language]}
                                        value={questionTextFelid}
                                        onChange={(e) => setQuestionTextFelid(e.target.value)}
                                    />
                                </div>

                                {/* Question Images */}
                                <div className="flex flex-col">
                                    <h2 className="text-xl mb-1">
                                        {LanguageTable.mock.crate.questionImages[language]}
                                    </h2>
                                    <div className="gap-1">
                                        {base64ImageFelidList.map((image, index) => (
                                            <ImageBox
                                                key={index}
                                                base64Image={image}
                                                onClose={() => handleRemoveImage(index)}
                                            />
                                        ))}
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="rounded-md shadow-sm focus:outline-none"
                                        onChange={handleImageFileChange}
                                    />
                                </div>

                                {/* Options */}
                                <div>
                                    <h2 className="text-xl mb-3">
                                        {LanguageTable.mock.crate.options[language]}
                                    </h2>
                                    <div className="space-y-4">
                                        {optionsFelid.map((option, index) => (
                                            <div key={index} className="flex items-center space-x-4">
                                                <Textarea
                                                    type="text"
                                                    placeholder={`${LanguageTable.mock.crate.optionText[language]} ${index + 1}`}
                                                    className="flex-2 rounded-md shadow-sm focus:outline-none"
                                                    value={option.option_text}
                                                    onChange={(e) => handleOptionChange(index, "option_text", e.target.value)}
                                                />
                                                <Checkbox
                                                    isSelected={option.is_correct}
                                                    onChange={(e) =>
                                                        handleOptionChange(index, "is_correct", e.target.checked)
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Save Button */}
                            <div className="mt-6">
                                <Button
                                    isDisabled={currentQuestion ? false : true}
                                    className="w-full px-4 py-2 rounded-md focus:outline-none"
                                    onPress={() => {
                                        if (currentQuestion && currentExam) {
                                            handleSaveQuestion(currentQuestion)
                                        }
                                    }}
                                >
                                    {LanguageTable.mock.crate.saveQuestion[language]}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DefaultLayout>
        </>
    )
}