# Code by AkinoAlice@TyrantRey

import os

from fastapi import APIRouter, Depends, HTTPException

from Backend.utils.database.result import ResultDatabaseController
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.helper.api.dependency import require_student
from Backend.utils.helper.model.api.v1.result import MockResult

logger = CustomLoggerHandler().get_logger()

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")

router = APIRouter(dependencies=[Depends(require_student)])
mysql_client = ResultDatabaseController()


@router.get("/mock/{submission_id}/")
async def query_mock_exam_results(submission_id: int) -> MockResult:
    """
    Query mock exam results based on submission ID.
    Args:
        submission_id: int
    Returns:
        ExamResultModel
    """
    logger.debug(submission_id)
    exam_results = mysql_client.query_mock_exam_result(submission_id)
    if not exam_results:
        raise HTTPException(status_code=404, detail="Exam Submission ID not Found")
    logger.debug(exam_results)

    return exam_results
