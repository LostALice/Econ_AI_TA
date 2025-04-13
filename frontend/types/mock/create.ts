// Code by AkinoAlice@TyrantRey

export type TExamType = "basic" | "cse";

export interface IExamsInfo {
  exam_id: number;
  exam_name: string;
  exam_type: TExamType;
  exam_date: string;
  exam_duration: number; // in minutes
  exam_questions: IExamQuestion[];
}

export interface IExamQuestion {
  exam_id: number;
  question_id: number;
  question_text: string;
  question_options: IExamOption[];
  question_images: null | string[];
}

// MC support only
export interface IExamOption {
  option_id: number;
  option_text: string;
  is_correct: boolean;
}

export interface ICreateNewExamPrams {
  exam_name: string;
  exam_type: TExamType;
  exam_date: string;
  exam_duration: number;
}

export interface ICreateNewQuestionPrams {
  exam_id: number;
  question_text: string;
  // question_options: ICreateNewQuestionOptionsPrams[]
}

export interface ICreateNewQuestionOptionsPrams {
  question_id: number;
  option_text: string;
  is_correct: boolean;
}

export interface IModifiedQuestionOptionsPrams {
  option_id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
}

export type IExamOptionForStudent = Omit<IExamOption, "is_correct">;

export interface IExamQuestionForStudent
  extends Omit<IExamQuestion, "question_options"> {
  question_options: IExamOptionForStudent[];
}

export interface IExamsInfoForStudent
  extends Omit<IExamsInfo, "exam_questions"> {
  exam_questions: IExamQuestionForStudent[];
}
