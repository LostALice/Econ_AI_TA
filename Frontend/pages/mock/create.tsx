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
    ListboxSection,
    useDisclosure,
    Textarea,
    Input,
    Tooltip,
    Checkbox
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
                    question_text: "1 + asd = ?",
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
                    question_text: "1 nigga+ 2 = ?",
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
    const [examInfo, setExamInfo] = useState<IExamsInfo>();
    const [displayExamQuestionList, setDisplayExamQuestionList] = useState<IExamQuestion[] | []>([]);

    const handleExamChange = (exam_id: number): IExamQuestion[] => {
        const examQuestionList = fetchCourse().filter(
            (exam) => exam.exam_id === exam_id
        )
        setExamInfo(examQuestionList[0])
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
                        {LanguageTable.mock.crate.currentExam[language]} {examInfo?.exam_name || LanguageTable.mock.crate.selected[language]}
                    </div>
                    {/* <ButtonGroup className="flex items-center justify-center">
                        <Button>
                            {LanguageTable.mock.crate.new[language]}
                        </Button>
                        <Button color="danger">
                            {LanguageTable.mock.crate.delete[language]}
                        </Button>
                    </ButtonGroup> */}
                </div>
                <div className="flex justify-normal">
                    <div className="w-1/4 h-full">
                        <Listbox aria-label="Actions">
                            <ListboxSection title={LanguageTable.mock.crate.question[language]}>
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
                            </ListboxSection>
                            <ListboxSection title={LanguageTable.mock.crate.newOrDelete[language]}>
                                <ListboxItem
                                    color="danger"
                                >
                                    {LanguageTable.mock.crate.new[language]}
                                </ListboxItem>
                                <ListboxItem
                                    className="text-danger"
                                    color="primary"
                                >
                                    {LanguageTable.mock.crate.delete[language]}
                                </ListboxItem>
                            </ListboxSection>
                        </Listbox>
                    </div>
                    <div
                        className="w-full"
                    >
                        <div className="max-w mx-auto p-6">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Question Text */}
                                <div className="flex flex-col">
                                    <h2 className="text-xl mb-1">
                                        Question Text
                                    </h2>
                                    <Textarea
                                        rows={4}
                                        placeholder="Enter question text..."
                                    >
                                    </Textarea>
                                </div>

                                {/* Question Images */}
                                <div className="flex flex-col">
                                    <h2 className="text-xl mb-1">
                                        Question Images (comma-separated URLs)
                                    </h2>
                                    <Input
                                        type="text"
                                        placeholder="http://example.com/image1.jpg, http://example.com/image2.jpg"
                                        className="rounded-md shadow-sm focus:outline-none"
                                    />
                                </div>

                                {/* Options */}
                                <div>
                                    <h2 className="text-xl mb-3">Options</h2>
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4].map((option) => (
                                            <div key={option} className="flex items-center space-x-4 -py-3">
                                                <Textarea
                                                    type="text"
                                                    placeholder={`Option 1 text`}
                                                    className="flex-2 rounded-md shadow-sm focus:outline-none"
                                                />
                                                <Checkbox value="1" />
                                            </div>
                                        )
                                        )

                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="mt-6">
                                <Button className="w-full px-4 py-2 rounded-md focus:outline-none">
                                    Save Question
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DefaultLayout>
        </>
    )
}