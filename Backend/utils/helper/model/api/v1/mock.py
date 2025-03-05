# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel

from typing import List, Optional, Literal

ExamType = Literal["basic", "cse"]


class ExamOption(BaseModel):
    option_id: int
    option_text: str
    is_correct: bool


class ExamQuestion(BaseModel):
    exam_id: int
    question_id: int
    question_text: str
    question_options: List[ExamOption]
    # None or a list of image URLs
    question_images: Optional[List[str]]


class ExamsInfo(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: ExamType
    exam_date: str
    # Duration in minutes
    exam_duration: int
    exam_questions: List[ExamQuestion]
