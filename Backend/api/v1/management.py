# Code by AkinoAlice@TyrantRey

from fastapi import APIRouter, Depends

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.management import ManagementDatabaseController
from Backend.utils.helper.model.api.v1.management import UserModel, ClassModel
from Backend.utils.helper.api.dependency import require_teacher


# development
from dotenv import load_dotenv

import os


logger = CustomLoggerHandler().get_logger()
logger.debug("| Admin Loading Finished |")
management_database_controller = ManagementDatabaseController()

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")

if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")
    router = APIRouter(prefix="/management")
else:
    router = APIRouter(dependencies=[Depends(require_teacher)], prefix="/management")


@router.get("/teacher-list/")
def get_teacher_list() -> list[UserModel]:
    return management_database_controller.query_teacher_list()


@router.get("/user-list/")
def get_user_list() -> list[UserModel]:
    return management_database_controller.query_user_list()


@router.get("/class-list/")
def get_class_list() -> list[ClassModel]:
    return management_database_controller.get_class_list()


@router.post("/create-class")
def create_class(classname: str) -> int:
    class_id = management_database_controller.create_class(classname)
    return class_id
