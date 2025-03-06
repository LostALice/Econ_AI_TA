// Code by AkinoAlice@TyrantRey

type TExamType = "basic" | "cse"

interface IExamsInfo {
    exam_id: number;
    exam_name: string;
    exam_type: TExamType
    exam_date: string;
    exam_duration: number;  // in minutes 
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
