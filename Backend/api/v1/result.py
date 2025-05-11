# Code by AkinoAlice@TyrantRey

import os

from fastapi import APIRouter, Depends

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.helper.api.dependency import require_admin

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
