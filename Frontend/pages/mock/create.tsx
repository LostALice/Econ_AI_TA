// Code by AkinoAlice@TyrantRey

import { LangContext } from "@/contexts/LangContext";
import DefaultLayout from "@/layouts/default";
import { useContext, useState, useEffect } from "react";
import { LanguageTable } from "@/i18n";
import { fetchExamLists } from "@/api/mock/create";

import {
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Listbox,
    ListboxItem,
    ListboxSection,
    useDisclosure,
    Textarea,
    Input,
    Checkbox,
    addToast
} from "@heroui/react";

import { ImageBox } from "@/components/chat/imageBox"

export default function MockPage() {
    const { language, setLang } = useContext(LangContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [examInfo, setExamInfo] = useState<IExamsInfo>();
    const [examLists, setExamLists] = useState<IExamsInfo[] | []>([]);

    const [displayExamQuestionList, setDisplayExamQuestionList] = useState<IExamQuestion[] | []>([]);
    const [currentDisplayExamQuestion, setCurrentDisplayExamQuestion] = useState<IExamQuestion | null>()

    const [questionTextFelid, setQuestionTextFelid] = useState<string>("");
    const [base64ImageList, setBase64ImageList] = useState<string[] | []>([])
    const [options, setOptions] = useState<IExamOption[]>([
        { option_id: 1, option_text: "", is_correct: false },
        { option_id: 2, option_text: "", is_correct: false },
        { option_id: 3, option_text: "", is_correct: false },
        { option_id: 4, option_text: "", is_correct: false },
    ]);

    const handleExamChange = (exam_id: number): IExamQuestion[] => {
        const examQuestionList = examLists.filter(
            (exam) => exam.exam_id === exam_id
        )
        setExamInfo(examQuestionList[0])
        return examQuestionList[0].exam_questions
    }

    const handleRemoveImage = (indexToRemove: number) => {
        setBase64ImageList(prevList =>
            prevList.filter((_, index) => index !== indexToRemove)
        )
    }

    useEffect(() => {
        const data = fetchExamLists().then((data) => {
            if (data.length > 1) {
                setExamLists(data)
            } else {
                setExamLists([data])
            }

        })
    }, [])

    useEffect(() => {
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
                            setBase64ImageList(prev => [...prev, base64String])
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
    }, [base64ImageList])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target
        if (!files || files.length === 0) { return }
        if (base64ImageList.length > 3) { return }

        const reader = new FileReader()
        reader.readAsDataURL(files[0])
        reader.onload = () => {
            if (reader.result) {
                let base64ImageString = reader.result as string
                base64ImageString = base64ImageString.split(",")[1]
                setBase64ImageList([...base64ImageList, base64ImageString])
            }
            else {
                console.error("File reader failed")
            }
        }
    }

    const handleOptionChange = (index: number, field: keyof IExamOption, value: string | boolean) => {
        console.log(index, field, value)
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setOptions(newOptions);
    };

    const handleSelectedQuestion = (selectedQuestion: IExamQuestion) => {
        // console.log(selectedQuestion)
        setCurrentDisplayExamQuestion(selectedQuestion)
        setQuestionTextFelid(selectedQuestion.question_text)
        if (selectedQuestion.question_images && selectedQuestion.question_images.length > 0) {
            setBase64ImageList(selectedQuestion.question_images)
        }
        else {
            setBase64ImageList([])
        }
        setOptions(selectedQuestion.question_options)
    }

    const handleSaveQuestion = (currentExamQuestion: IExamQuestion) => {
        // update question content

        if (questionTextFelid == "") {
            addToast({
                color: "danger",
                title: LanguageTable.mock.crate.missingEnterQuestionText[language],
            });
        }
        let haveCorrectAnswer = 0
        for (const option of options) {
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

        const updatedQuestion: IExamQuestion = {
            exam_id: currentExamQuestion.exam_id,
            question_id: currentExamQuestion.question_id,
            question_text: currentExamQuestion.question_text,
            question_images: base64ImageList,
            question_options: currentExamQuestion.question_options,
        }

        console.log(updatedQuestion)

        // update example question list 
        // update exam info
    }

    const handleCreateExam = () => {
        // TODO: Implement create exam logic
    }

    const handleCreateQuestion = () => {
        // TODO: Implement create question logic
    }

    const handleDeleteExam = () => {
        // TODO: Implement create question logic
    }

    const handleDeleteQuestion = () => {
        // TODO: Implement create question logic
    }

    return (
        <>
            <DefaultLayout>
                <Drawer isOpen={isOpen} placement="left" onOpenChange={onOpenChange}>
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
                                                    setDisplayExamQuestionList(handleExamChange(exam.exam_id))
                                                    onClose()
                                                }}
                                            >
                                                {exam.exam_name}
                                            </Button>
                                        ))
                                    }
                                </DrawerBody>
                                <DrawerFooter>
                                    <Button
                                        color="primary"
                                        onPress={() => {
                                            onClose
                                        }}>
                                        {LanguageTable.mock.crate.newExam[language]}
                                    </Button>
                                </DrawerFooter>
                            </>
                        )}
                    </DrawerContent>
                </Drawer>
                <div className="flex justify-between p-1">
                    <Button onPress={onOpen}>
                        {LanguageTable.mock.crate.examList[language]}
                    </Button>
                    <div className="flex items-center justify-center">
                        {LanguageTable.mock.crate.currentExam[language]} {examInfo?.exam_name || LanguageTable.mock.crate.selected[language]}
                    </div>
                </div>
                <div className="flex justify-normal">
                    <div className="w-1/4 h-full">
                        <Listbox aria-label="Actions" className="truncate">
                            <ListboxSection title={LanguageTable.mock.crate.question[language]}>
                                {
                                    displayExamQuestionList.length > 0 ?
                                        (displayExamQuestionList.map((question, index) => {
                                            return (
                                                <ListboxItem
                                                    onPress={() => handleSelectedQuestion(question)}
                                                    key={index}
                                                    className="truncate"
                                                    description={index + 1 + " " + question.question_text}
                                                    textValue="1"
                                                />
                                            )
                                        })) : (
                                            <ListboxItem description={LanguageTable.mock.crate.noItem[language]} textValue="1" />
                                        )
                                }
                            </ListboxSection>
                            <ListboxSection title={LanguageTable.mock.crate.newOrDelete[language]}>
                                <ListboxItem color="primary" description={LanguageTable.mock.crate.new[language]} textValue="1" />
                                <ListboxItem className="text-danger" color="danger" description={LanguageTable.mock.crate.delete[language]} textValue="1" />
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
                                        {base64ImageList.map((image, index) => (
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
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {/* Options */}
                                <div>
                                    <h2 className="text-xl mb-3">
                                        {LanguageTable.mock.crate.options[language]}
                                    </h2>
                                    <div className="space-y-4">
                                        {options.map((option, index) => (
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
                                    isDisabled={currentDisplayExamQuestion ? false : true}
                                    className="w-full px-4 py-2 rounded-md focus:outline-none"
                                    onPress={() => {
                                        if (currentDisplayExamQuestion) {
                                            handleSaveQuestion(currentDisplayExamQuestion)
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