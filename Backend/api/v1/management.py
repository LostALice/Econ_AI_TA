# Code by AkinoAlice@TyrantRey

from fastapi import APIRouter, Depends, HTTPException

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.management import ManagementDatabaseController
from Backend.utils.database.database import mysql_client
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

router = APIRouter(dependencies=[Depends(require_teacher)])


@router.get("/teacher-list/")
def get_teacher_list() -> list[UserModel]:
    data = management_database_controller.query_teacher_list()
    return data if data else []


@router.get("/user-list/")
def get_user_list() -> list[UserModel]:
    data = management_database_controller.query_user_list()
    logger.debug(data)
    return data if data else []


@router.get("/class-list/")
def get_class_list() -> list[ClassModel]:
    data = management_database_controller.get_class_list()
    logger.debug(data)
    return data if data else []


@router.post("/new-class/")
def new_class(classname: str) -> int:
    data = management_database_controller.new_class(classname)
    logger.debug(data)
    return data


@router.post("/new-user/")
def new_user(user_id: int, class_id: int) -> int:
    role_id = mysql_client.query_role_id_by_user_id(user_id)

    if role_id is None:
        raise HTTPException(status_code=404, detail="User not found")
    data = management_database_controller.new_user(
        class_id=class_id, user_id=user_id, role_id=role_id
    )
    logger.debug(data)
    return data


@router.delete("/delete-class/")
def delete_class(class_id: int) -> int:
    data = management_database_controller.delete_class(class_id=class_id)
    logger.debug(data)
    return data


@router.delete("/delete-user/")
def delete_user(class_id: int, user_id: int) -> int:
    data = management_database_controller.delete_user(
        class_id=class_id, user_id=user_id
    )
    logger.debug(data)
    return data
