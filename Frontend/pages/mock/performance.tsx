// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default"
import { siteConfig } from "@/config/site";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Spinner,
    Link
} from "@heroui/react"
import { useEffect, useState, useContext, useMemo } from "react"

import {
    IExamsModel,
    IClassListModel,
    IMockResult
} from "@/types/mock/create";

import { IUserModel } from "@/types/management/index"

import { fetchClassUserList } from "@/api/management/index"
import { fetchClassList, fetchExamLists } from "@/api/mock/create"
import {
    fetchMockResultByClass,
    fetchMockResultByExam,
    fetchMockResultByUser,
} from "@/api/mock/performance"
import { LanguageTable } from "@/i18n";
import { LangContext } from "@/contexts/LangContext";

export default function PerformancePage() {
    const { language, setLang } = useContext(LangContext);
    const [isLoading, setIsLoading] = useState(false)

    const [examList, setExamList] = useState<IExamsModel[]>([])
    const [classList, setClassList] = useState<IClassListModel[]>([])
    const [studentList, setStudentList] = useState<IUserModel[]>([])

    const [currentMockType, setCurrentMockType] = useState<"class" | "exam" | "user">()
    const [currentId, setCurrentId] = useState<number>()
    const [downloadURL, setDownloadURL] = useState<string>("")

    const [displayTable, setDisplayTable] = useState<IMockResult[]>([])

    useEffect(() => {
        const setup = async () => {
            try {
                const exams: IExamsModel[] = (await Promise.all([fetchExamLists("basic"), fetchExamLists("cse")])).flat()
                console.log(exams)
                if (!exams) return
                setExamList(exams)

                const classes = await fetchClassList()
                console.log(classes)
                if (!classes) return
                setClassList(classes)

                const students: IUserModel[] = (await Promise.all(classes.map(c => fetchClassUserList(c.class_id)))).flat();
                console.log(students)
                if (!students) return
                setStudentList(students)
            }
            catch (error) {
                console.error(error)
                return
            }
        }
        setup()
    }, [setExamList, setClassList, setStudentList])

    const handleOnSelectClassId = async (class_id: number) => {
        setDisplayTable([])
        setIsLoading(true)
        try {
            const data = await fetchMockResultByClass(class_id)
            console.log(data)
            if (data.length > 0) {
                setCurrentMockType("class")
                setCurrentId(class_id)
                setDisplayTable(data)
            }
        }
        catch (error) {
            console.error(error)
        }
        handleDownloadExcel()
        setIsLoading(false)
    }
    const handleOnSelectExamId = async (exam_id: number) => {
        setDisplayTable([])
        setIsLoading(true)
        try {
            const data = await fetchMockResultByExam(exam_id)
            console.log(data)
            if (data.length > 0) {
                setCurrentMockType("exam")
                setCurrentId(exam_id)
                setDisplayTable(data)
            }
        }
        catch (error) {
            console.error(error)
        }
        handleDownloadExcel()
        setIsLoading(false)
    }
    const handleOnSelectUserId = async (user_id: number) => {
        setDisplayTable([])
        setIsLoading(true)
        try {
            const data = await fetchMockResultByUser(user_id)
            console.log(data)
            if (data.length > 0) {
                setCurrentMockType("user")
                setCurrentId(user_id)
                setDisplayTable(data)
            }
        }
        catch (error) {
            console.error(error)
        }
        handleDownloadExcel()
        setIsLoading(false)
    }

    const handleDownloadExcel = () => {
        setDownloadURL(`/result/${currentMockType}/${currentId}/excel/`)
    }

    return (
        <DefaultLayout>
            <Card className="h-[90vh] w-full flex flex-col shadow-md rounded-lg border my-3">
                <CardHeader className="flex justify-center gap-3">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button className="w-1/4" variant="bordered">{LanguageTable.mock.result.classList[language]}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Class List"
                            items={classList}
                            onAction={(key) => handleOnSelectClassId(Number(key))}
                        >
                            {(class_) => (
                                <DropdownItem key={class_.class_id}>{class_.classname}</DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button className="w-1/4" variant="bordered">{LanguageTable.mock.result.examList[language]}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Class List"
                            items={examList}
                            onAction={(key) => handleOnSelectExamId(Number(key))}
                        >
                            {(class_) => (
                                <DropdownItem key={class_.exam_id}>{class_.exam_name}</DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button className="w-1/4" variant="bordered">{LanguageTable.mock.result.studentList[language]}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Class List"
                            items={studentList}
                            onAction={(key) => handleOnSelectUserId(Number(key))}
                        >
                            {(class_) => (
                                <DropdownItem key={class_.user_id}>{class_.username}</DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                </CardHeader>
                <CardBody>
                    <Table
                        aria-label="Mock Result"
                        isStriped
                        selectionMode="none"
                    >
                        <TableHeader>
                            <TableColumn>{LanguageTable.mock.result.submissionId[language]}</TableColumn>
                            <TableColumn>{LanguageTable.mock.result.class[language]}</TableColumn>
                            <TableColumn>{LanguageTable.mock.result.user[language]}</TableColumn>
                            <TableColumn>{LanguageTable.mock.result.examName[language]}</TableColumn>
                            <TableColumn>{LanguageTable.mock.result.examType[language]}</TableColumn>
                            <TableColumn>{LanguageTable.mock.result.examDate[language]}</TableColumn>
                            <TableColumn>{LanguageTable.mock.result.submissionTime[language]}</TableColumn>
                            <TableColumn>{LanguageTable.mock.result.totalQuestion[language]}</TableColumn>
                            <TableColumn>{LanguageTable.mock.result.score[language]}</TableColumn>
                        </TableHeader>
                        <TableBody
                            isLoading={isLoading}
                            loadingContent={<Spinner color="success" label={LanguageTable.docs.page.loading[language]} />}
                            emptyContent="No item selected"
                        >
                            {displayTable.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.submission_id}</TableCell>
                                    <TableCell>{item.classname}</TableCell>
                                    <TableCell>{item.username}</TableCell>
                                    <TableCell>{item.exam_name}</TableCell>
                                    <TableCell>{item.exam_type}</TableCell>
                                    <TableCell>{item.exam_date}</TableCell>
                                    <TableCell>{item.submission_time}</TableCell>
                                    <TableCell>{item.total_question}</TableCell>
                                    <TableCell>{item.score}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
                <CardFooter className="flex justify-end">
                    <Button
                        as={Link}
                        href={siteConfig.api_url + downloadURL}
                    >
                        Download Excel
                    </Button>
                </CardFooter>
            </Card>
        </DefaultLayout >
    )
}