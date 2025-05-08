# Code by AkinoAlice@TyrantRey

from fastapi import APIRouter, Depends, HTTPException

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import mysql_client
from Backend.utils.helper.api.dependency import require_root
from Backend.utils.helper.model.api.v1.authorization import SingUpSuccessModel


from typing import Literal
from hashlib import sha3_256

# development
from dotenv import load_dotenv

import os


logger = CustomLoggerHandler().get_logger()
logger.debug("| Admin Loading Finished |")

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")

if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")
    from dotenv import load_dotenv

    load_dotenv("./.env")


router = APIRouter(dependencies=[Depends(require_root)], prefix="/admin")
# mysql_client = MySQLHandler()


@router.post("/new-user", status_code=200)
async def new_user(
    username: str,
    password: str,
    role_name: Literal["User", "Admin"] = "User",
) -> SingUpSuccessModel:
    """
    Register a new user with the provided username and password.

    This function handles the user registration process. It hashes the provided password
    using SHA3-256 algorithm and attempts to create a new user in the database.

    Args:
        username (str): The desired username for the new user account.
        password (str): The password for the new user account (will be hashed before storage).

    Returns:
        SingUpSuccessModel: An object containing:
            - status_code (int): HTTP status code (200 for success).
            - success (bool): True if the user was successfully created.

    Raises:
        HTTPException:
            - 500 status code if there's an internal server error during user creation.
    """
    hash_function = sha3_256()
    hash_function.update(password.encode())
    hashed_password = hash_function.hexdigest()

    _success = mysql_client.create_user(
        username=username, hashed_password=hashed_password, role_name=role_name
    )
    if _success:
        return SingUpSuccessModel(status_code=200, success=True)
    else:
        raise HTTPException(status_code=500, detail="Internal Server Error")
