# Code by AkinoAlice@TyrantRey

from fastapi import APIRouter, Depends, HTTPException

from Backend.utils.helper.logger import CustomLoggerHandler


from Backend.utils.database.mock import MockerDatabaseController
from Backend.utils.helper.model.api.v1.mock import (
    ExamParamsModel,
    TagModel,
    MOCK_TYPE,
    ExamsModel,
    QuestionModel,
    OptionModel,
    QuestionImageBase64Model,
)
from Backend.utils.helper.api.dependency import (
    require_student,
    UserPayload,
)

from pathlib import Path
from dotenv import load_dotenv
from uuid import uuid4

import base64
import os

logger = CustomLoggerHandler().get_logger()

GLOBAL_DEBUG_MODE = os.getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


router = APIRouter(dependencies=[Depends(require_student)])
mysql_client = MockerDatabaseController()


def encode_image_to_base64(file_path: Path) -> str:
    """
    Read the image at file_path and return its Base64 encoded string.
    Returns an empty string if the file is not found or an error occurs.
    """
    try:
        with file_path.open("rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        logger.error(f"Error reading image file: {file_path}, error: {e}")
        return ""


@router.get("/exam/{mock_type}/", status_code=200)
async def get_mock_info(mock_type: MOCK_TYPE, payload: UserPayload) -> list[ExamsModel]:
    """
    Endpoint to get mock exam lists

    Returns:
        Union[list[ExamsInfoModel], ExamsInfoModel]: List of mock exam lists or single mock exam list.
    """
    logger.debug("Get mock exam lists")
    user_id = int(payload.user_id)
    mock_exam_data = mysql_client.query_mock_exam_list(mock_type, user_id)

    return mock_exam_data


@router.post("/new/exam/")
async def create_exam(exam_prams: ExamParamsModel) -> int:
    """
    Endpoint to create new exam

    Args:
        question: Exam question information
    Return:
        int: Inserted exam id
    """

    logger.debug(exam_prams)
    new_exam_id = mysql_client.insert_new_mock_exam_and_class(
        class_id=exam_prams.class_id,
        exam_name=exam_prams.exam_name,
        exam_type=exam_prams.exam_type,
        exam_date=exam_prams.exam_date,
        exam_duration=exam_prams.exam_duration,
    )
    if new_exam_id is None:
        raise HTTPException(status_code=500, detail="Internal Server Error")
    return new_exam_id


@router.post("/new/exam/{exam_id}/question")
async def create_exam_question(exam_id: int, question_text: str) -> int:
    question_id = mysql_client.insert_new_exam_question(
        exam_id=exam_id, question_text=question_text
    )

    if question_id is None:
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return question_id


@router.post("/new/exam/{exam_id}/question/{question_id}/option")
async def create_exam_question_option(
    exam_id: int, question_id: int, option_text: str, is_correct: bool
) -> int:
    option_id = mysql_client.insert_new_exam_question_option(
        question_id=question_id, option_text=option_text, is_correct=is_correct
    )

    if option_id is None:
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return option_id


@router.post("/new/exam/{exam_id}/question/{question_id}/image")
async def create_exam_question_image(
    exam_id: int, question_id: int, base64_image: str
) -> str:
    image_uuid = str(uuid4())
    image_path = (
        Path("./images/mock/") / str(exam_id) / str(question_id) / (image_uuid + ".png")
    )

    try:
        image_path.mkdir(parents=True, exist_ok=True)
        image_data = base64.b64decode(base64_image)
        with image_path.open("wb") as image_file:
            image_file.write(image_data)
        success = mysql_client.insert_new_exam_question_image(
            question_id=question_id,
            image_uuid=image_uuid,
        )
        if not success:
            raise HTTPException(status_code=500, detail="Internal Server Error")
    except Exception as e:
        logger.error(e)
        if image_path.exists():
            try:
                image_path.unlink()
                logger.debug(f"Cleaned up orphaned file: {image_path}")
            except Exception as cleanup_e:
                logger.error(
                    f"Failed to clean up orphaned file {image_path}: {cleanup_e}"
                )
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return image_uuid


@router.patch("/disable/exam/{exam_id}")
async def disable_exam(exam_id: int) -> bool:
    return mysql_client.disable_exam(exam_id=exam_id)


@router.patch("/disable/exam/{exam_id}/question/{question_id}")
async def disable_exam_question(exam_id: int, question_id: int) -> bool:
    return mysql_client.disable_exam_question(question_id=question_id)


@router.patch("/disable/exam/{exam_id}/question/{question_id}/option/{option_id}")
async def disable_exam_question_option(
    exam_id: int, question_id: int, option_id: int
) -> bool:
    return mysql_client.disable_exam_question_option(option_id=option_id)


@router.patch("/disable/exam/{exam_id}/question/{question_id}/image/{image_uuid}")
async def disable_exam_question_image(
    exam_id: int, question_id: int, image_uuid: str
) -> bool:
    success = mysql_client.disable_exam_question_image(
        exam_id=exam_id,
        question_id=question_id,
        image_uuid=image_uuid,
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to disable image.")
    return success


@router.patch("/modify/exam/{exam_id}")
async def modify_exam(exam_id: int, exam_prams: ExamParamsModel) -> bool:
    logger.debug((exam_id, exam_prams))
    success = mysql_client.modify_exam(
        class_id=exam_prams.class_id,
        exam_id=exam_id,
        exam_name=exam_prams.exam_name,
        exam_type=exam_prams.exam_type,
        exam_date=exam_prams.exam_date,
        exam_duration=exam_prams.exam_duration,
    )
    if not success:
        raise HTTPException(status_code=500, detail="Internal Server Error")
    return success


@router.patch("/modify/exam/{exam_id}/question/{question_id}")
async def modify_exam_question(
    exam_id: int, question_id: int, question_text: str
) -> int:
    logger.debug((exam_id, question_text))
    success = mysql_client.modify_exam_question(
        question_id=question_id, question_text=question_text
    )

    if not success:
        raise HTTPException(status_code=500, detail="Internal Server Error")
    return success


@router.patch("/modify/exam/{exam_id}/question/{question_id}/option/{option_id}")
async def modify_exam_question_option(
    exam_id: int, question_id: int, option_id: int, option_text: str, is_correct: bool
) -> bool:
    success = mysql_client.modify_exam_question_option(
        option_id=option_id,
        option_text=option_text,
        is_correct=is_correct,
    )

    if not success:
        raise HTTPException(status_code=500, detail="Internal Server Error")
    return success


@router.patch("/modify/exam/{exam_id}/question/{question_id}/image/{image_uuid}")
async def modify_exam_question_image(
    exam_id: int, question_id: int, image_uuid: str, base64_image: str
) -> bool:
    success = mysql_client.modify_exam_question_image(
        exam_id=exam_id,
        question_id=question_id,
        image_uuid=image_uuid,
        new_base64_image=base64_image,
    )
    if not success:
        raise HTTPException(status_code=500, detail="Internal Server Error")
    return success


@router.get("/exam/{exam_id}/question")
async def get_exam_question(exam_id: int) -> list[QuestionModel]:
    return mysql_client.query_exam_question(exam_id=exam_id)


@router.get("/exam/{exam_id}/question/{question_id}/option")
async def get_exam_question_option(exam_id: int, question_id: int) -> list[OptionModel]:
    return mysql_client.query_question_option(exam_id=exam_id, question_id=question_id)


@router.get("/exam/{exam_id}/question/{question_id}/image")
async def get_exam_question_image(
    exam_id: int, question_id: int
) -> list[QuestionImageBase64Model]:
    question_images = mysql_client.query_question_image(
        exam_id=exam_id, question_id=question_id
    )
    encoded_question_images: list[QuestionImageBase64Model] = []
    for image in question_images:
        image_path = (
            Path("./images/mock/")
            / str(exam_id)
            / str(question_id)
            / (image.image_uuid + ".png")
        )
        base64_encoded_image = encode_image_to_base64(image_path)
        encoded_question_images.append(
            QuestionImageBase64Model(
                question_id=image.question_id,
                image_uuid=image.image_uuid,
                image_data_base64=base64_encoded_image,
            )
        )

    return encoded_question_images


@router.get("/tag/list/")
async def get_tag_list() -> list[TagModel]:
    tag_list = mysql_client.query_tag_list()
    if not tag_list:
        raise HTTPException(status_code=404, detail="Tag Not Found")
    logger.info(tag_list)

    return tag_list


@router.get("/tag/{tag_id}")
async def get_tag(tag_id: int) -> TagModel:
    tag = mysql_client.query_tag(tag_id=tag_id)

    if not tag:
        raise HTTPException(status_code=404, detail="Tag Not Found")
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
