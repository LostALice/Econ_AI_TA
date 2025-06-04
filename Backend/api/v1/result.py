# Code by AkinoAlice@TyrantRey

import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from Backend.utils.database.result import ResultDatabaseController
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.helper.api.dependency import require_student, TAPayload
from Backend.utils.helper.model.api.v1.result import MockResult

from pathlib import Path
from uuid import uuid4
import pandas as pd  # type: ignore[import-untyped]


logger = CustomLoggerHandler().get_logger()

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")

router = APIRouter(dependencies=[Depends(require_student)])
mysql_client = ResultDatabaseController()


def database_frame_to_xlsx(data: list[MockResult]) -> Path:
    file_uuid = str(uuid4())
    excel_path = Path("./excel/temp/")
    excel_file_path = excel_path / (file_uuid + ".xlsx")
    excel_path.mkdir(parents=True, exist_ok=True)
    df_data = pd.DataFrame(data.__dict__ for data in data)
    df_data.to_excel(excel_file_path)
    return excel_file_path


@router.get("/mock/{submission_id}/")
async def get_user_mock_exam_result(submission_id: int) -> MockResult:
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


@router.get("/class/{class_id}/")
async def get_mock_exam_results_by_class_id(
    class_id: int, payload: TAPayload
) -> list[MockResult]:
    exam_data = mysql_client.query_mock_exam_result_by_class(class_id=class_id)
    if not exam_data:
        raise HTTPException(status_code=404, detail="Class ID not Found")

    return exam_data


@router.get("/class/{class_id}/excel/")
async def get_mock_exam_results_by_class_id_excel(
    class_id: int, payload: TAPayload
) -> FileResponse:
    exam_data = mysql_client.query_mock_exam_result_by_class(class_id=class_id)
    if not exam_data:
        raise HTTPException(status_code=404, detail="Class ID not Found")

    excel_file_path = database_frame_to_xlsx(exam_data)

    return FileResponse(
        excel_file_path,
        media_type="application/octet-stream",
        filename=excel_file_path.name,
    )


@router.get("/exam/{exam_id}/")
async def get_mock_exam_results_by_exam_id(
    exam_id: int, payload: TAPayload
) -> list[MockResult]:
    exam_data = mysql_client.query_mock_exam_result_by_exam(exam_id=exam_id)
    if not exam_data:
        raise HTTPException(status_code=404, detail="Exam ID not Found")

    return exam_data


@router.get("/exam/{exam_id}/excel/")
async def get_mock_exam_results_by_exam_id_excel(
    exam_id: int, payload: TAPayload
) -> FileResponse:
    exam_data = mysql_client.query_mock_exam_result_by_exam(exam_id=exam_id)
    if not exam_data:
        raise HTTPException(status_code=404, detail="Exam ID not Found")

    excel_file_path = database_frame_to_xlsx(exam_data)

    return FileResponse(
        excel_file_path,
        headers={"Content-Disposition": f"attachment; filename={excel_file_path.name}"},
    )


@router.get("/user/{user_id}/")
async def get_mock_exam_results_by_user_id(
    user_id: int, payload: TAPayload
) -> list[MockResult]:
    exam_data = mysql_client.query_mock_exam_result_by_user(user_id=user_id)
    if not exam_data:
        raise HTTPException(status_code=404, detail="User ID not Found")

    return exam_data


@router.get("/user/{user_id}/excel/")
async def get_mock_exam_results_by_user_id_excel(
    user_id: int, payload: TAPayload
) -> FileResponse:
    exam_data = mysql_client.query_mock_exam_result_by_user(user_id=user_id)
    if not exam_data:
        raise HTTPException(status_code=404, detail="User ID not Found")

    excel_file_path = database_frame_to_xlsx(exam_data)

    return FileResponse(
        excel_file_path,
        headers={"Content-Disposition": f"attachment; filename={excel_file_path.name}"},
    )
