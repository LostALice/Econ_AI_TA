// Code by AkinoAlice@TyrantRey

export interface MockExamInformation {
  exam_id: number;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  exam_duration: number;
}

export interface MockExamQuestionList {
  exam_id: number;
  question_id: number;
  question_text: string;
  question_options: MockExamQuestionOptionsList[];
  question_images: string[];
}

export interface MockExamQuestionOptionsList {
  option_id: number;
  question_id: number;
  option_text: string;
}

export interface IStudentAnswer {
  question_id: number;
  answer: number;
}
