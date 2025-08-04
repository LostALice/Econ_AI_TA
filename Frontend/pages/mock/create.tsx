

import { useContext, useState, useEffect, ChangeEvent } from "react";
import { LangContext } from "@/contexts/LangContext";
import DefaultLayout from "@/layouts/default";
import { LanguageTable } from "@/i18n";

import {
    TExamType,
    IQuestionImageBase64Model,
    IOptionModel,
    IClassListModel,
    IExamsModel,
    IQuestionModel,
    IExamQuestionModel,
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
import { getExamTypeList } from "@/api/mock/index"
import {
    fetchClassList,
    fetchExamQuestion,
    fetchExamQuestionOption,
    fetchExamQuestionImage,
    createExam,
    createExamQuestion,
    createExamQuestionOption,
    createExamQuestionImage,
    deleteExam,
    deleteExamQuestion,
    modifyExamQuestion,
    modifyExamQuestionOption,
} from "@/api/mock/create";
import { ImageBox } from "@/components/chat/imageBox"
import { TagBox } from "@/components/tag/tag";

export default function MockPage() {
    const { language, setLang } = useContext(LangContext);
    const { isOpen: isOpenDrawer, onOpen: onOpenDrawer, onOpenChange: onOpenDrawerChange } = useDisclosure();
    const { isOpen: isOpenModal, onOpen: onOpenModal, onOpenChange: onOpenModalChange } = useDisclosure();

    const [selectedClassIdList, setSelectedClassIdList] = useState<Set<number>>(new Set());
    const [classList, setClassList] = useState<IClassListModel[]>([]);

    const [currentExam, setCurrentExam] = useState<IExamsModel | null>(null);
    const [examLists, setExamLists] = useState<IExamsModel[]>([]);

    const [questionsList, setQuestionsList] = useState<IQuestionModel[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<IExamQuestionModel | null>(null)
    const [imageFelidList, setImageFelidList] = useState<IQuestionImageBase64Model[]>([])

    const [createExamName, setCreateExamName] = useState<string>("")
    const [createExamDuration, setCreateExamDuration] = useState<number>(0)
    const [createExamType, setCreateExamType] = useState<TExamType>("basic")

    const [questionTextFelid, setQuestionTextFelid] = useState<string>("");
    const [optionsFelid, setOptionsFelid] = useState<IOptionModel[]>([
        { option_id: 1, option_text: "", is_correct: false },
        { option_id: 2, option_text: "", is_correct: false },
        { option_id: 3, option_text: "", is_correct: false },
        { option_id: 4, option_text: "", is_correct: false },
    ]);

    const handleRemoveImage = async (image: IQuestionImageBase64Model) => {
        if (currentExam == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noExamSelectedError[language],
            });
            return;
        }
        if (currentQuestion == null) {
            addToast({
                title: LanguageTable.mock.crate.noQuestionSelectedError[language],
                color: "warning",
            });
            return null;
        }

        try {
            const imageList = await fetchExamQuestionImage(currentExam.exam_id, currentQuestion.question_id)
            console.log(imageList)
            setImageFelidList(imageList)
        }
        catch (error) {
            addToast({
                title: LanguageTable.mock.crate.imageRemoveFailed[language],
                color: "warning",
            })
        }
    }

    useEffect(() => {
        const handleGetExamList = async () => {
            try {
                const exam_data = await getExamTypeList("all");
                console.log(exam_data);
                setExamLists(exam_data);
            } catch (error) {
                console.error("Failed to fetch exam list:", error);
                addToast({
                    title: LanguageTable.mock.index.failToFetchExamList[language],
                    color: "warning"
                })
                setExamLists([]);
            }
        }

        handleGetExamList()
    }, [setExamLists, language]);

    const handleUpdateExamList = async () => {
        try {
            const exam_data = await getExamTypeList("all");
            console.log(exam_data);
            setExamLists(exam_data);
        } catch (error) {
            console.error("Failed to fetch exam list:", error);
            addToast({
                title: LanguageTable.mock.index.failToFetchExamList[language],
                color: "warning"
            })
            setExamLists([]);
        }
    }

    const handleUpdateExamQuestionList = async (examId: number) => {
        try {
            const questionList = await fetchExamQuestion(examId)
            console.log(questionList);
            setQuestionsList(questionList);
        }
        catch (error) {
            console.error(error)
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.fetchQuestionListFail[language],
            })
        }
    }

    const handleUpdateExamQuestionImage = async (examId: number, questionId: number) => {
        try {
            const questionImageList = await fetchExamQuestionImage(examId, questionId)
            console.log(questionImageList)
            setImageFelidList(questionImageList);
        }
        catch (error) {
            console.error(error)
            addToast({
                title: LanguageTable.mock.crate.failToFetchImageList[language],
                color: "danger",
            })
        }
    }

    const handleUpdateExamQuestionOption = async (examId: number, questionId: number) => {
        try {
            const questionOptionList = await fetchExamQuestionOption(examId, questionId)
            console.log(questionOptionList)
            setOptionsFelid(questionOptionList)
        }
        catch (error) {
            console.error(error)
            addToast({
                title: LanguageTable.mock.crate.failToFetchOptionList[language],
                color: "danger",
            })
        }
    }

    const handleGetClassList = async () => {
        try {
            const classList = await fetchClassList();
            console.log(classList);
            setClassList(classList);
        } catch (error) {
            console.error("Failed to fetch class list:", error);
            addToast({
                title: LanguageTable.mock.crate.failToFetchClassList[language],
                color: "warning"
            })
            setClassList([]);
        }
    }

    const handleCreateExam = async () => {
        if (createExamName == "") {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.titleNoNullError[language],
            });
            return;
        }
        if (createExamDuration <= 0) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.durationSubZeroError[language],
            });
            return;
        }
        if (selectedClassIdList.size <= 0) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noClassSelected[language],
            });
            return;
        }
        try {
            for (const examId of selectedClassIdList) {
                await createExam(
                    examId,
                    createExamName,
                    createExamType,
                    new Date().toISOString(),
                    createExamDuration,
                )
            }
            handleUpdateExamList()
        }
        catch (error) {
            console.error(error)
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.examCreateFailed[language],
            })
        }
    }

    const handleCreateExamQuestion = async () => {
        if (currentExam == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noExamSelectedError[language],
            });
            return;
        }
        try {
            const question_text = LanguageTable.mock.crate.newTempQuestion[language]

            const questionId = await createExamQuestion(
                currentExam.exam_id,
                question_text,
            )
            console.log(questionId)
            if (questionId === null) {
                console.error("Question create fail")
                return
            };

            const optionsList: IOptionModel[] = []
            for (let i = 0; i < 4; i++) {
                const optionId = await createExamQuestionOption(
                    currentExam.exam_id,
                    questionId,
                    LanguageTable.mock.crate.newTempQuestionOption[language],
                    false
                )
                console.log(optionId)
                if (optionId === null) {
                    console.error("option create fail")
                    return
                };

                optionsList.push({
                    option_id: optionId,
                    option_text: "",
                    is_correct: false
                })
            }
            setCurrentQuestion({
                question_id: questionId,
                question_text: question_text,
                question_options: optionsList,
                question_images: null
            })
            handleUpdateExamQuestionList(currentExam.exam_id)
        }
        catch (error) {
            console.error(error)
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.examCreateFailed[language],
            })
        }
    }

    const handleCreateExamQuestionImage = async (imageBase64: string): Promise<string | null> => {
        if (currentExam == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noExamSelectedError[language],
            });
            return null;
        }
        if (currentQuestion == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noQuestionSelectedError[language],
            });
            return null;
        }
        try {
            const imageUUID = await createExamQuestionImage(currentExam.exam_id, currentQuestion.question_id, imageBase64);
            console.log(imageUUID)
            return imageUUID
        }
        catch (error) {
            console.error(error)
            return ""
        }
    }

    const handleDeleteExam = async () => {
        if (!currentExam) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noExamSelectedError[language],
            });
            return;
        }
        const success = await deleteExam(currentExam.exam_id);

        if (success) {
            addToast({
                color: "success",
                title: LanguageTable.mock.crate.examDeleteSuccess[language]
            });

            handleUpdateExamList()
            setCurrentExam(null)
        } else {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.examDeleteFailed[language]
            });
        }
    };

    const handleDeleteQuestion = async () => {
        if (!currentExam) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noExamSelectedError[language],
            });
            return;
        }
        if (!currentQuestion) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noQuestionSelectedError[language],
            });
            return;
        }

        const success = await deleteExamQuestion(currentExam.exam_id, currentQuestion.question_id);
        console.log(`API call success status: ${success}`);

        if (success) {
            addToast({
                color: "success",
                title: LanguageTable.mock.crate.questionDeleteSuccess[language]
            });
            handleUpdateExamQuestionList(currentExam.exam_id)
        } else {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.questionDeleteFailed[language]
            });
        }
    };

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (currentQuestion == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noQuestionSelectedError[language],
            });
            return
        }
        const { files } = event.target;
        if (!files || files.length === 0) { return; }
        if (imageFelidList.length >= 5) {
            console.warn("Image limit reached (max 5 images).");
            addToast({
                title: LanguageTable.mock.crate.maximumImageLimitError[language],
                color: "warning",
            })
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(files[0]);
        reader.onload = async () => {
            if (reader.result) {
                let base64ImageString = reader.result as string;
                base64ImageString = base64ImageString.split(",")[1];
                console.log(base64ImageString)
                const imageUUID = await handleCreateExamQuestionImage(base64ImageString);
                if (!imageUUID) return;

                const displayImage: IQuestionImageBase64Model = {
                    question_id: currentQuestion.question_id,
                    image_uuid: imageUUID,
                    image_data_base64: base64ImageString
                }
                setImageFelidList(imageList => [...imageList, displayImage]);
            }
            else {
                console.error("File reader failed");
            }
        };
    };

    const handleOptionChange = async (index: number, field: keyof IOptionModel, value: string | boolean) => {
        const newOptions = [...optionsFelid];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setOptionsFelid(newOptions);
        if (currentQuestion == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noQuestionSelectedError[language],
            });
            return null;
        }
    }

    const handleSaveQuestion = async () => {
        if (currentExam == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noExamSelectedError[language],
            });
            return
        }
        if (currentQuestion == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noQuestionSelectedError[language],
            });
            return null;
        }
        if (questionTextFelid.trim() === "") {
            addToast({
                color: "danger",
                title: LanguageTable.mock.crate.missingEnterQuestionText[language],
            });
            return;
        }
        if (optionsFelid.length === 0) {
            addToast({
                color: "danger",
                title: LanguageTable.mock.crate.missingOptionText[language] || "Question must have at least one option!",
            });
            return;
        }
        let haveCorrectAnswer = 0;
        for (const option of optionsFelid) {
            if (option.option_text.trim() === "") {
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
        } else if (haveCorrectAnswer > 1) {
            addToast({
                color: "danger",
                title: LanguageTable.mock.crate.tooManyCorrectAnswer[language],

            });
            return;
        }

        try {
            const successModifyExamQuestion = await modifyExamQuestion(
                currentExam.exam_id,
                currentQuestion.question_id,
                questionTextFelid
            )
            if (successModifyExamQuestion) {
                handleUpdateExamQuestionList(currentExam.exam_id)
            }

            let allSuccessModifyExamQuestionOption = true
            for (const option of optionsFelid) {
                const successModifyExamQuestionOption = await modifyExamQuestionOption(
                    currentExam.exam_id,
                    currentQuestion.question_id,
                    option.option_id,
                    option.option_text,
                    option.is_correct
                )
                if (!successModifyExamQuestionOption) { allSuccessModifyExamQuestionOption = false; }
            }
            if (allSuccessModifyExamQuestionOption) {
                handleUpdateExamQuestionOption(currentExam.exam_id, currentQuestion.question_id)
            }
            addToast({
                title: LanguageTable.mock.crate.questionCreateSuccess[language],
                color: "success"
            })
        }
        catch (error) {
            console.error(error);
        }

        return
    };

    const handleSelectedQuestion = async (selectedQuestion: IQuestionModel) => {
        if (currentExam == null) {
            addToast({
                color: "warning",
                title: LanguageTable.mock.crate.noExamSelectedError[language],
            });
            return;
        }

        console.log(currentExam)
        console.log(currentQuestion)
        setQuestionTextFelid(selectedQuestion.question_text)
        handleUpdateExamQuestionImage(currentExam.exam_id, selectedQuestion.question_id)
        handleUpdateExamQuestionOption(currentExam.exam_id, selectedQuestion.question_id)

        setCurrentQuestion({
            question_id: selectedQuestion.question_id,
            question_text: selectedQuestion.question_text,
            question_options: optionsFelid,
            question_images: imageFelidList
        })
    };

    return (
        <DefaultLayout>
            <Drawer isOpen={isOpenDrawer} placement="left" onOpenChange={onOpenDrawerChange}>
                <DrawerContent>
                    {(onClose: () => void) => (
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
                                                setCurrentExam(exam);
                                                onClose()
                                                handleUpdateExamQuestionList(exam.exam_id)
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
                                    onValueChange={(value: string) => {
                                        setCreateExamName(value)
                                    }}
                                    validate={(value: string) => {
                                        if (value == "") {
                                            return LanguageTable.mock.crate.titleNoNullError[language]
                                        }
                                    }}
                                />
                                <span>{LanguageTable.mock.crate.examDuration[language]}</span>
                                <NumberInput
                                    aria-label="exam duration"
                                    onValueChange={setCreateExamDuration}
                                    validate={(value: number) => {
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
                                <Listbox
                                    topContent={LanguageTable.mock.crate.classSelection[language]}
                                    disallowEmptySelection
                                    aria-label="class list"
                                    selectionMode="multiple"
                                    onSelectionChange={(keys: Set<number>) => setSelectedClassIdList(keys)}
                                    items={classList}
                                >
                                    {(class_: IClassListModel) => (
                                        <ListboxItem
                                            key={class_.class_id}
                                        >
                                            {class_.classname}
                                        </ListboxItem>
                                    )}
                                </Listbox>
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
                                                    handleUpdateExamQuestionList(currentExam.exam_id)
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
                                    handleGetClassList()
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
                                        handleDeleteExam()
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
                                    handleCreateExamQuestion()
                                }}
                                description={LanguageTable.mock.crate.newQuestion[language]}
                                textValue="1"
                            />
                            <ListboxItem
                                className="text-danger"
                                color="danger"
                                onPress={() => {
                                    if (currentQuestion) {

                                        handleDeleteQuestion()
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
                    <TagBox questionId={currentQuestion?.question_id} />
                </div>
                <div className="w-full">
                    <div className="max-w mx-auto p-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex flex-col">
                                <h2 className="text-xl mb-1">
                                    {LanguageTable.mock.crate.questionContent[language]}
                                </h2>
                                <Textarea
                                    rows={4}
                                    placeholder={LanguageTable.mock.crate.enterQuestionText[language]}
                                    value={questionTextFelid}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestionTextFelid(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col">
                                <h2 className="text-xl mb-1">
                                    {LanguageTable.mock.crate.questionImages[language]}
                                </h2>
                                <div className="gap-1">
                                    {imageFelidList.map((image, index) => (
                                        <ImageBox
                                            key={index}
                                            base64Image={image.image_data_base64}
                                            onClose={() => handleRemoveImage(image)}
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
                                        <div key={option.option_id} className="flex items-center space-x-4">
                                            <Textarea
                                                type="text"
                                                placeholder={`${LanguageTable.mock.crate.optionText[language]} ${index + 1}`}
                                                className="flex-2 rounded-md shadow-sm focus:outline-none"
                                                value={option.option_text}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleOptionChange(index, "option_text", e.target.value)}
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
                        <div className="mt-6">
                            <Button
                                isDisabled={currentQuestion ? false : true}
                                className="w-full px-4 py-2 rounded-md focus:outline-none"
                                onPress={() => {
                                    if (currentQuestion && currentExam) {
                                        handleSaveQuestion()
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
    )
}