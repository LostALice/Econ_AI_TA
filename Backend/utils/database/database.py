# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.database.database import (
    QueryDocumentationTypeListModel,
    UserInfoModel,
)
from Backend.utils.helper.logger import CustomLoggerHandler
from typing import Literal

import mysql.connector as connector

from pprint import pformat
from os import getenv


# development
from dotenv import load_dotenv

load_dotenv("./.env")


class SetupMYSQL(object):
    _instance = None

    def __new__(cls):
        if not cls._instance:
            if not cls._instance:
                cls._instance = super(SetupMYSQL, cls).__new__(cls)
                cls._instance._initialize()

        return cls._instance

    def _initialize(self) -> None:
        self.DEBUG = getenv("MYSQL_DEBUG")

        self.HOST = getenv("MYSQL_HOST")
        self.USER = getenv("MYSQL_USER_NAME")
        self.PASSWORD = getenv("MYSQL_PASSWORD")
        self.DATABASE = getenv("MYSQL_DATABASE")
        self.PORT = getenv("MYSQL_PORT")

        self.ATTENDANCE = getenv("MYSQL_CONNECTION_RETRY")
        self.ROOT_USERNAME = getenv("MYSQL_ROOT_USERNAME")
        self.ROOT_PASSWORD = getenv("MYSQL_ROOT_PASSWORD")

        assert self.DEBUG is not None, "Missing MYSQL_DEBUG environment variable"

        assert self.HOST is not None, "Missing MYSQL_HOST environment variable"
        assert self.USER is not None, "Missing MYSQL_USER_NAME environment variable"
        assert self.PASSWORD is not None, "Missing MYSQL_PASSWORD environment variable"
        assert self.DATABASE is not None, "Missing MYSQL_DATABASE environment variable"
        assert self.PORT is not None, "Missing MYSQL_PORT environment variable"

        assert (
            self.ATTENDANCE is not None
        ), "Missing MYSQL_CONNECTION_RETRY environment variable"
        assert (
            self.ROOT_USERNAME is not None
        ), "Missing MYSQL_ROOT_USERNAME environment variable"
        assert (
            self.ROOT_PASSWORD is not None
        ), "Missing MYSQL_ROOT_PASSWORD environment variable"

        # logger
        self.logger = CustomLoggerHandler(__name__).setup_logging()

        self.logger.debug("=======================")
        self.logger.debug("| Start loading MYSQL |")
        self.logger.debug("=======================")

        self._setup()

        self.logger.debug("==========================")
        self.logger.debug("| MYSQL Loading Finished |")
        self.logger.debug("==========================")

    def _setup(self):
        """
        Set up the MySQL database connection and initialize the database structure.

        This method performs the following tasks:
        1. Establishes a connection to the MySQL server.
        2. Creates a cursor for executing SQL queries.
        3. Attempts to use the specified database.
        4. If in debug mode, drops and recreates the database.
        5. If the database doesn't exist, creates it.
        6. Creates necessary tables (role, user, login, chat, file, qa, attachment).
        7. Inserts initial data, including an admin account and an anonymous user.

        Raises:
            connector.Error: If there's an error connecting to the database or executing SQL queries.

        Note:
            This method is called internally during the initialization of the SetupMYSQL class.
        """
        self.connection = connector.connect(
            host=self.HOST,
            user=self.USER,
            password=self.PASSWORD,
            port=self.PORT,
        )

        self.cursor = self.connection.cursor(dictionary=True, prepared=True)

        try:
            self.connection.database = self.DATABASE
            if self.DEBUG in ["True", "true"]:
                self.logger.warning("Dropping database")
                self.cursor.execute(f"DROP DATABASE {self.DATABASE}")
                self.commit()
                self.create_database()
            else:
                self.logger.info(f"Skipped recrate database, Debug: {self.DEBUG}")
        except connector.Error as error:
            self.logger.error(error)
            self.logger.debug(pformat(f"Creating MYSQL database {self.DATABASE}"))
            self.create_database()
        finally:
            self.logger.debug(f"Using MYSQL database {self.DATABASE}")
            self.connection.database = self.DATABASE
            self.cursor = self.connection.cursor(dictionary=True, prepared=True)

    def create_database(self) -> None:
        self.cursor.execute(f"CREATE DATABASE {self.DATABASE};")
        self.connection.connect(database=self.DATABASE)
        self.connection.commit()

        # ROLE table
        self.cursor.execute(
            f"""
            CREATE TABLE `{self.DATABASE}`.`role` (
                `role_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `role_name` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`role_id`),
                UNIQUE INDEX `role_id` (`role_id` ASC)
            );

            """
        )
        self.connection.commit()

        # USER table
        self.cursor.execute(
            f"""
            CREATE TABLE `{self.DATABASE}`.`user` (
                `user_id` INT NOT NULL AUTO_INCREMENT,
                `username` VARCHAR(45) NOT NULL,
                `role_id` INT UNSIGNED NOT NULL,
                PRIMARY KEY (`user_id`),
                FOREIGN KEY (`role_id`) REFERENCES `role`(`role_id`)
            );
            """
        )
        self.connection.commit()

        # LOGIN table
        self.cursor.execute(
            f"""
            CREATE TABLE `{self.DATABASE}`.`login` (
                `user_id` INT NOT NULL,
                `password` VARCHAR(64) NOT NULL,
                `jwt` VARCHAR(255) NOT NULL DEFAULT "",
                `last_login` TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (`user_id`),
                FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`)
            );
            """
        )
        self.connection.commit()

        # CHAT table
        self.cursor.execute(
            f"""
            CREATE TABLE `{self.DATABASE}`.`chat` (
                `chat_id` VARCHAR(45) NOT NULL,
                `user_id` INT NOT NULL,
                `chat_name` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`chat_id`),
                UNIQUE INDEX `chat_id` (`chat_id` ASC),
                FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`)
            );
            """
        )

        # FILE table
        self.cursor.execute(
            f"""
            CREATE TABLE `{self.DATABASE}`.`file` (
                `file_id` VARCHAR(45) NOT NULL,
                `collection` VARCHAR(45) NOT NULL DEFAULT "default",
                `file_name` VARCHAR(255) NOT NULL,
                `last_update` TIMESTAMP NOT NULL DEFAULT NOW(),
                `expired` TINYINT NOT NULL DEFAULT "0",
                `tags` JSON NOT NULL DEFAULT (JSON_OBJECT()),
                PRIMARY KEY (`file_id`, `collection`),
                UNIQUE INDEX `file_id` (`file_id` ASC)
            );
            """
        )

        # QA table
        self.cursor.execute(
            f"""
            CREATE TABLE `{self.DATABASE}`.`qa` (
                `chat_id` VARCHAR(45) NOT NULL,
                `qa_id` VARCHAR(45) NOT NULL,
                `question` LONGTEXT NOT NULL,
                `answer` LONGTEXT NOT NULL,
                `token_size` INT NOT NULL DEFAULT 0,
                `rating`TINYINT DEFAULT NULL,
                `sent_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `sent_by` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`chat_id`, `qa_id`),
                UNIQUE INDEX `qa_id` (`qa_id`),
                FOREIGN KEY (`chat_id`) REFERENCES `chat`(`chat_id`)
            );
            """
        )

        # ATTACHMENT table
        self.cursor.execute(
            f"""
            CREATE TABLE `{self.DATABASE}`.`attachment` (
                `chat_id` VARCHAR(45) NOT NULL,
                `qa_id` VARCHAR(45) NOT NULL,
                `file_id` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`qa_id`, `file_id`),
                FOREIGN KEY (`chat_id`) REFERENCES `chat`(`chat_id`),
                FOREIGN KEY (`file_id`) REFERENCES `file`(`file_id`),
                FOREIGN KEY (`qa_id`) REFERENCES `qa`(`qa_id`)
            );
            """
        )

        self.connection.commit()

        # Admin account
        admin_username = str(self.ROOT_USERNAME)
        admin_password = str(self.ROOT_PASSWORD)

        import hashlib

        hashed_admin_password = hashlib.sha3_256(
            admin_password.encode("utf-8")
        ).hexdigest()
        self.logger.info(f"Root username: {admin_username}")
        self.logger.info(f"Root password: {hashed_admin_password}")

        self.cursor.execute(
            """
            INSERT INTO `role` (`role_name`) VALUES ("Admin");
            """
        )
        self.cursor.execute(
            """
            INSERT INTO `user` (`username`, `role_id`) VALUES (%s, 1);
            """,
            (admin_username,),
        )
        self.cursor.execute(
            """
            INSERT INTO `login` (user_id, password) VALUES (1, %s);
            """,
            (hashed_admin_password,),
        )
        self.connection.commit()

        # Anonymous
        self.cursor.execute(
            """
            INSERT INTO `role` (`role_name`) VALUES ("Anonymous");
            """
        )
        self.cursor.execute(
            """
            INSERT INTO `user` (`username`, `role_id`) VALUES (%s, 2);
            """,
            ("Anonymous",),
        )
        self.connection.commit()

        self.logger.debug(pformat(f"Created MYSQL database {self.DATABASE}"))


class MySQLHandler(SetupMYSQL):
    def __init__(self) -> None:
        super().__init__()

    def query_role_id(self, role_name: str) -> int | None:
        """query the role name using role id

        Args:
            role_name: (str): role name

        Returns:
            int: role name
            None: not found
        """
        self.connection.ping(attempts=3)
        self.logger.debug(pformat(f"create_user {role_name}"))

        self.cursor.execute(
            """SELECT role_id FROM `role` WHERE role_name = %s""", (role_name,)
        )
        self.sql_query_logger()
        role_id = self.cursor.fetchone()

        self.logger.info(pformat(role_id))

        return int(role_id) if role_id else None

    # def create_role(self, role_name: str) -> str | None:
    #     """create a new role

    #     Args:
    #         role_name (str): name of the role

    #     Returns:
    #         str: the role name
    #     """
    #     self.connection.ping(attempts=3)
    #     self.logger.debug(
    #         pformat(f"create_role {role_name}"))

    #     # check is role exist
    #     role_name = self.query_role(role_name)
    #     if role_name is None:
    #         return None

    #     self.cursor.execute("""
    #         INSERT INTO `role` (role_name)
    #         VALUES (
    #             %s,
    #         );""", (role_name,))

    #     self.commit()

    #     role_name = self.query_role(role_name)

    #     return role_name

    def create_user(
        self,
        username: str,
        hashed_password: str,
        role_name: Literal["user", "admin"] = "user",
    ) -> int | bool:
        """create a new user

        Args:
            username (str): provide a username
            password (str): password
            role_name (str): admin | user

        Returns:
            int:
                200: success
                302: username exists in database
                500: database error
        """
        self.connection.ping(attempts=3)
        self.logger.debug(
            pformat(f"create_user {username} {hashed_password} {role_name}")
        )

        # check if user already exists
        self.cursor.execute(
            """SELECT username FROM `users` WHERE username = %s""", (username,)
        )

        self.sql_query_logger()
        is_username_exist = self.cursor.fetchone()
        self.logger.info("is_username_exist", is_username_exist)

        if is_username_exist:
            return 302

        # check if role exists in database
        self.cursor.execute(
            """SELECT role_id FROM `role` WHERE role_name = %s""", (role_name,)
        )

        self.sql_query_logger()
        role_id = self.cursor.fetchone()
        self.logger.info(pformat(role_id))

        if is_username_exist:
            return 302

        self.cursor.execute(
            """
            INSERT INTO `login` (user_id, password)
            VALUES (
                %s, %s,
            );""",
            (username, hashed_password),
        )

        return self.commit()

    def insert_login_token(self, user_id: int, jwt_token: str) -> bool:
        """
        Insert or update a JWT token for a specific user in the login table.

        This function updates the 'jwt' field in the 'login' table for the specified user.
        It's typically used when a user logs in and receives a new JWT token.

        Args:
            user_id (int): The unique identifier of the user.
            jwt_token (str): The JSON Web Token (JWT) to be associated with the user.

        Returns:
            bool: True if the token was successfully inserted/updated, False otherwise.
        """
        self.logger.info(pformat(f"insert_login_token {user_id} {jwt_token}"))

        self.cursor.execute(
            """
            UPDATE login
            SET jwt = %s
            WHERE user_id = %s""",
            (jwt_token, user_id),
        )

        return True if self.commit() else False

    def get_user_info(
        self, username: str, hashed_password: str
    ) -> tuple[int, UserInfoModel] | tuple[int, str]:
        """
        Retrieve user information from the database based on username and hashed password.

        This function checks if the provided username and hashed password match a user
        in the database. If a match is found, it returns the user's information.

        Args:
            username (str): The username of the user to retrieve information for.
            hashed_password (str): The hashed password of the user for authentication.

        Returns:
            tuple[int, UserInfoModel] | tuple[int, str]: A tuple containing:
                - An integer status code:
                    200: User found and password correct
                    403: Password incorrect or user not found
                - If status is 200: A UserInfoModel object containing user information
                - If status is 403: An error message string
        """
        self.connection.ping(attempts=3)
        self.logger.debug(f"user: {username} trying to login")

        self.cursor.execute(
            """
            SELECT user.user_id, user.username, login.password, login.jwt, login.last_login, role.role_name
            FROM user
            JOIN login ON user.user_id = login.user_id
            JOIN role ON user.role_id = role.role_id
            WHERE user.username = %s AND login.password = %s""",
            (username, hashed_password),
        )

        temp_fetch = self.cursor.fetchone()
        if temp_fetch:
            login_info = UserInfoModel(
                user_id=temp_fetch["user_id"],
                username=temp_fetch["username"],
                password=temp_fetch["password"],
                jwt=temp_fetch["jwt"],
                last_login=temp_fetch["last_login"],
                role_name=temp_fetch["role_name"],
            )

            self.logger.debug(pformat(login_info))
            return 200, login_info
        else:
            return 403, "Error"

    # def check_user(self, username: str, roles: str = None) -> int:
    #     """check username and password is inside database

    #     Args:
    #         username (str): username
    #         password (str): hash of password
    #         roles (str): admin | user | None roles

    #     Returns:
    #         int:
    #             200: user inside database and password correct
    #             401: username not found
    #             403: password incorrect
    #             500: database error
    #     """

    def insert_file(
        self, file_uuid: str, filename: str, tags: str, collection: str = "default"
    ) -> bool:
        """
        Insert a file record into the database.

        This function adds a new file entry to the database with the provided information.

        Args:
            file_uuid (str): The unique identifier for the file.
            filename (str): The name of the file.
            tags (str): A string representation of tags associated with the file.
            collection (str, optional): The collection to which the file belongs. Defaults to "default".

        Returns:
            bool: True if the file record was successfully inserted, False otherwise.
        """
        self.connection.ping(attempts=3)
        self.logger.debug(
            pformat(f"insert_file {file_uuid} {filename} {tags} {collection}")
        )

        self.cursor.execute(
            """
            INSERT INTO `file` (file_id, file_name, tags, collection)
            VALUES (
                %s, %s, %s, %s
            );""",
            (file_uuid, filename, tags, collection),
        )

        return self.commit()

    def update_rating(self, question_uuid: str, rating: bool) -> bool:
        """
        Update the rating of an answer in the database.

        This function updates the rating of a specific answer identified by its question UUID.
        The rating is a boolean value indicating whether the answer was good (True) or bad (False).

        Args:
            question_uuid (str): The unique identifier of the question associated with the answer.
            rating (bool): The rating to be applied to the answer. True for a good rating, False for a bad rating.

        Returns:
            bool: True if the rating was successfully updated in the database, False otherwise.
        """
        self.connection.ping(attempts=3)
        self.logger.info(f"inserting rating {question_uuid}:{rating}")

        self.cursor.execute(
            """
            UPDATE `qa`
            SET rating = %s
            WHERE qa_id = %s;""",
            (rating, question_uuid),
        )

        success = self.commit()
        return success

    def insert_chatting(
        self,
        chat_id: str,
        qa_id: str,
        question: str,
        answer: str,
        token_size: int,
        sent_by: str,
        file_ids: list[str],
    ) -> bool:
        """
        Insert a new chat record into the database.

        This function inserts a new chat record, including the question, answer, and associated files,
        into the database. It creates entries in the chat, qa, and attachment tables as necessary.

        Args:
            chat_id (str): The unique identifier for the chat session.
            qa_id (str): The unique identifier for the question-answer pair.
            question (str): The text of the question asked.
            answer (str): The text of the answer provided.
            token_size (int): The number of tokens in the question.
            sent_by (str): The username of the user who sent the question.
            file_ids (list[str]): A list of file identifiers associated with the answer.

        Returns:
            bool: True if the chat record was successfully inserted, False otherwise.
        """
        self.connection.ping(attempts=3)
        self.cursor.execute(
            """SELECT user_id FROM user WHERE username = %s""", (sent_by,)
        )
        user_id = self.cursor.fetchone()["user_id"]

        self.logger.debug(
            pformat(
                {
                    "chat_id": chat_id,
                    "qa_id": qa_id,
                    "question": question,
                    "answer": answer,
                    "token_size": token_size,
                    "sent_by": sent_by,
                    "file_ids": file_ids,
                    "user_id": user_id,
                }
            )
        )

        self.cursor.execute(
            f"""
            INSERT IGNORE INTO `{self.DATABASE}`.`chat` (chat_id, user_id, chat_name)
            VALUES (
                %s, %s, %s
            );""",
            (chat_id, user_id, answer[:10]),
        )

        success = self.commit()
        assert success

        self.cursor.execute(
            f"""
            INSERT INTO `{self.DATABASE}`.`qa` (chat_id, qa_id, question, answer, token_size, sent_by)
            VALUES (
                %s, %s, %s, %s, %s, %s
            );
        """,
            (chat_id, qa_id, question, answer, token_size, sent_by),
        )

        success = self.commit()
        assert success

        if not file_ids is None:
            for file_id in set(file_ids):
                self.cursor.execute(
                    f"""
                    INSERT INTO `{self.DATABASE}`.`attachment` (chat_id, qa_id, file_id)
                    VALUES (
                        %s, %s, %s
                    );
                """,
                    (chat_id, qa_id, file_id),
                )
            success = self.commit()

        return success

    # def query_docs_id(self, docs_name: str) -> str:
    #     """
    #         search documents by id

    #     Args:
    #         docs_name: name of the documents

    #     Returns:
    #         filename: file name
    #     f"""
    #     self.connection.ping(attempts=3)
    #     self.cursor.execute("""SELECT file_id
    #         FROM {self.DATABASE}.file
    #         WHERE file_name = %s
    #         """, (docs_name,)
    #     )

    #     self.sql_query_logger()
    #     file_name = self.cursor.fetchone()
    #     self.logger.info(pformat(file_name))
    #     return file_name

    def query_docs_name(self, docs_id: str) -> str:
        """
        Retrieve the file name of a document based on its ID.

        This function queries the database to find the file name associated with the given document ID.

        Args:
            docs_id (str): The unique identifier of the document.

        Returns:
            str: The file name of the document if found, or an empty string if not found.

        Note:
            This method pings the database connection before executing the query to ensure it's active.
        """
        self.connection.ping(attempts=3)

        self.logger.info(pformat("query docs name {docs_id}"))
        self.cursor.execute(
            f"""SELECT file_name
            FROM {self.DATABASE}.file
            WHERE file_id = %s
            """,
            (docs_id,),
        )

        self.sql_query_logger()
        file_name = self.cursor.fetchone()

        if file_name:
            file_name = file_name["file_name"]

        self.logger.info(pformat(file_name))
        return str(file_name)

    def query_documentation_type_list(
        self, documentation_type: str
    ) -> list[QueryDocumentationTypeListModel]:
        """
        Retrieve a list of documents of a specific documentation type.

        This function queries the database for all non-expired files that match
        the given documentation type and returns their details.

        Args:
            documentation_type (str): The type of documentation to query for.

        Returns:
            list[QueryDocumentationTypeListModel]: A list of QueryDocumentationTypeListModel objects,
            each containing details (file_id, file_name, last_update_time) of a matching document.

        Note:
            This method pings the database connection before executing the query to ensure it's active.
        """
        self.connection.ping(attempts=3)
        self.cursor.execute(
            f""" SELECT file_id, file_name, last_update
                FROM {self.DATABASE}.file
                WHERE `expired` = 0 AND `tags` -> "$.documentation_type" = %s
            """,
            (documentation_type,),
        )

        self.sql_query_logger()
        query_result = []
        for i in self.cursor.fetchall():
            query_result.append(
                QueryDocumentationTypeListModel(
                    file_id=i["file_id"],
                    file_name=i["file_name"],
                    last_update_time=i["last_update_time"],
                )
            )
        self.logger.debug(pformat(f"select file list query: {query_result}"))

        return query_result

    def sql_query_logger(self) -> None:
        """log sql query"""
        self.logger.debug(pformat(f"committed sql: {str(self.cursor.statement)}"))

    def commit(self, close_connection: bool = False) -> bool:
        """
        Commit a database transaction and optionally close the connection.

        This method attempts to commit the current transaction to the database.
        If the commit fails, it will rollback the transaction. It also provides
        an option to close the database connection after the commit operation.

        Args:
            close_connection (bool, optional): If True, closes the database connection
                after committing. Defaults to False.

        Returns:
            bool: True if the commit was successful, False if it failed and was rolled back.

        Raises:
            Exception: Any exception that occurs during the commit process is caught,
                logged, and results in a rollback.
        """
        try:
            self.sql_query_logger()
            self.connection.commit()
            self.logger.debug(pformat("Mysql committed"))
            return True
        except Exception as error:
            self.logger.error(error)
            self.connection.rollback()
            return False
        finally:
            if close_connection:
                self.connection.close()
                self.logger.debug(pformat("Mysql connection closed"))


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv("./Backend/.env")
    MySQLHandler()
