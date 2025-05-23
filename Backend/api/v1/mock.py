# Code by AkinoAlice@TyrantRey

from fastapi import APIRouter, Depends

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import mysql_client
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
    SubmittedExamModel,
    TagModel,
)
from Backend.utils.helper.api.dependency import (
    require_student,
    UserPayload,
    TAPayload,
)

# development
from dotenv import load_dotenv
from pprint import pformat
from uuid import uuid4
from typing import Union

import base64
import os

logger = CustomLoggerHandler().get_logger()
# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


router = APIRouter(dependencies=[Depends(require_student)])
# mysql_client = MySQLHandler()


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


@router.get("/exam-lists/", status_code=200)
async def get_mock_info(payload: TAPayload) -> list[ExamsInfoModel]:
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


@router.get("/exam/{mock_type}/", status_code=200)
async def get_mock_exams(mock_type: ExamType, payload: UserPayload):
    """
    Endpoint to get mock exam according to mock type

    Returns:
        Union[list[ExamsInfoModel], ExamsInfoModel]: List of mock exam lists or single mock exam list.
    """
    logger.debug("Get mock exam lists")

    mock_exam_data = mysql_client.query_mock_exam(mock_type)

    return [] if mock_exam_data is None else mock_exam_data


@router.post("/new/exam/")
async def create_new_exam(
    exam_prams: CreateNewExamParamsModel, payload: TAPayload
) -> ExamsInfoModel:
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


@router.post("/new/question/")
async def create_new_question(
    question: CreateNewQuestionParamsModel, payload: TAPayload
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


@router.post("/new/options/")
async def create_new_options(
    options: list[CreateNewOptionParamsModel], payload: TAPayload
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


@router.put("/modify/exam/")
async def modify_exam(exam: ExamsInfoModel, payload: TAPayload) -> None:
    """
    Endpoint to modify exam.

    Args:
        exam: Exam question information
    Return:
        None
    """
    logger.debug(exam)


@router.put("/modify/question/")
async def modify_question(question: ExamQuestionModel, payload: TAPayload) -> bool:
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


@router.delete("/enable/exam/")
async def enable_exam(exam_id: int, payload: TAPayload) -> bool:
    """
    Endpoint to delete exam.

    Args:
        question: question information
    Return:
        bool
    """

    logger.debug(exam_id)
    return mysql_client.disable_exam(exam_id)


@router.delete("/disable/exam/")
async def disable_exam(exam_id: int, payload: TAPayload) -> bool:
    """
    Endpoint to delete exam.

    Args:
        question: question information
    Return:
        bool
    """

    logger.debug(exam_id)
    return mysql_client.disable_exam(exam_id)


@router.delete("/delete/question/{question_id}")
async def delete_question(question_id: int, payload: TAPayload) -> bool:
    """
    Endpoint to delete question to an exam.

    Args:
        question: question information
    Return:
        bool
    """

    logger.debug(question_id)
    return mysql_client.disable_question(question_id=question_id)


@router.post("/submit/")
async def submit(submitted_exam: SubmittedExamModel) -> int | None:
    """
    Endpoint to submit exam.
    Args:
        class SubmittedExamModel(BaseModel):
            exam_id: int
            user_id: int | None
            submit_time: str
            submitted_questions: list[SubmittedQuestionModel]

        class SubmittedQuestionModel(BaseModel):
            question_id: int
            submitted_answer: str

    Returns:
        class ExamResultModel(BaseModel):
            exam_id: int
            user_id: int | None = 0
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


@router.get("/{mock_id}/")
async def fetch_mock_exam_questions_list(
    mock_id: int,
) -> tuple[list[MockExamQuestionsListModel], MockExamInformationModel | None]:
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


@router.get("/tag/list/")
async def get_tag_list() -> list[TagModel]:
    tag_list = mysql_client.query_tag_list()

    logger.info(tag_list)

    return tag_list


@router.get("/tag/{tag_id}")
async def get_tag(tag_id: int) -> TagModel | None:
    tag = mysql_client.query_tag(tag_id=tag_id)

    logger.info(tag)

    return tag


@router.post("/tag/create/")
async def create_tag(tag_name: str, tag_description: str) -> bool:
    return mysql_client.create_tag(tag_name=tag_name, tag_description=tag_description)


@router.post("/tag/add/{question_id}")
async def add_tag(tag_id: int, question_id: int) -> bool:
    return mysql_client.add_question_tag(question_id=question_id, tag_id=tag_id)


@router.delete("/tag/remove/{question_id}")
async def remove_tag(tag_id: int, question_id: int) -> bool:
    return mysql_client.remove_question_tag(question_id=question_id, tag_id=tag_id)


@router.delete("/tag/delete/")
async def delete_tag(tag_id: int) -> bool:
    return mysql_client.disable_tag(tag_id=tag_id)
