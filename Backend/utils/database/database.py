# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.database.database import (
    QueryDocumentationTypeListModel,
    UserInfoModel,
)
from Backend.utils.helper.model.api.v1.mock import (
    ExamOptionModel,
    ExamQuestionModel,
    ExamsInfoModel,
    CreateNewExamParamsModel,
    CreateNewOptionParamsModel,
    CreateNewQuestionParamsModel,
    MockExamQuestionsListModel,
    MockExamQuestionsOptionListModel,
    MockExamInformationModel,
    SubmittedExamModel,
    ExamResultModel,
    TagModel,
)
from Backend.utils.helper.logger import CustomLoggerHandler
from typing import Literal

import mysql.connector as connector
import json

from pprint import pformat
from os import getenv

# development
GLOBAL_DEBUG_MODE = getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


class SetupMYSQL:
    def __init__(self) -> None:
        self._DEBUG = getenv("MYSQL_DEBUG")

        self._HOST = getenv("MYSQL_HOST")
        self._USER = getenv("MYSQL_USER_NAME")
        self._PASSWORD = getenv("MYSQL_PASSWORD")
        self._DATABASE = getenv("MYSQL_DATABASE")
        self._PORT = getenv("MYSQL_PORT")

        self._ATTENDANCE = getenv("MYSQL_CONNECTION_RETRY")
        self._ROOT_USERNAME = getenv("MYSQL_ROOT_USERNAME")
        self._ROOT_PASSWORD = getenv("MYSQL_ROOT_PASSWORD")

        assert self._DEBUG is not None, "Missing MYSQL_DEBUG environment variable"

        assert self._HOST is not None, "Missing MYSQL_HOST environment variable"
        assert self._USER is not None, "Missing MYSQL_USER_NAME environment variable"
        assert self._PASSWORD is not None, "Missing MYSQL_PASSWORD environment variable"
        assert self._DATABASE is not None, "Missing MYSQL_DATABASE environment variable"
        assert self._PORT is not None, "Missing MYSQL_PORT environment variable"

        assert self._ATTENDANCE is not None, (
            "Missing MYSQL_CONNECTION_RETRY environment variable"
        )
        assert self._ROOT_USERNAME is not None, (
            "Missing MYSQL_ROOT_USERNAME environment variable"
        )
        assert self._ROOT_PASSWORD is not None, (
            "Missing MYSQL_ROOT_PASSWORD environment variable"
        )

        # logger
        self.logger = CustomLoggerHandler().get_logger()

        self.logger.debug("| Start loading MYSQL |")

        self._setup()

        self.logger.debug("| MYSQL Loading Finished |")

    def _setup(self):
        """
        Set up the MySQL database connection and initialize the database structure.

        This method performs the following tasks:
        1. Establishes a connection to the MySQL server.
        2. Creates a cursor for executing SQL queries.
        3. Attempts to use the specified database.
        4. If in debug mode, drops and recreates the database.
        5. If the database does not exist, creates it.
        6. Creates necessary tables (role, user, login, chat, file, qa, attachment).
        7. Inserts initial data, including an admin account and an anonymous user.

        Raises:
            connector.Error: If there"s an error connecting to the database or executing SQL queries.

        Note:
            This method is called internally during the initialization of the SetupMYSQL class.
        """
        self.connection = connector.connect(
            host=self._HOST,
            user=self._USER,
            password=self._PASSWORD,
            port=self._PORT,
        )

        self.cursor = self.connection.cursor(dictionary=True, prepared=True)

        try:
            self.logger.debug(f"Debug Mode: {self._DEBUG}")
            if self._DEBUG in ["True", "true"]:
                self.logger.warning("Dropping database")
                self.cursor.execute(f"DROP SCHEMA {self._DATABASE}")
                self.connection.commit()
                self.create_database()
            else:
                self.logger.info(f"Skipped recrate database, Debug: {self._DEBUG}")
            self.connection.database = self._DATABASE
        except connector.Error as error:
            self.logger.error(error)
            self.create_database()
        finally:
            self.logger.debug(f"Using MYSQL database {self._DATABASE}")
            self.connection.database = self._DATABASE
            self.cursor = self.connection.cursor(dictionary=True, prepared=True)

    def create_database(self) -> None:
        self.logger.debug(f"Creating MYSQL database {self._DATABASE}")
        self.cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self._DATABASE};")
        self.connection.connect(database=self._DATABASE)
        self.connection.commit()

        # ROLE table
        self.cursor.execute(
            """
            CREATE TABLE role (
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
            """
            CREATE TABLE `user` (
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
            """
            CREATE TABLE login (
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
            """
            CREATE TABLE chat (
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
            """
            CREATE TABLE file (
                `file_id` VARCHAR(45) NOT NULL,
                `collection` VARCHAR(45) NOT NULL DEFAULT "default",
                `file_name` VARCHAR(255) NOT NULL,
                `last_update` TIMESTAMP NOT NULL DEFAULT NOW(),
                `expired` TINYINT(1) NOT NULL DEFAULT "0",
                `tags` JSON NOT NULL DEFAULT (JSON_OBJECT()),
                PRIMARY KEY (`file_id`, `collection`),
                UNIQUE INDEX `file_id` (`file_id` ASC)
            );
            """
        )

        # QA table
        self.cursor.execute(
            """
            CREATE TABLE qa (
                `chat_id` VARCHAR(45) NOT NULL,
                `qa_id` VARCHAR(45) NOT NULL,
                `question` LONGTEXT NOT NULL,
                `images` VARCHAR(45) NULL,
                `answer` LONGTEXT NOT NULL,
                `token_size` INT NOT NULL DEFAULT 0,
                `rating` TINYINT(1) DEFAULT NULL,
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
            """
            CREATE TABLE attachment (
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

        # IMAGES table
        self.cursor.execute(
            """
            CREATE TABLE images (
                `chat_id` VARCHAR(45) NOT NULL,
                `qa_id` VARCHAR(45) NOT NULL,
                `images_file_id` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`qa_id`, `images_file_id`),
                FOREIGN KEY (`chat_id`) REFERENCES `chat`(`chat_id`),
                FOREIGN KEY (`qa_id`) REFERENCES `qa`(`qa_id`)
            );
            """
        )

        # exam table
        self.cursor.execute(
            """
            CREATE TABLE exams (
                exam_id INT AUTO_INCREMENT PRIMARY KEY,
                exam_name VARCHAR(255) NOT NULL,
                exam_type VARCHAR(255) NOT NULL,
                exam_date DATETIME NOT NULL,
                exam_duration INT NOT NULL,
                enabled TINYINT(1) NOT NULL DEFAULT 1
            );
            """
        )

        # question table
        self.cursor.execute(
            """
            -- Table: question
            CREATE TABLE question (
                question_id INT AUTO_INCREMENT PRIMARY KEY,
                question_text TEXT,
                enabled TINYINT(1) NOT NULL DEFAULT 1
            );
            """
        )

        # exam_questions table
        self.cursor.execute(
            """
            CREATE TABLE exam_questions (
                exam_id INT NOT NULL,
                question_id INT NOT NULL,
                PRIMARY KEY (exam_id, question_id),
                FOREIGN KEY (exam_id) REFERENCES exams(exam_id),
                FOREIGN KEY (question_id) REFERENCES question(question_id)
            );
            """
        )

        # question_image table
        self.cursor.execute(
            """
            -- Table: question_image
            CREATE TABLE question_image (
                question_id INT NOT NULL,
                image_uuid CHAR(36) NOT NULL,
                enabled TINYINT(1) NOT NULL DEFAULT 1,
                PRIMARY KEY (question_id, image_uuid),
                FOREIGN KEY (question_id) REFERENCES question(question_id)
            );
            """
        )

        # option table
        self.cursor.execute(
            """
            -- Table: option
            CREATE TABLE `option` (
                option_id INT AUTO_INCREMENT PRIMARY KEY,
                option_text TEXT NOT NULL,
                is_correct TINYINT(1) NOT NULL DEFAULT 0,
                enabled TINYINT(1) NOT NULL DEFAULT 1
            );
            """
        )

        # question_option table
        self.cursor.execute(
            """
            -- Table: question_option (linking table)
            CREATE TABLE question_option (
                question_id INT NOT NULL,
                option_id INT NOT NULL,
                PRIMARY KEY (question_id, option_id),
                FOREIGN KEY (question_id) REFERENCES question(question_id),
                FOREIGN KEY (option_id) REFERENCES `option`(option_id)
            );
            """
        )

        # exam_submission table
        self.cursor.execute(
            """
            -- Table: exam_submission
            CREATE TABLE exam_submission (
                submission_id INT AUTO_INCREMENT PRIMARY KEY,
                exam_id INT NOT NULL,
                user_id INT NOT NULL,
                score INT NOT NULL,
                regraded_score INT DEFAULT NULL,
                submission_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (exam_id) REFERENCES exams(exam_id),
                FOREIGN KEY (user_id) REFERENCES user(user_id) -- Assumes a user table exists
            );
            """
        )

        # exam_submission_answer table
        self.cursor.execute(
            """
            -- Table: exam_submission_answer
            CREATE TABLE exam_submission_answer (
                submission_id INT NOT NULL,
                question_id INT NOT NULL,
                selected_option_id INT DEFAULT NULL,
                is_correct_at_submission TINYINT(1) NOT NULL DEFAULT 1,
                PRIMARY KEY (submission_id, question_id),
                FOREIGN KEY (submission_id) REFERENCES exam_submission(submission_id),
                FOREIGN KEY (question_id) REFERENCES question(question_id),
                FOREIGN KEY (selected_option_id) REFERENCES `option`(option_id)
            );
            """
        )

        # classes table
        self.cursor.execute(
            """
            CREATE TABLE class (
                class_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                classname VARCHAR(255) NOT NULL DEFAULT "New Class",
                enabled TINYINT(1) NOT NULL DEFAULT 1
            );
            """
        )

        # class user table
        self.cursor.execute(
            """
            CREATE TABLE class_user (
                class_id INT NOT NULL,
                user_id INT NOT NULL,
                role_id INT UNSIGNED NOT NULL,
                PRIMARY KEY (class_id, user_id),
                FOREIGN KEY (class_id) REFERENCES class(class_id),
                FOREIGN KEY (user_id) REFERENCES `user`(user_id),
                FOREIGN KEY (role_id) REFERENCES role(role_id)
            );
            """
        )

        # class Exam table
        self.cursor.execute(
            """
            CREATE TABLE class_exam (
                class_id INT NOT NULL,
                exam_id INT NOT NULL,
                PRIMARY KEY (class_id, exam_id),
                FOREIGN KEY (class_id) REFERENCES class(class_id),
                FOREIGN KEY (exam_id) REFERENCES exams(exam_id)
            );
            """
        )

        # tag table
        self.cursor.execute(
            """
            CREATE TABLE tag (
                tag_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(15) NOT NULL UNIQUE,
                description VARCHAR(255) NOT NULL,
                enabled TINYINT(1) NOT NULL DEFAULT TRUE
            );
            """
        )

        # question_tag table
        self.cursor.execute(
            """
            CREATE TABLE question_tag (
                question_id INT NOT NULL,
                tag_id INT NOT NULL,
                enabled TINYINT(1) NOT NULL DEFAULT TRUE,
                PRIMARY KEY (question_id, tag_id),
                FOREIGN KEY (question_id) REFERENCES question(question_id),
                FOREIGN KEY (tag_id) REFERENCES tag(tag_id)
            );
            """
        )

        self.connection.commit()

        # Admin account
        admin_username = str(self._ROOT_USERNAME)
        admin_password = str(self._ROOT_PASSWORD)

        import hashlib

        hashed_admin_password = hashlib.sha3_256(
            admin_password.encode("utf-8")
        ).hexdigest()
        self.logger.info(f"Root username: {admin_username}")
        self.logger.info(f"Root password: {hashed_admin_password}")

        self.cursor.execute(
            """
            INSERT INTO `role` (`role_name`) VALUES ("Admin"), ("Teacher"), ("TA"), ("Student");
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

        # Teacher
        self.cursor.execute(
            """
            INSERT INTO `user` (`username`, `role_id`) VALUES (%s, 2);
            """,
            ("Teacher",),
        )

        # TA
        self.cursor.execute(
            """
            INSERT INTO `user` (`username`, `role_id`) VALUES (%s, 3);
            """,
            ("TA",),
        )

        # Student
        self.cursor.execute(
            """
            INSERT INTO `user` (`username`, `role_id`) VALUES (%s, 4);
            """,
            ("Student",),
        )

        self.connection.commit()

        if self._DEBUG:
            # Teacher
            self.cursor.execute(
                """
                INSERT INTO `login` (user_id, password) VALUES (2, %s);
                """,
                (hashed_admin_password,),
            )

            # TA
            self.cursor.execute(
                """
                INSERT INTO `login` (user_id, password) VALUES (3, %s);
                """,
                (hashed_admin_password,),
            )

            # Student
            self.cursor.execute(
                """
                INSERT INTO `login` (user_id, password) VALUES (4, %s);
                """,
                (hashed_admin_password,),
            )
            self.connection.commit()

        self.logger.debug(pformat(f"Created MYSQL database {self._DATABASE}"))


class MySQLHandler(SetupMYSQL):
    def __init__(self) -> None:
        super().__init__()

    def query_role_id_by_user_id(self, user_id: int) -> int | None:
        """query the role id using user id

        Args:
            user_id: (int): role id

        Returns:
            int: role name
            None: not found
        """
        self.connection.ping(attempts=3)

        self.cursor.execute(
            """SELECT role_id FROM `user` WHERE user_id = %s""", (user_id,)
        )
        self.sql_query_logger()
        role_id = self.cursor.fetchone()

        self.logger.info(pformat(role_id))

        return role_id["role_id"] if role_id else None

    def query_role_id_by_role_name(self, role_name: str) -> int | None:
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

    def remove_expired_token(self, user_id: int) -> None:
        self.cursor.execute(
            """UPDATE login SET jwt = "" WHERE user_id = %s""",
            (user_id,),
        )
        self.commit()

    def verify_login_token(self, user_id: int, token: str) -> bool:
        self.connection.commit()
        self.cursor.execute(
            """SELECT jwt FROM login WHERE user_id = %s LIMIT 1;""", (user_id,)
        )
        self.sql_query_logger()
        result = self.cursor.fetchall()[0]

        self.logger.info((user_id, token, result))

        return result["jwt"] == token

    def create_user(
        self,
        username: str,
        hashed_password: str,
        role_name: Literal["User", "Admin"] = "User",
    ) -> int | bool:
        """
        Create a new user account.

        Returns:
            200: Success
            302: Username already exists
            500: Error during database commit
        """
        self.connection.ping(attempts=3)
        self.logger.debug(
            pformat(f"create_user {username} {hashed_password} {role_name}")
        )

        # Check if username already exists
        self.cursor.execute(
            "SELECT username FROM `user` WHERE username = %s", (username,)
        )
        self.sql_query_logger()
        if self.cursor.fetchone():
            return 302

        # Get role_id from role table
        self.cursor.execute(
            "SELECT role_id FROM `role` WHERE role_name = %s", (role_name,)
        )
        self.sql_query_logger()
        role_row = self.cursor.fetchone()

        if not role_row:
            self.logger.error(f"Role '{role_name}' not found in the database")
            return 500

        role_id = role_row["role_id"]

        # Insert user into `user` table
        self.cursor.execute(
            """
            INSERT INTO `user` (username, role_id)
            VALUES (%s, %s)
            """,
            (username, role_id),
        )

        user_id = self.cursor.lastrowid

        # Insert hashed password into `login` table
        self.cursor.execute(
            """
            INSERT INTO `login` (user_id, password)
            VALUES (%s, %s)
            """,
            (user_id, hashed_password),
        )
        result = self.commit()
        # Commit all DB changes
        if result:
            return 200
        return 500

    def insert_login_token(self, user_id: int, jwt_token: str) -> bool:
        """
        Insert or update a JWT token for a specific user in the login table.

        Args:
            user_id (int): The unique identifier of the user.
            jwt_token (str): The JSON Web Token (JWT) to be associated with the user.

        Returns:
            bool: True if the token was successfully inserted/updated, False otherwise.
        """
        self.logger.info(f"insert_login_token {user_id}")

        self.cursor.execute(
            """
            UPDATE login
            SET jwt = %s
            WHERE user_id = %s
            """,
            (jwt_token, user_id),
        )
        result = self.commit()

        return True if result else False

    def get_user_info(
        self, username: str, hashed_password: str
    ) -> tuple[int, UserInfoModel] | tuple[int, str]:
        """
        Retrieve user information from the database based on username and hashed password.

        This function checks if the provided username and hashed password match a user
        in the database. If a match is found, it returns the user"s information.

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
                last_login=str(temp_fetch["last_login"]),
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

    def insert_image(self, chat_id: str, qa_id: str, image_uuid: str):
        """
        Insert a new image record into the database.
        """

    def insert_chatting(
        self,
        chat_id: str,
        qa_id: str,
        question: str,
        answer: str,
        token_size: int,
        user_id: int,
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

        self.logger.debug(
            pformat(
                {
                    "chat_id": chat_id,
                    "qa_id": qa_id,
                    "question": question,
                    "answer": answer,
                    "token_size": token_size,
                    "user_id": user_id,
                    "file_ids": file_ids,
                }
            )
        )

        self.cursor.execute(
            f"""
            INSERT IGNORE INTO `{self._DATABASE}`.`chat` (chat_id, user_id, chat_name)
            VALUES (
                %s, %s, %s
            );""",
            (chat_id, user_id, answer[:10]),
        )

        success = self.commit()
        assert success

        self.cursor.execute(
            f"""
            INSERT INTO `{self._DATABASE}`.`qa` (chat_id, qa_id, question, answer, token_size, sent_by)
            VALUES (
                %s, %s, %s, %s, %s, %s
            );
        """,
            (chat_id, qa_id, question, answer, token_size, user_id),
        )

        success = self.commit()
        assert success

        if file_ids is not None:
            for file_id in set(file_ids):
                self.cursor.execute(
                    f"""
                    INSERT INTO `{self._DATABASE}`.`attachment` (chat_id, qa_id, file_id)
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
    #         FROM {self._DATABASE}.file
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
            This method pings the database connection before executing the query to ensure it"s active.
        """
        self.connection.ping(attempts=3)

        self.logger.info(pformat("query docs name {docs_id}"))
        self.cursor.execute(
            f"""SELECT file_name
            FROM {self._DATABASE}.file
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
            This method pings the database connection before executing the query to ensure it"s active.
        """
        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""SELECT file_id, file_name, last_update
                FROM {self._DATABASE}.file
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

    def query_mock_exam_list(
        self, mock_type: Literal["basic", "cse", "all"] | None
    ) -> list[ExamsInfoModel]:
        """
        This function queries the database for a list of mock exams, including nested details for exam questions and options.
        It pings the database connection, executes a SQL query that aggregates exam data into a JSON structure, logs the query,
        and then parses the JSON string into a dictionary. If no exam information is found, it returns None.

        Args:
            (None): This function does not require any arguments besides self.

        Return:
            dict or None: A dictionary containing exam information with nested exam questions and options, or None if no exam records are found.
        """

        self.connection.ping(attempts=3)
        if not mock_type or mock_type == "all":
            self.cursor.execute(
                """
                SELECT JSON_ARRAYAGG(exam_data) AS exam_info
                FROM (
                    SELECT JSON_OBJECT(
                        "exam_id", e.exam_id,
                        "exam_name", e.exam_name,
                        "exam_type", e.exam_type,
                        "exam_date", e.exam_date,
                        "exam_duration", e.exam_duration,
                        "exam_questions", (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    "question_id", eq.question_id,
                                    "question_text", eq.question_text,
                                    "question_images", (
                                        SELECT JSON_ARRAYAGG(ei.question_images)
                                        FROM exam_images ei
                                        WHERE ei.question_id = eq.question_id AND ei.enabled = 1
                                    ),
                                    "question_options", (
                                        SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                "option_id", eo.option_id,
                                                "option_text", eo.option_text,
                                                "is_correct", eo.is_correct
                                            )
                                        )
                                        FROM exam_options eo
                                        WHERE eo.question_id = eq.question_id
                                    )
                                )
                            )
                            FROM exam_questions eq
                            WHERE eq.exam_id = e.exam_id AND eq.enabled = 1
                            ORDER BY eq.question_id DESC
                        )
                    ) AS exam_data
                    FROM exams e
                    WHERE e.enabled = 1
                ) sub;
                """
            )
            self.sql_query_logger()
        elif mock_type == "basic":
            self.cursor.execute(
                """
                SELECT JSON_ARRAYAGG(exam_data) AS exam_info
                FROM (
                    SELECT JSON_OBJECT(
                        "exam_id", e.exam_id,
                        "exam_name", e.exam_name,
                        "exam_type", e.exam_type,
                        "exam_date", e.exam_date,
                        "exam_duration", e.exam_duration,
                        "exam_questions", (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    "question_id", eq.question_id,
                                    "question_text", eq.question_text,
                                    "question_images", (
                                        SELECT JSON_ARRAYAGG(ei.question_images)
                                        FROM exam_images ei
                                        WHERE ei.question_id = eq.question_id AND ei.enabled = 1
                                    ),
                                    "question_options", (
                                        SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                "option_id", eo.option_id,
                                                "option_text", eo.option_text,
                                                "is_correct", eo.is_correct
                                            )
                                        )
                                        FROM exam_options eo
                                        WHERE eo.question_id = eq.question_id
                                    )
                                )
                            )
                            FROM exam_questions eq
                            WHERE eq.exam_id = e.exam_id AND eq.enabled = 1 AND e.exam_type = "basic"
                            ORDER BY eq.question_id DESC
                        )
                    ) AS exam_data
                    FROM exams e
                    WHERE e.enabled = 1
                ) sub;
                """
            )
            self.sql_query_logger()
        elif mock_type == "cse":
            self.cursor.execute(
                """
                SELECT JSON_ARRAYAGG(exam_data) AS exam_info
                FROM (
                    SELECT JSON_OBJECT(
                        "exam_id", e.exam_id,
                        "exam_name", e.exam_name,
                        "exam_type", e.exam_type,
                        "exam_date", e.exam_date,
                        "exam_duration", e.exam_duration,
                        "exam_questions", (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    "question_id", eq.question_id,
                                    "question_text", eq.question_text,
                                    "question_images", (
                                        SELECT JSON_ARRAYAGG(ei.question_images)
                                        FROM exam_images ei
                                        WHERE ei.question_id = eq.question_id AND ei.enabled = 1
                                    ),
                                    "question_options", (
                                        SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                "option_id", eo.option_id,
                                                "option_text", eo.option_text,
                                                "is_correct", eo.is_correct
                                            )
                                        )
                                        FROM exam_options eo
                                        WHERE eo.question_id = eq.question_id
                                    )
                                )
                            )
                            FROM exam_questions eq
                            WHERE eq.exam_id = e.exam_id AND eq.enabled = 1 AND e.exam_type = "cse"
                            ORDER BY eq.question_id DESC
                        )
                    ) AS exam_data
                    FROM exams e
                    WHERE e.enabled = 1
                ) sub;
                """
            )
            self.sql_query_logger()

        fetch_data = self.cursor.fetchall()
        self.logger.info(fetch_data)

        if fetch_data[0]["exam_info"] is None:
            return []

        exam_data = json.loads(fetch_data[0]["exam_info"])
        self.logger.info(exam_data)

        # Example return
        # [
        #     {
        #         "exam_id": 1,
        #         "exam_date": "2025-03-14 00:00:00.000000",
        #         "exam_name": "test",
        #         "exam_type": "basic",
        #         "exam_duration": 10,
        #         "exam_questions": [
        #             {
        #                 "question_id": 1,
        #                 "question_text": "1 + 1 = ?",
        #                 "question_images": ["4d865974-84c0-4688-a7b6-0d8c9429236d"],
        #                 "question_options": [
        #                     {"option_id": 1, "is_correct": 0, "option_text": "4"},
        #                     {"option_id": 2, "is_correct": 0, "option_text": "3"},
        #                     {"option_id": 3, "is_correct": 1, "option_text": "2"},
        #                     {"option_id": 4, "is_correct": 0, "option_text": "1"},
        #                 ],
        #             },
        #             {
        #                 "question_id": 2,
        #                 "question_text": "Which shape is round?",
        #                 "question_images": null,
        #                 "question_options": [
        #                     {
        #                         "option_id": 5,
        #                         "is_correct": 0,
        #                         "option_text": "Rectangle",
        #                     },
        #                     {
        #                         "option_id": 6,
        #                         "is_correct": 0,
        #                         "option_text": "Triangle",
        #                     },
        #                     {"option_id": 7, "is_correct": 1, "option_text": "Circle"},
        #                     {"option_id": 8, "is_correct": 0, "option_text": "Square"},
        #                 ],
        #             },
        #             {
        #                 "question_id": 3,
        #                 "question_text": "Which color is the sky on a clear day?",
        #                 "question_images": null,
        #                 "question_options": [
        #                     {"option_id": 9, "is_correct": 0, "option_text": "Red"},
        #                     {"option_id": 10, "is_correct": 0, "option_text": "Purple"},
        #                     {"option_id": 11, "is_correct": 1, "option_text": "Blue"},
        #                     {"option_id": 12, "is_correct": 0, "option_text": "Green"},
        #                 ],
        #             },
        #             {
        #                 "question_id": 4,
        #                 "question_text": "Which shape has three sides?",
        #                 "question_images": null,
        #                 "question_options": [
        #                     {"option_id": 13, "is_correct": 0, "option_text": "Square"},
        #                     {"option_id": 14, "is_correct": 0, "option_text": "Circle"},
        #                     {
        #                         "option_id": 15,
        #                         "is_correct": 1,
        #                         "option_text": "Rectangle",
        #                     },
        #                     {
        #                         "option_id": 16,
        #                         "is_correct": 0,
        #                         "option_text": "Triangle",
        #                     },
        #                 ],
        #             },
        #         ],
        #     }
        # ]

        exam_info_data = [
            ExamsInfoModel(
                exam_id=exam["exam_id"],
                exam_name=exam["exam_name"],
                exam_type=exam["exam_type"],
                exam_date=str(exam["exam_date"]),
                exam_duration=exam["exam_duration"],
                exam_questions=[
                    ExamQuestionModel(
                        exam_id=exam["exam_id"],
                        question_id=question["question_id"],
                        question_text=question["question_text"],
                        question_options=[
                            ExamOptionModel(
                                option_id=option["option_id"],
                                question_id=question["question_id"],
                                option_text=option["option_text"],
                                is_correct=option["is_correct"],
                            )
                            for option in (question.get("question_options") or [])
                        ],
                        question_images=question["question_images"],
                    )
                    for question in (exam.get("exam_questions") or [])
                    if question.get("question_options")
                ],
            )
            for exam in exam_data
        ]
        self.logger.info(pformat(exam_info_data))

        return exam_info_data

    def query_mock_exam(self, mock_type: Literal["basic", "cse"] | None) -> dict | None:
        self.connection.ping(attempts=3)

        self.cursor.execute(
            """
            SELECT exam_id, exam_name, exam_type, exam_duration FROM exams
            WHERE exam_type = %s AND enabled = True;
        """,
            (mock_type,),
        )

        self.sql_query_logger()
        return self.cursor.fetchall()

    def insert_new_mock_exam(self, exam: CreateNewExamParamsModel) -> ExamsInfoModel:
        """
        This function inserts a new exam record into the exams table in the database.
        It pings the database connection, executes the INSERT SQL query with exam details,
        logs the executed query, commits the transaction, and retrieves the newly inserted exam information.

        Args:
            exam: CreateNewExamParamsModel - A model containing exam details such as exam_name, exam_type, exam_date, and exam_duration.

        Return:
            ExamsInfoModel - A model representing the inserted exam with its exam_id, exam_name, exam_type, exam_date, exam_duration,
                             and an empty list for exam_questions.
        """

        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""
            INSERT INTO {self._DATABASE}.exams(
                exam_name,
                exam_type,
                exam_date,
                exam_duration
            )
            VALUES ( %s, %s, (STR_TO_DATE(%s, '%m/%d/%Y, %l:%i:%s %p')), %s)
            """,
            (
                exam.exam_name,
                exam.exam_type,
                exam.exam_date,
                exam.exam_duration,
            ),
        )
        self.sql_query_logger()
        self.commit()

        # fetch back
        self.cursor.execute("SELECT LAST_INSERT_ID() AS last_id;")
        last_id = self.cursor.fetchone()["last_id"]
        self.logger.info(last_id)

        # Finally, use last_id to select the row
        self.cursor.execute(
            """
            SELECT exam_id, exam_name, exam_type, exam_date, exam_duration
            FROM exams
            WHERE exam_id = %s
            """,
            (last_id,),
        )
        inserted_exam_info = self.cursor.fetchone()
        self.logger.info(inserted_exam_info)

        # exam table
        # exam_id
        # exam_name
        # exam_type
        # exam_date
        # exam_duration
        return ExamsInfoModel(
            exam_id=inserted_exam_info["exam_id"],
            exam_name=inserted_exam_info["exam_name"],
            exam_type=inserted_exam_info["exam_type"],
            exam_date=str(inserted_exam_info["exam_date"]),
            exam_duration=inserted_exam_info["exam_duration"],
            exam_questions=[],
        )

    def insert_new_mock_question(
        self, question: CreateNewQuestionParamsModel
    ) -> ExamQuestionModel:
        """
        This function inserts a new mock question into the exam_questions table.
        It pings the database connection, executes an INSERT SQL query using the provided question data,
        logs the SQL query, commits the transaction, and then retrieves the inserted question information.

        Args:
            question: CreateNewQuestionParamsModel - A model containing the exam_id and question_text for the new question.

        Return:
            ExamQuestionModel - A model representing the inserted question with its question_id, exam_id, question_text,
                                and placeholders for question_options and question_images.
        """

        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""
            INSERT INTO {self._DATABASE}.exam_questions(
                exam_id,
                question_text
            )
            VALUES ( %s, %s)
            """,
            (
                question.exam_id,
                question.question_text,
            ),
        )

        self.sql_query_logger()
        self.commit()

        # fetch back
        self.cursor.execute(
            f"""
            SELECT
                question_id,
                exam_id,
                question_text
            FROM {self._DATABASE}.exam_questions
            WHERE exam_id= %s AND question_text = %s
            """,
            (
                question.exam_id,
                question.question_text,
            ),
        )
        inserted_question_info = self.cursor.fetchone()

        return ExamQuestionModel(
            exam_id=inserted_question_info["exam_id"],
            question_id=inserted_question_info["question_id"],
            question_text=inserted_question_info["question_text"],
            question_options=None,
            question_images=None,
        )

    def insert_new_mock_options(
        self, options: list[CreateNewOptionParamsModel]
    ) -> list[ExamOptionModel]:
        """
        This function inserts new mock options for exam questions into the exam_options table.
        It performs a bulk insert using the provided list of options, logs the executed query, commits the transaction,
        and then retrieves the newly inserted options based on the first option"s parameters. Finally, it returns the inserted options as a list of ExamOptionModel instances.

        Args:
            options: list[CreateNewOptionParamsModel] - A list of option parameter models containing question_id, option_text, and is_correct flag.

        Return:
            list[ExamOptionModel] - A list of exam option models representing the newly inserted options.
        """

        self.connection.ping(attempts=3)
        new_options = [
            (option.question_id, option.option_text, option.is_correct)
            for option in options
        ]
        self.cursor.executemany(
            f"""
            INSERT INTO {self._DATABASE}.exam_options(
                question_id,
                option_text,
                is_correct
            )
            VALUES (%s, %s, %s)
            """,
            new_options,
        )
        self.sql_query_logger()
        self.commit()

        self.cursor.execute(
            f"""
            SELECT *
            FROM {self._DATABASE}.exam_options
            WHERE question_id=%s AND option_text = %s AND is_correct = %s
            ORDER BY option_id DESC;
            """,
            (
                options[0].question_id,
                options[0].option_text,
                options[0].is_correct,
            ),
        )

        inserted_option_info = self.cursor.fetchall()
        self.logger.debug(inserted_option_info)

        return [
            ExamOptionModel(
                option_id=option["option_id"],
                question_id=option["question_id"],
                option_text=option["option_text"],
                is_correct=option["is_correct"],
            )
            for option in inserted_option_info
        ]

    def modify_question(
        self, question: ExamQuestionModel, image_uuids: list[str] | None
    ) -> bool:
        """
        This function modifies a question record in the database by updating its text, options, and optionally its associated images.

        Args:
            question: ExamQuestionModel - The question object containing updated text, options, and identifier.
            images_path: list[str] | None - A list of new image paths to associate with the question. If provided, existing images will be deleted and replaced.

        Return:
            bool - True if the modification was successful; False otherwise.
        """

        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""
            UPDATE {self._DATABASE}.exam_questions
            SET question_text=%s
            WHERE question_id=%s
            """,
            (question.question_text, question.question_id),
        )

        self.sql_query_logger()

        # update options
        if question.question_options:
            new_options_data = [
                (
                    option.option_text,
                    option.is_correct,
                    question.question_id,
                    option.option_id,
                )
                for option in question.question_options
            ]
            self.cursor.executemany(
                f"""
                UPDATE {self._DATABASE}.exam_options
                SET option_text= %s, is_correct = %s
                WHERE question_id= %s AND option_id = %s
                """,
                new_options_data,
            )
            self.sql_query_logger()

        if not image_uuids:
            return self.commit()

        # Update images
        self.cursor.execute(
            f"""
            UPDATE {self._DATABASE}.exam_images
            SET enabled=0
            WHERE question_id=%s;
            """,
            (question.question_id,),
        )
        self.sql_query_logger()
        self.commit()

        for image_uuid in image_uuids:
            self.cursor.execute(
                f"""
                INSERT INTO {self._DATABASE}.exam_images(
                    question_id,
                    question_images
                )
                VALUES ( %s, %s)
                """,
                (question.question_id, image_uuid),
            )
            self.sql_query_logger()
        return self.commit()

    def enable_exam(self, exam_id: int) -> bool:
        """
        This function enable an exam record from the exam table in the database.
        It pings the database connection, executes the deletion SQL query, logs the SQL query, and commits the transaction.

        Args:
            exam_id: int - The unique identifier of the exam to be deleted.

        Return:
            bool - True if the deletion was successful and the transaction was committed; False otherwise.
        """
        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""
            UPDATE {self._DATABASE}.exam
            SET enabled=0
            WHERE exam_id=%s
            """,
            (exam_id,),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    def disable_exam(self, exam_id: int) -> bool:
        """
        This function disable an exam record from the exam table in the database.
        It pings the database connection, executes the deletion SQL query, logs the SQL query, and commits the transaction.

        Args:
            exam_id: int - The unique identifier of the exam to be deleted.

        Return:
            bool - True if the deletion was successful and the transaction was committed; False otherwise.
        """
        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""
            UPDATE {self._DATABASE}.exam
            SET enabled=1
            WHERE exam_id=%s
            """,
            (exam_id,),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    def delete_exam(self, exam_id: int) -> bool:
        """
        Deletes an exam record from the database.

        This method pings the database connection to ensure it"s active, executes a DELETE SQL statement to remove the exam with the specified exam_id from the exam table in the configured database, logs the SQL query, and then commits the transaction.

        Parameters: exam_id(int): The unique identifier of the exam to be deleted.

        Returns: bool: True if the deletion was successful and the transaction was committed; False otherwise.
        """
        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""
            DELETE FROM {self._DATABASE}.exam
            WHERE exam_id=%s
            """,
            (exam_id,),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    def disable_question(self, question_id: int) -> bool:
        """
        Disables a question in the database by setting its "enabled" status to 1.

        Args:
            question_id(int): The unique identifier of the question to be disabled.

        Returns:
            bool: Returns True if the question is successfully disabled, False otherwise.
        """
        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""
            UPDATE {self._DATABASE}.exam_questions
            SET enabled=1
            WHERE question_id=%s
            """,
            (question_id,),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    def delete_question(self, question_id: int) -> bool:
        """
        Deletes a question from the database based on the provided question ID.

        Args:
            question_id(int): The ID of the question to be deleted.

        Returns:
            bool: Returns True if the question is successfully deleted, False otherwise.
        """
        self.connection.ping(attempts=3)
        self.cursor.execute(
            f"""
            DELETE FROM {self._DATABASE}.exam_questions
            WHERE question_id=%s
            """,
            (question_id,),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    def get_mock_exam_question_list(
        self, mock_id: int
    ) -> tuple[list[MockExamQuestionsListModel], MockExamInformationModel | None]:
        """
        Retrieves a list of mock exam questions based on the provided mock_id.
        """

        self.connection.ping(attempts=3)
        self.cursor.execute(
            """
            SELECT 
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                    "exam_id",      s.exam_id,
                    "question_id",  s.question_id,
                    "question_text",s.question_text,
                    "question_options", s.question_options,
                    "question_images",  s.question_images
                    )
                ) AS exam_data
                FROM
                (
                SELECT
                    q.exam_id,
                    q.question_id,
                    q.question_text,
                    
                    JSON_ARRAYAGG(
                    JSON_OBJECT(
                        "option_id", o.option_id,
                        "question_id", o.question_id,
                        "option_text", o.option_text
                    )
                    ) AS question_options,
                    
                    (
                    SELECT JSON_ARRAYAGG(i.question_images)
                    FROM exam_images AS i
                    WHERE i.question_id = q.question_id
                    ) AS question_images
                    
                FROM exam_questions AS q
                LEFT JOIN exam_options AS o
                        ON q.question_id = o.question_id
                WHERE q.exam_id = %s AND q.enabled = 0
                GROUP BY q.exam_id, q.question_id, q.question_text
                ) AS s;
            """,
            (mock_id,),
        )

        mock_exam_question_list = self.cursor.fetchall()[0]["exam_data"]

        self.logger.debug(pformat(mock_exam_question_list))

        if not mock_exam_question_list:
            return [], None

        mock_exam_question_list = json.loads(mock_exam_question_list)

        mock_exam_question_list_data: list[MockExamQuestionsListModel] = []
        for question in mock_exam_question_list:
            mock_exam_question_options_list_data: list[
                MockExamQuestionsOptionListModel
            ] = []
            for option in question["question_options"]:
                mock_exam_question_options_list_data.append(
                    MockExamQuestionsOptionListModel(
                        option_id=option["option_id"],
                        question_id=option["question_id"],
                        option_text=option["option_text"],
                    )
                )
            image_list = question["question_images"] or []
            mock_exam_question_list_data.append(
                MockExamQuestionsListModel(
                    exam_id=question["exam_id"],
                    question_id=question["question_id"],
                    question_text=question["question_text"],
                    question_options=mock_exam_question_options_list_data,
                    question_images=image_list,
                )
            )

        self.logger.debug(mock_exam_question_list_data)
        # [
        #     {
        #         "exam_id": 1,
        #         "question_id": 1,
        #         "question_text": "1 + 1 = ?",
        #         "question_images": None,
        #         "question_options": [
        #             {"option_id": 4, "option_text": "1", "question_id": 1},
        #             {"option_id": 3, "option_text": "2", "question_id": 1},
        #             {"option_id": 2, "option_text": "3", "question_id": 1},
        #             {"option_id": 1, "option_text": "4", "question_id": 1},
        #         ],
        #     }
        # ]

        self.cursor.execute(
            """
            SELECT 
                exam_id,
                exam_name,
                exam_type,
                exam_date,
                exam_duration
            FROM exams as e 
            WHERE exam_id = %s
            """,
            (mock_id,),
        )

        mock_exam_information = self.cursor.fetchall()

        self.logger.debug(pformat(mock_exam_information))

        if mock_exam_information[0] is None:
            return [], None
        mock_exam_information = mock_exam_information[0]

        mock_exam_information_data: MockExamInformationModel = MockExamInformationModel(
            exam_id=mock_exam_information["exam_id"],
            exam_name=mock_exam_information["exam_name"],
            exam_type=mock_exam_information["exam_type"],
            exam_date=str(mock_exam_information["exam_date"]),
            exam_duration=mock_exam_information["exam_duration"],
        )

        return mock_exam_question_list_data, mock_exam_information_data

    def insert_mock_exam_submitted_question(
        self, exam: SubmittedExamModel
    ) -> int | None:
        """
        Inserts a submitted exam question into the database.
        Args:
            class SubmittedExamModel(BaseModel):
                exam_id: int
                user_id: int | None
                submit_time: str
                submitted_questions: list[SubmittedQuestionModel]

            class SubmittedQuestionModel(BaseModel):
                question_id: int
                submitted_answer: str
        Returns:
            submission_id: int or None

        """

        self.cursor.execute(
            """
            INSERT INTO exam_submission (exam_id, user_id, submission_time)
            VALUES (%s, %s, NOW())
            """,
            (exam.exam_id, exam.user_id),
        )
        self.sql_query_logger()
        _submission_id = self.cursor.lastrowid

        if _submission_id is None:
            return None

        # Insert submitted answers and track scoring
        correct_count = 0
        total_questions = len(exam.submitted_questions)

        for question in exam.submitted_questions:
            self.cursor.execute(
                """
                INSERT INTO exam_submission_answers (submission_id, question_id, selected_option_id)
                VALUES (%s, %s, %s)
                """,
                (
                    _submission_id,
                    question.question_id,
                    question.submitted_answer_option_id,
                ),
            )

            # Retrieve the correct option for the question
            self.cursor.execute(
                """
                SELECT option_id FROM exam_options 
                WHERE question_id = %s AND is_correct = 1
                """,
                (question.question_id,),
            )
            correct_option = self.cursor.fetchone()

            # Check if the submitted answer is correct
            if (
                correct_option
                and correct_option[0] == question.submitted_answer_option_id
            ):
                correct_count += 1

        # Calculate the score and percentage
        score = correct_count
        score_percentage = (
            (correct_count / total_questions) * 100 if total_questions > 0 else 0.0
        )

        # Update the score and score percentage in the exam_submission table
        self.cursor.execute(
            """
            UPDATE exam_submission
            SET score = %s, score_percentage = %s
            WHERE submission_id = %s
            """,
            (score, round(score_percentage, 2), _submission_id),
        )

        self.sql_query_logger()
        self.commit()

        return _submission_id

    def query_mock_exam_results(self, submission_id: int) -> ExamResultModel | None:
        """
        Retrieve the results of a submitted mock exam.
        Args:
            submission_id: int
        Returns:
            class ExamResultModel(BaseModel):
                exam_id: int
                submission_id: int
                user_id: int | None = 0
                exam_name: str
                exam_type: ExamType
                exam_date: str
                total_correct_answers: int
                score_percentage: float
        """

        self.cursor.execute(
            """
            SELECT 
                e.exam_id,
                s.submission_id,
                COALESCE(s.user_id, 0) AS user_id,
                e.exam_name,
                e.exam_type,
                DATE_FORMAT(e.exam_date, '%Y-%m-%d %H:%i:%s') AS exam_date,
                SUM(
                    CASE
                        WHEN o.is_correct = 1 THEN 1
                        ELSE 0
                    END
                ) AS total_correct_answers,
                (
                    SUM(
                        CASE
                            WHEN o.is_correct = 1 THEN 1
                            ELSE 0
                        END
                    ) / COUNT(q.question_id)
                ) * 100 AS score_percentage
            FROM exam_submission s
                JOIN exams e ON s.exam_id = e.exam_id
                JOIN exam_questions q ON e.exam_id = q.exam_id
                LEFT JOIN exam_submission_answers a ON s.submission_id = a.submission_id
                AND q.question_id = a.question_id
                LEFT JOIN exam_options o ON a.selected_option_id = o.option_id
            WHERE s.submission_id = %s
            GROUP BY 
                e.exam_id,
                s.submission_id,
                s.user_id,
                e.exam_name,
                e.exam_type,
                e.exam_date;
            """,
            (submission_id,),
        )

        self.sql_query_logger()
        fetch_data = self.cursor.fetchall()

        self.logger.debug(pformat(fetch_data))
        if not fetch_data:
            return None
        fetch_data = fetch_data[0]
        self.logger.debug(pformat(fetch_data))

        return ExamResultModel(
            exam_id=fetch_data["exam_id"],
            submission_id=fetch_data["submission_id"],
            user_id=fetch_data["user_id"],
            exam_name=fetch_data["exam_name"],
            exam_type=fetch_data["exam_type"],
            exam_date=fetch_data["exam_date"],
            total_correct_answers=fetch_data["total_correct_answers"],
            score_percentage=fetch_data["score_percentage"],
        )

    def create_tag(self, tag_name: str, tag_description: str) -> bool:
        self.cursor.execute(
            """
            INSERT INTO tag (name, description) VALUES (%s, %s);
            """,
            (tag_name, tag_description),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    def disable_tag(self, tag_id: int) -> bool:
        self.cursor.execute(
            """
            UPDATE tag SET enable = FALSE
            WHERE tag_id = %s;
            """,
            (tag_id,),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    def query_tag(self, tag_id: int) -> TagModel | None:
        self.cursor.execute(
            """
            SELECT tag_id, name, description FROM tag WHERE enable = TRUE AND tag_id = %s;
            """,
            (tag_id,),
        )

        self.sql_query_logger()
        fetch_data = self.cursor.fetchall()

        if not fetch_data:
            return None

        self.logger.debug(pformat(fetch_data))
        return fetch_data

    def query_tag_list(self) -> list[TagModel]:
        self.cursor.execute(
            """
            SELECT tag_id, name, description FROM tag WHERE enable = TRUE;
            """,
        )
        self.sql_query_logger()
        fetch_data = self.cursor.fetchall()

        if not fetch_data:
            return []
        self.logger.debug(pformat(fetch_data))
        return [
            TagModel(
                tag_id=tag["tag_id"],
                name=tag["name"],
                description=tag["description"],
            )
            for tag in fetch_data
        ]

    def add_question_tag(self, question_id: int, tag_id: int) -> bool:
        self.cursor.execute(
            """
            INSERT INTO question_tag (question_id, tag_id) VALUES (%s, %s);
            """,
            (question_id, tag_id),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    def remove_question_tag(self, question_id: int, tag_id: int) -> bool:
        self.cursor.execute(
            """
            UPDATE question_tag SET enable = FALSE
            WHERE tag_id = %s AND question_id = %s;
            """,
            (tag_id, question_id),
        )

        self.sql_query_logger()
        success = self.commit()

        return success

    # logger
    def sql_query_logger(self) -> None:
        """Log sql query"""
        self.logger.debug(pformat(f"Committed SQL query: {str(self.cursor.statement)}"))

    def commit(self, close_connection: bool = False) -> bool:
        """
        Commit a database transaction and optionally close the connection.

        This method attempts to commit the current transaction to the database.
        If the commit fails, it will rollback the transaction. It also provides
        an option to close the database connection after the commit operation.

        Args:
            close_connection(bool, optional): If True, closes the database connection
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


mysql_client = MySQLHandler()

if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv("./Backend/.env")
    MySQLHandler()
