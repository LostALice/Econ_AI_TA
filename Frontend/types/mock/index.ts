// Code by AkinoAlice@TyrantRey

import { IExamOption } from "@/types/mock/create";

export type IExamOptionForStudent = Omit<IExamOption, "is_correct">;
