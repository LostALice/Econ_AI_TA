// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default"
import { Card, CardBody, CardFooter, CardHeader, Select, SelectItem, Button } from "@heroui/react"

export default function PerformancePage() {
    const examList = [
        {
            examId: 1,
            examName: "1examName"
        },
        {
            examId: 2,
            examName: "examName"
        },
        {
            examId: 3,
            examName: "examName"
        },
        {
            examId: 4,
            examName: "examName"
        },
        {
            examId: 5,
            examName: "examName"
        },
    ]

    const getBy = [
        {
            id: 1,
            categories: "Student"
        },
        {
            id: 2,
            categories: "Class"
        },
    ]

    return (
        <DefaultLayout>
            <Card className="h-[90vh] w-full flex flex-col shadow-md rounded-lg border my-3">
                <CardHeader className="flex justify-center gap-3">
                    <Select
                        className="max-w-xs"
                        items={examList}
                        label="Exam List"
                        placeholder="Exam List"
                    >
                        {(exam) => <SelectItem key={exam.examId}>{exam.examName}</SelectItem>}
                    </Select>
                    <Select
                        className="max-w-xs"
                        items={getBy}
                        label="Get By"
                        placeholder="Get By"
                    >
                        {(byCart) => <SelectItem key={byCart.id}>{byCart.categories}</SelectItem>}
                    </Select>
                    <Select
                        className="max-w-xs"
                        items={examList}
                        label="Exam List"
                        placeholder="Exam List"
                    >
                        {(exam) => <SelectItem key={exam.examId}>{exam.examName}</SelectItem>}
                    </Select>
                </CardHeader>
                <CardFooter>
                    <Button>submit</Button>
                </CardFooter>
            </Card>
        </DefaultLayout>
    )
}