// Code by AkinoAlice@TyrantRey

type TExamType = "basic" | "cse"

interface IExamsInfo {
    exam_id: number;
    exam_name: string;
    exam_type: TExamType
    exam_date: string;
    // in minutes
    exam_duration: number;
    exam_questions: IExamQuestion[];
}

interface IExamQuestion {
    exam_id: number;
    question_id: number;
    question_text: string;
    question_options: IExamOption[];
    question_images: null | string[];
}

// MC support only
interface IExamOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
}

interface IStudentAnswer {
    exam_id: string;
    question_id: string;
    student_answer: number;
}
