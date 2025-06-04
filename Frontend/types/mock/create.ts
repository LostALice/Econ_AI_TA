// Code by AkinoAlice@TyrantRey

export type TExamType = "basic" | "cse";

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

export interface IClassListModel {
  class_id: number
  classname: string
}

export interface IExamsModel {
  exam_id: number
  exam_name: string
  exam_type: TExamType
  exam_date: string
  exam_duration: number
}

export interface IQuestionModel {
  question_id: number
  question_text: string
}

export interface IExamQuestionModel extends IQuestionModel {
  question_options: IOptionModel[];
  question_images: IQuestionImageBase64Model[] | null;
}

export interface IQuestionImageModel {
  question_id: number
  image_uuid: string
}

export interface IQuestionImageBase64Model extends IQuestionImageModel {
  image_data_base64: string
}

export interface IOptionModel {
  option_id: number
  option_text: string
  is_correct: boolean
}

export interface ICreateExamPrams {
  class_id: number,
  exam_name: string,
  exam_type: TExamType,
  exam_date: string,
}

export interface IStudentAnswer {
  question_id: number
  selected_option_id: number | null
}

export interface IExamSubmissionModel {
  exam_id: number
  submission_date: string
  answer: IStudentAnswer[]
}

export interface IMockResult {
  submission_id: number
  exam_id: number
  user_id: number
  exam_name: string
  exam_type: TExamType
  exam_date: string
  score: number
  total_question: number
}