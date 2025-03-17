// Code by AkinoAlice@TyrantRey

export interface IMockExamInformation {
  exam_id: number;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  exam_duration: number;
}

export interface IMockExamQuestionList {
  exam_id: number;
  question_id: number;
  question_text: string;
  question_options: IMockExamQuestionOptionsList[];
  question_images: string[];
}

export interface IMockExamQuestionOptionsList {
  option_id: number;
  question_id: number;
  option_text: string;
}

export interface IStudentAnswer {
  question_id: number;
  answer_option_id: number;
}

export interface ISubmittedQuestion {
  question_id: number;
  submitted_answer_option_id: number;
}

export interface ISubmittedExam {
  exam_id: number;
  user_id: number | null;
  submitted_questions: ISubmittedQuestion[];
}

export interface IExamQuestionResult {
  question_id: number;
  submitted_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface IExamResult {
  exam_id: number;
  submission_id: number;
  user_id: number;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  total_correct_answers: number;
  score_percentage: number;
}
