# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.api.v1.authorization import (
    LoginFormModel,
    LoginFormUnsuccessModel,
    LoginFormSuccessModel,
    SingUpSuccessModel,
)
from Backend.utils.helper.model.database.database import (
    UserInfoModel as DatabaseUserInfoModel,
)
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import mysql_client
from Backend.utils.helper.model.api.dependency import JWTPayload
from Backend.utils.helper.api.dependency import require_student

from fastapi import APIRouter, Depends, HTTPException, Response
from pprint import pformat
from typing import Union
from datetime import timedelta

import datetime
import hashlib
import jwt
import os
import re

router = APIRouter()
logger = CustomLoggerHandler().get_logger()

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")
logger.debug("| Authorization Loading Finished |")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


def parse_duration(duration_str: str) -> timedelta:
    pattern = r"(?P<value>\d+)(?P<unit>[smhdw])"
    match = re.fullmatch(pattern, duration_str.strip())

    if not match:
        raise ValueError("Invalid duration format. Use formats like 1d, 5h, 30m, etc.")

    value = int(match.group("value"))
    unit = match.group("unit")

    if unit == "s":
        return timedelta(seconds=value)
    elif unit == "m":
        return timedelta(minutes=value)
    elif unit == "h":
        return timedelta(hours=value)
    elif unit == "d":
        return timedelta(days=value)
    elif unit == "w":
        return timedelta(weeks=value)
    else:
        raise ValueError("Unsupported time unit")


@router.post("/login/", status_code=200)
async def login(
    login_form: LoginFormModel, response: Response
) -> Union[LoginFormSuccessModel, LoginFormUnsuccessModel]:
    """
    Authenticate a user and generate a JWT token upon successful login.

    This function handles the user login process. It verifies the provided credentials,
    generates a JWT token for authenticated users, and stores the token in the database.

    Args:
        login_form (LoginFormModel): An object containing the user's login credentials.
            It includes the following attributes:
            - username (str): The user's username.
            - hashed_password (str): The hashed password of the user.

    Returns:
        Union[LoginFormSuccessModel, LoginFormUnsuccessModel]:
            - If login is successful, returns a LoginFormSuccessModel containing:
                - status_code (int): HTTP status code (200 for success).
                - success (bool): True for successful login.
                - jwt_token (str): The generated JWT token.
                - role (str): The role of the authenticated user.
            - If login fails, returns a LoginFormUnsuccessModel containing:
                - status_code (int): HTTP status code indicating the error.
                - success (bool): False for failed login.
                - response (int): The error status code.

    Raises:
        HTTPException:
            - 500 status code if there's an unknown issue during token insertion.
            - 401 status code if the credentials are unrecognized.
    """
    # /authentication/login added by router
    username = login_form.username
    password = login_form.password

    hash_function = hashlib.sha3_256()
    hash_function.update(password.encode())
    hashed_password = hash_function.hexdigest()

    _status, user_info = mysql_client.get_user_info(username, hashed_password)

    if _status != 200 and isinstance(user_info, str):
        return LoginFormUnsuccessModel(
            status_code=_status,
            success=False,
            response=_status,
        )

    if _status == 200 and isinstance(user_info, DatabaseUserInfoModel):
        _jwt_secret = str(os.getenv("JWT_SECRET"))
        _jwt_algorithm = os.getenv("JWT_ALGORITHM")

        assert _jwt_secret is not None, "Missing JWT_SECRET environment variable"
        assert _jwt_algorithm in [
            "HS256",
            "HS384",
            "HS512",
            "ES256",
            "ES256K",
            "ES384",
            "ES512",
            "RS256",
            "RS384",
            "RS512",
            "PS256",
            "PS384",
            "PS512",
            "EdDSA",
        ], "Missing JWT_ALGORITHM environment variable"

        _jwt_timeout = os.getenv("JWT_TIMEOUT")
        assert _jwt_timeout is not None, "Missing JWT_TIMEOUT environment variable"
        jwt_expired_time = parse_duration(_jwt_timeout)
        assert jwt_expired_time is not None, "Missing JWT_TIMEOUT environment variable"

        login_info = {
            "expire_time": str(datetime.datetime.now() + jwt_expired_time),
            "role_name": user_info.role_name,
            "username": user_info.username,
            "user_id": user_info.user_id,
        }

        logger.debug(pformat(login_info))

        jwt_token = jwt.encode(login_info, _jwt_secret, algorithm=_jwt_algorithm)
        logger.debug(f"Generated new jwt token:{jwt_token}")

        _success = mysql_client.insert_login_token(user_info.user_id, jwt_token)

        if _success:
            response.set_cookie(key="token", value=jwt_token)
            response.set_cookie(key="role", value=str(login_info["role_name"]))

            return LoginFormSuccessModel(
                status_code=200,
                success=True,
                jwt_token=jwt_token,
                role=str(login_info["role_name"]),
            )
        else:
            raise HTTPException(status_code=500, detail="Unknown issue")

    raise HTTPException(status_code=401, detail="Unrecognized")


@router.post("/signup", status_code=200)
async def sign_in(
    username: str,
    password: str,
    # role_name: Literal["User", "Admin"] = "User",
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
    hash_function = hashlib.sha3_256()
    hash_function.update(password.encode())
    hashed_password = hash_function.hexdigest()

    _success = mysql_client.create_user(
        username=username, hashed_password=hashed_password, role_name="User"
    )
    if _success:
        return SingUpSuccessModel(status_code=200, success=True)
    else:
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/test/", status_code=200, tags=["test", "Authorization"])
async def test(user: JWTPayload = Depends(require_student)):
    return {"message": f"Hello, {user.username}!"}
