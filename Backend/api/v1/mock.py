# Code by AkinoAlice@TyrantRey

from fastapi import APIRouter

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import MySQLHandler
from Backend.utils.helper.model.api.v1.mock import (
    ExamType,
    ExamOptionModel,
    ExamQuestionModel,
    ExamsInfoModel,
    CreateNewExamParamsModel,
    CreateNewOptionParamsModel,
    CreateNewQuestionParamsModel,
    MockExamQuestionsListModel,
    MockExamInformationModel,
    ExamResultModel,
    SubmittedExamModel,
)

# development
from dotenv import load_dotenv
from pprint import pformat
from uuid import uuid4
from typing import Optional, Union

import base64
import os

# development
if os.getenv("DEBUG") is None:
    from dotenv import load_dotenv

    load_dotenv("./.env")


router = APIRouter()
mysql_client = MySQLHandler()
logger = CustomLoggerHandler(__name__).setup_logging()


def encode_image_to_base64(file_path: str) -> str:
    """
    Read the image at file_path and return its Base64 encoded string.
    Returns an empty string if the file is not found or an error occurs.
    """
    try:
        with open(file_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        logger.error(f"Error reading image file: {file_path}, error: {e}")
        return ""


def question_images_uuid_to_base64(
    question: Union[MockExamQuestionsListModel, ExamQuestionModel],
) -> list[str]:
    """
    Convert question_images uuids to base64 encoded strings.
    Args:
        question_images: List of question_images
    Returns:
        list[str]: List of base64 encoded question images.
    """

    question_image_uuids = []
    if question.question_images == [] or question.question_images is None:
        logger.info("Invalid question_images")
        return []

    for image_uuid in question.question_images:
        image_file_path = (
            f"./images/mock/{question.exam_id}/{question.question_id}/{image_uuid}.png"
        )
        question_image_uuids.append(encode_image_to_base64(image_file_path))

    return question_image_uuids


@router.get("/mock/exam-lists/", status_code=200)
async def get_mock_info() -> list[ExamsInfoModel]:
    """
    Endpoint to get mock exam lists

    Returns:
        Union[list[ExamsInfoModel], ExamsInfoModel]: List of mock exam lists or single mock exam list.
    """
    logger.debug("Get mock exam lists")

    mock_exam_data = mysql_client.query_mock_exam_list("all")

    logger.debug(pformat(mock_exam_data))
    if mock_exam_data == []:
        return []

    for mock_exam in mock_exam_data:
        if not mock_exam.exam_questions:
            continue
        for exam_question in mock_exam.exam_questions:
            if not exam_question.question_images:
                continue

            question_image_uuids = []
            for image_uuid in exam_question.question_images:
                image_file_path = f"./images/mock/{mock_exam.exam_id}/{exam_question.question_id}/{image_uuid}.png"
                question_image_uuids.append(encode_image_to_base64(image_file_path))

            exam_question.question_images = question_image_uuids

    return mock_exam_data


@router.get("/mock/exam/{mock_type}/", status_code=200)
async def get_mock_exams(mock_type: ExamType):
    """
    Endpoint to get mock exam according to mock type

    Returns:
        Union[list[ExamsInfoModel], ExamsInfoModel]: List of mock exam lists or single mock exam list.
    """
    logger.debug("Get mock exam lists")

    mock_exam_data = mysql_client.query_mock_exam(mock_type)

    return [] if mock_exam_data is None else mock_exam_data

@router.post("/mock/new/exam/")
async def create_new_exam(exam_prams: CreateNewExamParamsModel) -> ExamsInfoModel:
    """
    Endpoint to create new exam

    Args:
        question: Exam question information
    Return:
        bool: True if successful or False otherwise
    """

    logger.debug(exam_prams)
    new_exam = mysql_client.insert_new_mock_exam(exam_prams)
    logger.debug(new_exam)
    return new_exam


@router.post("/mock/new/question/")
async def create_new_question(
    question: CreateNewQuestionParamsModel,
) -> ExamQuestionModel:
    """
    Endpoint to add new question to an exam.

    Args:
        question: question information
    Return:
        bool: True if successful or False otherwise
    """

    logger.debug(question)
    new_question = mysql_client.insert_new_mock_question(question)
    logger.debug(new_question)
    return new_question


@router.post("/mock/new/options/")
async def create_new_options(
    options: list[CreateNewOptionParamsModel],
) -> list[ExamOptionModel]:
    """
    Endpoint to add new question options to an exam.

    Args:
        options: question options information
    Return:
        bool: True if successful or False otherwise
    """
    # logger.debug(options)
    # new_options: list[ExamOptionModel] = []
    # for option in options:
    new_options = mysql_client.insert_new_mock_options(options)

    logger.debug(new_options)
    return new_options


@router.put("/mock/modify/exam/")
async def modify_exam(exam: ExamsInfoModel) -> None:
    """
    Endpoint to modify exam.

    Args:
        exam: Exam question information
    Return:
        None
    """
    logger.debug(exam)


@router.put("/mock/modify/question/")
async def modify_question(question: ExamQuestionModel) -> bool:
    """
    Update an exam question along with its associated images.

    This asynchronous function processes an exam question by handling any provided base64-encoded images.
    For each image, it:
      - Decodes the base64 string.
      - Generates a unique UUID.
      - Constructs a file path based on the exam ID, question ID, and image UUID.
      - Asynchronously writes the image to disk.
    Finally, it updates the exam question record in the database by passing the list of generated image UUIDs.

    Args:
        question (ExamQuestionModel): An object containing the exam question details, including an optional
                                      list of base64-encoded image strings.

    Returns:
        bool
    """
    logger.debug(pformat(question))

    if not question.question_images:
        return mysql_client.modify_question(question=question, image_uuids=None)

    image_uuids = []
    for image in question.question_images:
        image_file_data = base64.b64decode(image)
        image_uuid = str(uuid4())
        image_path = (
            f"./images/mock/{question.exam_id}/{question.question_id}/{image_uuid}.png"
        )

        while os.path.exists(image_path):
            image_uuid = str(uuid4())
            image_path = f"./images/mock/{question.exam_id}/{question.question_id}/{image_uuid}.png"
            logger.warning(f"Image file already exists: {image_path}")

        logger.info(f"Saving image: {image_path}")
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        with open(image_path, "wb") as f:
            f.write(image_file_data)
        image_uuids.append(image_uuid)

    return mysql_client.modify_question(question=question, image_uuids=image_uuids)


@router.delete("/mock/delete/exam/")
async def delete_exam(exam_id: int) -> bool:
    """
    Endpoint to delete exam.

    Args:
        question: question information
    Return:
        bool
    """

    logger.debug(exam_id)
    return mysql_client.disable_exam(exam_id)


@router.delete("/mock/delete/question/{question_id}")
async def delete_question(question_id: int) -> bool:
    """
    Endpoint to delete question to an exam.

    Args:
        question: question information
    Return:
        bool
    """

    logger.debug(question_id)
    return mysql_client.disable_question(question_id=question_id)


@router.post("/mock/submit/")
async def submit(submitted_exam: SubmittedExamModel) -> Optional[int]:
    """
    Endpoint to submit exam.
    Args:
        class SubmittedExamModel(BaseModel):
            exam_id: int
            user_id: Optional[int]
            submit_time: str
            submitted_questions: list[SubmittedQuestionModel]

        class SubmittedQuestionModel(BaseModel):
            question_id: int
            submitted_answer: str

    Returns:
        class ExamResultModel(BaseModel):
            exam_id: int
            user_id: Optional[int] = 0
            exam_name: str
            exam_type: ExamType
            exam_date: str
            questions_result: list[ExamQuestionResultModel]

        class ExamQuestionResultModel(BaseModel):
            question_id: int
            submitted_answer: str
            correct_answer: str
            is_correct: bool
    """
    logger.debug(submitted_exam)
    submission_id = mysql_client.insert_mock_exam_submitted_question(submitted_exam)
    logger.debug(submission_id)
    
    return submission_id if submission_id else None


@router.get("/mock/results/{submission_id}")
async def query_mock_exam_results(submission_id: int) -> Optional[ExamResultModel]:
    """
    Query mock exam results based on submission ID.
    Args:
        submission_id: int
    Returns:
        ExamResultModel
    """
    logger.debug(submission_id)
    exam_results = mysql_client.query_mock_exam_results(submission_id)
    logger.debug(exam_results)
    
    return exam_results if exam_results else None


@router.get("/mock/{mock_id}/")
async def fetch_mock_exam_questions_list(
    mock_id: int,
) -> tuple[list[MockExamQuestionsListModel], Optional[MockExamInformationModel]]:
    """
    Fetch mock exam questions and their images.
    Args:
        mock_id: int
    Returns:
        tuple[list[MockExamQuestionsListModel], Optional[MockExamInformationModel]]

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
    """

    mock_exam_question_list, mock_exam_information = (
        mysql_client.get_mock_exam_question_list(mock_id)
    )

    for question in mock_exam_question_list:
        if not question.question_images:
            continue

        question_image_uuids = question_images_uuid_to_base64(question)
        question.question_images = question_image_uuids

    return mock_exam_question_list, mock_exam_information
