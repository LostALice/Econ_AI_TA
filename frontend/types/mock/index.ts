// Code by AkinoAlice@TyrantRey

import { IExamsInfo, IExamQuestion, IExamOption } from "@/types/mock/create";

export type IExamOptionForStudent = Omit<IExamOption, "is_correct">;

export interface IExamQuestionForStudent
  extends Omit<IExamQuestion, "question_options"> {
  question_options: IExamOptionForStudent[];
}

export interface IExamsInfoForStudent extends Omit<IExamsInfo, "exam_questions"> {
  exam_questions: IExamQuestionForStudent[];
}
