// Code by AkinoAlice@TyrantRey

import { LangContext } from "@/contexts/LangContext";
import DefaultLayout from "@/layouts/default";
import { useContext, useState, useMemo } from "react";
import { LanguageTable } from "@/i18n";

import {
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Listbox,
    ListboxItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    useDisclosure,
    ButtonGroup
} from "@heroui/react";

function fetchCourse(): IExamsInfo[] {
    // demo fetch
    return [
        {
            exam_id: 1,
            exam_name: "asd",
            exam_type: "basic",
            exam_date: "2025-1-1",
            exam_duration: 90,
            exam_questions: [
                {
                    exam_id: 1,
                    question_id: 1,
                    question_text: "what is fcu",
                    question_images: null,
                    question_options: [
                        {
                            option_id: 1,
                            option_text: "2",
                            is_correct: true
                        },
                        {
                            option_id: 2,
                            option_text: "3",
                            is_correct: false
                        },
                        {
                            option_id: 3,
                            option_text: "4",
                            is_correct: false
                        },
                        {
                            option_id: 4,
                            option_text: "5",
                            is_correct: false
                        }
                    ]
                },
                {
                    exam_id: 1,
                    question_id: 2,
                    question_text: "what is econ",
                    question_images: null,
                    question_options: [
                        {
                            option_id: 1,
                            option_text: "2",
                            is_correct: true
                        },
                        {
                            option_id: 2,
                            option_text: "3",
                            is_correct: false
                        },
                        {
                            option_id: 3,
                            option_text: "4",
                            is_correct: false
                        },
                        {
                            option_id: 4,
                            option_text: "5",
                            is_correct: false
                        }
                    ]
                },
            ]
        },
        {
            exam_id: 2,
            exam_name: "dsa",
            exam_type: "cse",
            exam_date: "2025-1-2",
            exam_duration: 90,
            exam_questions: [
                {
                    exam_id: 2,
                    question_id: 1,
                    question_text: "1 + 2 = ?",
                    question_images: null,
                    question_options: [
                        {
                            option_id: 1,
                            option_text: "2",
                            is_correct: false
                        },
                        {
                            option_id: 2,
                            option_text: "3",
                            is_correct: true
                        },
                        {
                            option_id: 3,
                            option_text: "4",
                            is_correct: false
                        },
                        {
                            option_id: 4,
                            option_text: "5",
                            is_correct: false
                        }
                    ]
                }
            ],
        },
        {
            exam_id: 3,
            exam_name: "dsa",
            exam_type: "cse",
            exam_date: "2025-1-2",
            exam_duration: 90,
            exam_questions: [
                {
                    exam_id: 2,
                    question_id: 1,
                    question_text: "1 + 2asd = ?",
                    question_images: null,
                    question_options: [
                        {
                            option_id: 1,
                            option_text: "2",
                            is_correct: false
                        },
                        {
                            option_id: 2,
                            option_text: "3",
                            is_correct: true
                        },
                        {
                            option_id: 3,
                            option_text: "4",
                            is_correct: false
                        },
                        {
                            option_id: 4,
                            option_text: "5",
                            is_correct: false
                        }
                    ]
                }
            ],
        },
        {
            exam_id: 4,
            exam_name: "dsa",
            exam_type: "cse",
            exam_date: "2025-1-2",
            exam_duration: 90,
            exam_questions: [
                {
                    exam_id: 2,
                    question_id: 1,
                    question_text: "1 + asffasf2 = ?",
                    question_images: null,
                    question_options: [
                        {
                            option_id: 1,
                            option_text: "2",
                            is_correct: false
                        },
                        {
                            option_id: 2,
                            option_text: "3",
                            is_correct: true
                        },
                        {
                            option_id: 3,
                            option_text: "4",
                            is_correct: false
                        },
                        {
                            option_id: 4,
                            option_text: "5",
                            is_correct: false
                        }
                    ]
                }
            ],
        },
        {
            exam_id: 5,
            exam_name: "dsa",
            exam_type: "cse",
            exam_date: "2025-1-2",
            exam_duration: 90,
            exam_questions: [
                {
                    exam_id: 2,
                    question_id: 1,
                    question_text: "1 asdads+ 2 = ?",
                    question_images: null,
                    question_options: [
                        {
                            option_id: 1,
                            option_text: "2",
                            is_correct: false
                        },
                        {
                            option_id: 2,
                            option_text: "3",
                            is_correct: true
                        },
                        {
                            option_id: 3,
                            option_text: "4",
                            is_correct: false
                        },
                        {
                            option_id: 4,
                            option_text: "5",
                            is_correct: false
                        }
                    ]
                }
            ],
        },
    ]
}


export default function MockPage() {
    const { language, setLang } = useContext(LangContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [examId, setExamId] = useState<number>(0);
    const [displayExamQuestionList, setDisplayExamQuestionList] = useState<IExamQuestion[] | []>([]);

    const handleExamChange = (exam_id: number): IExamQuestion[] => {
        const examQuestionList = fetchCourse().filter(
            (exam) => exam.exam_id === exam_id
        )

        return examQuestionList[0].exam_questions
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
                                        fetchCourse().map((exam) => (
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
                        <Dropdown>
                            <DropdownTrigger>
                                <Button className="capitalize">
                                    {LanguageTable.mock.crate.question[language]}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Dropdown Variants">
                                {
                                    fetchCourse().map((question, index) => (
                                        <DropdownItem
                                            key={index}
                                            className="capitalize"
                                            color="primary"
                                        >
                                            {index + 1}: {question.exam_questions[0].question_text}
                                        </DropdownItem>
                                    ))
                                }
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                    <ButtonGroup className="flex items-center justify-center">
                        <Button>
                            {LanguageTable.mock.crate.new[language]}
                        </Button>
                        <Button color="danger">
                            {LanguageTable.mock.crate.delete[language]}
                        </Button>
                    </ButtonGroup>
                </div>
                <div className="w-1/4">
                    <Listbox aria-label="Actions">
                        {
                            displayExamQuestionList.length > 0 ?
                                (displayExamQuestionList.map((question, index) => {
                                    return (
                                        <ListboxItem key={index}
                                            textValue={index + 1 + " " + question.question_text}
                                        >
                                            {index + 1}. {question.question_text}
                                        </ListboxItem>
                                    )
                                })) : (
                                    <ListboxItem
                                        textValue={LanguageTable.mock.crate.noItem[language]}
                                    >
                                        {LanguageTable.mock.crate.noItem[language]}
                                    </ListboxItem>

                                )
                        }
                    </Listbox>
                </div>
            </DefaultLayout>
        </>
    )
}