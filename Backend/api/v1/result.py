# Code by AkinoAlice@TyrantRey

import os

from fastapi import APIRouter, Depends

from Backend.utils.database.database import mysql_client
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.helper.api.dependency import require_admin
from Backend.utils.helper.model.api.v1.mock import ExamResultModel

logger = CustomLoggerHandler().get_logger()

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/result/")
def get_result(
    class_id: list[int] | int | None,
    user_id: list[int] | int | None,
    tag_id: list[int] | int | None,
    teacher_id: list[int] | int | None,
): ...


@router.get("/{submission_id}")
async def query_mock_exam_results(submission_id: int) -> ExamResultModel | None:
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
