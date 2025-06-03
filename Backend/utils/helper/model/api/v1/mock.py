# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel
from datetime import datetime
from typing import List, Literal

ExamType = Literal["basic", "cse"]
MOCK_TYPE = Literal["basic", "cse", "all"]


class ExamOptionModel(BaseModel):
    option_id: int
    question_id: int
    option_text: str
    is_correct: bool


class ExamQuestionModel(BaseModel):
    exam_id: int
    question_id: int
    question_text: str
    question_options: List[ExamOptionModel] | None
    # None or a list of image base64
    question_images: List[str] | None


class ExamsInfoModel(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: ExamType
    exam_date: str
    # Duration in minutes
    exam_duration: int
    exam_questions: List[ExamQuestionModel] | None


class ExamParamsModel(BaseModel):
    class_id: int
    exam_name: str
    exam_type: ExamType
    exam_date: datetime
    exam_duration: int


class OptionParamsModel(BaseModel):
    option_text: str
    is_correct: bool


class ImageParamsModel(BaseModel):
    base64_image: str


class CreateNewExamParamsModel(BaseModel):
    class_id: int
    exam_name: str
    exam_type: ExamType
    exam_date: datetime
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
    user_id: int | None
    submitted_questions: list[SubmittedQuestionModel]


class ExamQuestionResultModel(BaseModel):
    question_id: int
    submitted_answer: str
    correct_answer: str
    is_correct: bool


class ExamResultModel(BaseModel):
    exam_id: int
    submission_id: int
    user_id: int | None = 0
    exam_name: str
    exam_type: ExamType
    exam_date: str
    total_correct_answers: int
    score_percentage: float


class TagModel(BaseModel):
    tag_id: int
    name: str
    description: str


class ExamsModel(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: ExamType
    exam_date: datetime
    # Duration in minutes
    exam_duration: int


class QuestionModel(BaseModel):
    question_id: int
    question_text: str


class QuestionImageModel(BaseModel):
    question_id: int
    image_uuid: str


class QuestionImageBase64Model(QuestionImageModel):
    image_data_base64: str


class OptionModel(BaseModel):
    option_id: int
    option_text: str
    is_correct: bool


class MockAnswerModel(BaseModel):
    question_id: int
    selected_option_id: int | None


class ExamSubmissionModel(BaseModel):
    exam_id: int
    submission_date: str
    answer: list[MockAnswerModel]
