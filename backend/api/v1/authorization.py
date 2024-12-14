# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.api.v1.authorization import (
    LoginFormModel,
    LoginFormUnsuccessModel,
    LoginFormSuccessModel,
    UserInfoModel,
    SingUpSuccessModel,
)
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import MySQLHandler

from fastapi import APIRouter, HTTPException
from pprint import pformat
from typing import Union

import datetime
import hashlib
import jwt
import os

# development
from dotenv import load_dotenv

load_dotenv("./.env")

router = APIRouter()
mysql_client = MySQLHandler()
logger = CustomLoggerHandler(__name__).setup_logging()


@router.post("/authorization/login/", status_code=200)
async def login(
    login_form: LoginFormModel,
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
    hashed_password = login_form.hashed_password

    _status, user_info = mysql_client.get_user_info(username, hashed_password)

    if _status != 200 and isinstance(user_info, str):
        return LoginFormUnsuccessModel(
            status_code=_status,
            success=False,
            response=_status,
        )

    if _status == 200 and isinstance(user_info, UserInfoModel):
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
        ], "Missing MYSQL_HOST environment variable"

        login_info = {
            "expire_time": str(datetime.datetime.now() + datetime.timedelta(days=1)),
            "role_name": user_info.role_name,
            "username": user_info.username,
            "user_id": user_info.user_id,
        }

        logger.debug(pformat(login_info))

        jwt_token = jwt.encode(login_info, _jwt_secret, algorithm=_jwt_algorithm)
        logger.debug(f"Generated new jwt token:{jwt_token}")

        _success = mysql_client.insert_login_token(user_info.user_id, jwt_token)

        if _success:
            return LoginFormSuccessModel(
                status_code=200,
                success=True,
                jwt_token=jwt_token,
                role=str(login_info["role_name"]),
            )
        else:
            raise HTTPException(status_code=500, detail="Unknown issue")

    raise HTTPException(status_code=401, detail="Unrecognized")


@router.post("/authorization/signup", status_code=200)
async def sign_in(username: str, password: str) -> SingUpSuccessModel:
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

    _success = mysql_client.create_user(username, hashed_password)
    if _success:
        return SingUpSuccessModel(status_code=200, success=True)
    else:
        raise HTTPException(status_code=500, detail="Internal Server Error")
