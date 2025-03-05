# Code by AkinoAlice@TyrantRey

from fastapi import APIRouter

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import MySQLHandler
from Backend.utils.helper.model.api.v1.mock import *
from typing import Union

# development
from dotenv import load_dotenv

load_dotenv("./.env")

router = APIRouter()
mysql_client = MySQLHandler()
logger = CustomLoggerHandler(__name__).setup_logging()


@router.get("/mock/exam-lists/", status_code=200)
async def get_mock_info() -> Union[list[ExamsInfo], ExamsInfo]:
    mock_data = [
        ExamsInfo(
            exam_id=1,
            exam_name="Sample Exam",
            exam_type="basic",
            exam_date="2025-03-04",
            exam_duration=90,
            exam_questions=[
                ExamQuestion(
                    exam_id=1,
                    question_id=101,
                    question_text="What is 2 + 2?iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC",
                    question_options=[
                        ExamOption(option_id=1, option_text="3", is_correct=False),
                        ExamOption(option_id=2, option_text="4", is_correct=True),
                        ExamOption(option_id=3, option_text="5", is_correct=False),
                        ExamOption(option_id=4, option_text="22", is_correct=False),
                    ],
                    question_images=[
                        "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAaUlEQVR4nOzPUQkAIQDA0OMwgs3sYn5D+PEQ9hJsY8/1vezXAbca0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0E4AAAD//3nTAWAf59aDAAAAAElFTkSuQmCC"
                    ],
                ),
                ExamQuestion(
                    exam_id=1,
                    question_id=102,
                    question_text="What is the capital of France?",
                    question_options=[
                        ExamOption(option_id=1, option_text="Paris", is_correct=True),
                        ExamOption(option_id=2, option_text="London", is_correct=False),
                        ExamOption(option_id=3, option_text="Rome", is_correct=False),
                        ExamOption(option_id=4, option_text="Berlin", is_correct=False),
                    ],
                    question_images=None,
                ),
                ExamQuestion(
                    exam_id=1,
                    question_id=103,
                    question_text="Which language is primarily used for iOS development?",
                    question_options=[
                        ExamOption(option_id=1, option_text="Swift", is_correct=True),
                        ExamOption(option_id=2, option_text="Kotlin", is_correct=False),
                        ExamOption(option_id=3, option_text="Java", is_correct=False),
                        ExamOption(option_id=4, option_text="Python", is_correct=False),
                    ],
                    question_images=None,
                ),
            ],
        ),
        ExamsInfo(
            exam_id=2,
            exam_name="Sample2 Exam",
            exam_type="basic",
            exam_date="2025-03-04",
            exam_duration=90,
            exam_questions=[
                ExamQuestion(
                    exam_id=1,
                    question_id=101,
                    question_text="What is 2 + 2?",
                    question_options=[
                        ExamOption(option_id=1, option_text="3", is_correct=False),
                        ExamOption(option_id=2, option_text="4", is_correct=True),
                        ExamOption(option_id=3, option_text="5", is_correct=False),
                        ExamOption(option_id=4, option_text="22", is_correct=False),
                    ],
                    question_images=[
                        "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAaUlEQVR4nOzPUQkAIQDA0OMwgs3sYn5D+PEQ9hJsY8/1vezXAbca0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0E4AAAD//3nTAWAf59aDAAAAAElFTkSuQmCC"
                    ],
                ),
                ExamQuestion(
                    exam_id=1,
                    question_id=102,
                    question_text="What is the capital of France?",
                    question_options=[
                        ExamOption(option_id=1, option_text="Paris", is_correct=True),
                        ExamOption(option_id=2, option_text="London", is_correct=False),
                        ExamOption(option_id=3, option_text="Rome", is_correct=False),
                        ExamOption(option_id=4, option_text="Berlin", is_correct=False),
                    ],
                    question_images=None,
                ),
                ExamQuestion(
                    exam_id=1,
                    question_id=103,
                    question_text="Which language is primarily used for iOS development?",
                    question_options=[
                        ExamOption(option_id=1, option_text="Swift", is_correct=True),
                        ExamOption(option_id=2, option_text="Kotlin", is_correct=False),
                        ExamOption(option_id=3, option_text="Java", is_correct=False),
                        ExamOption(option_id=4, option_text="Python", is_correct=False),
                    ],
                    question_images=None,
                ),
            ],
        ),
        ExamsInfo(
            exam_id=3,
            exam_name="Sample3 Exam",
            exam_type="basic",
            exam_date="2025-03-04",
            exam_duration=90,
            exam_questions=[
                ExamQuestion(
                    exam_id=1,
                    question_id=101,
                    question_text="What is 2 + 2?",
                    question_options=[
                        ExamOption(option_id=1, option_text="3", is_correct=False),
                        ExamOption(option_id=2, option_text="4", is_correct=True),
                        ExamOption(option_id=3, option_text="5", is_correct=False),
                        ExamOption(option_id=4, option_text="22", is_correct=False),
                    ],
                    question_images=[
                        "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAaUlEQVR4nOzPUQkAIQDA0OMwgs3sYn5D+PEQ9hJsY8/1vezXAbca0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0E4AAAD//3nTAWAf59aDAAAAAElFTkSuQmCC"
                    ],
                ),
                ExamQuestion(
                    exam_id=1,
                    question_id=102,
                    question_text="What is the capital of France?",
                    question_options=[
                        ExamOption(option_id=1, option_text="Paris", is_correct=True),
                        ExamOption(option_id=2, option_text="London", is_correct=False),
                        ExamOption(option_id=3, option_text="Rome", is_correct=False),
                        ExamOption(option_id=4, option_text="Berlin", is_correct=False),
                    ],
                    question_images=None,
                ),
                ExamQuestion(
                    exam_id=1,
                    question_id=103,
                    question_text="Which language is primarily used for iOS development?",
                    question_options=[
                        ExamOption(option_id=1, option_text="Swift", is_correct=True),
                        ExamOption(option_id=2, option_text="Kotlin", is_correct=False),
                        ExamOption(option_id=3, option_text="Java", is_correct=False),
                        ExamOption(option_id=4, option_text="Python", is_correct=False),
                    ],
                    question_images=None,
                ),
            ],
        ),
        ExamsInfo(
            exam_id=4,
            exam_name="Sample4 Exam",
            exam_type="basic",
            exam_date="2025-03-04",
            exam_duration=90,
            exam_questions=[
                ExamQuestion(
                    exam_id=1,
                    question_id=101,
                    question_text="What is 2 + 2?",
                    question_options=[
                        ExamOption(option_id=1, option_text="3", is_correct=False),
                        ExamOption(option_id=2, option_text="4", is_correct=True),
                        ExamOption(option_id=3, option_text="5", is_correct=False),
                        ExamOption(option_id=4, option_text="22", is_correct=False),
                    ],
                    question_images=[
                        "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAaUlEQVR4nOzPUQkAIQDA0OMwgs3sYn5D+PEQ9hJsY8/1vezXAbca0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0E4AAAD//3nTAWAf59aDAAAAAElFTkSuQmCC"
                    ],
                ),
                ExamQuestion(
                    exam_id=1,
                    question_id=102,
                    question_text="What is the capital of France?",
                    question_options=[
                        ExamOption(option_id=1, option_text="Paris", is_correct=True),
                        ExamOption(option_id=2, option_text="London", is_correct=False),
                        ExamOption(option_id=3, option_text="Rome", is_correct=False),
                        ExamOption(option_id=4, option_text="Berlin", is_correct=False),
                    ],
                    question_images=None,
                ),
                ExamQuestion(
                    exam_id=1,
                    question_id=103,
                    question_text="Which language is primarily used for iOS development?",
                    question_options=[
                        ExamOption(option_id=1, option_text="Swift", is_correct=True),
                        ExamOption(option_id=2, option_text="Kotlin", is_correct=False),
                        ExamOption(option_id=3, option_text="Java", is_correct=False),
                        ExamOption(option_id=4, option_text="Python", is_correct=False),
                    ],
                    question_images=None,
                ),
            ],
        ),
    ]
    return mock_data

@router.put("/mock/modify/")
async def modify(exam: ExamsInfo) -> None:
    ...