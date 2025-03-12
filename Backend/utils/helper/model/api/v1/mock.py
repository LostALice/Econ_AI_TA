# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel

from typing import List, Optional, Literal

ExamType = Literal["basic", "cse"]


class ExamOptionModel(BaseModel):
    option_id: int
    question_id: int
    option_text: str
    is_correct: bool


class ExamQuestionModel(BaseModel):
    exam_id: int
    question_id: int
    question_text: str
    question_options: Optional[List[ExamOptionModel]]
    # None or a list of image base64
    question_images: Optional[List[str]]


class ExamsInfoModel(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: ExamType
    exam_date: str
    # Duration in minutes
    exam_duration: int
    exam_questions: Optional[List[ExamQuestionModel]]


class CreateNewExamParamsModel(BaseModel):
    exam_name: str
    exam_type: ExamType
    exam_date: str
    exam_duration: int


class CreateNewOptionParamsModel(BaseModel):
    question_id: int
    option_text: str
    is_correct: bool


class CreateNewQuestionParamsModel(BaseModel):
    exam_id: int
    question_text: str


class SubmittedQuestionModel(BaseModel):
    question_id: int
    submitted_answer: str
    correct_answer: str


class SubmittedExamModel(BaseModel):
    exam_id: int
    submitted_questions: list[SubmittedQuestionModel]
