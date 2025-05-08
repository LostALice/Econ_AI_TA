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


class MockExamQuestionsOptionListModel(BaseModel):
    option_id: int
    question_id: int
    option_text: str


class MockExamQuestionsListModel(BaseModel):
    exam_id: int
    question_id: int
    question_text: str
    question_options: list[MockExamQuestionsOptionListModel]
    question_images: list[str]


class MockExamInformationModel(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: ExamType
    exam_date: str
    exam_duration: int


class SubmittedQuestionModel(BaseModel):
    question_id: int
    submitted_answer_option_id: int


class SubmittedExamModel(BaseModel):
    exam_id: int
    user_id: Optional[int]
    submitted_questions: list[SubmittedQuestionModel]


class ExamQuestionResultModel(BaseModel):
    question_id: int
    submitted_answer: str
    correct_answer: str
    is_correct: bool


class ExamResultModel(BaseModel):
    exam_id: int
    submission_id: int
    user_id: Optional[int] = 0
    exam_name: str
    exam_type: ExamType
    exam_date: str
    total_correct_answers: int
    score_percentage: float


class TagModel(BaseModel):
    tag_id: int
    name: str
    description: str
