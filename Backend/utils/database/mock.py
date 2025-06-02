from Backend.utils.database.database import mysql_client
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.helper.model.api.v1.mock import (
    MOCK_TYPE,
    TagModel,
    ExamsModel,
    QuestionModel,
    OptionModel,
    QuestionImageModel,
)

from datetime import datetime
from pathlib import Path
import base64


class MockerDatabaseController:
    def __init__(
        self,
    ) -> None:
        self.database = mysql_client
        self.logger = CustomLoggerHandler().get_logger()

    def query_mock_exam_list(
        self, mock_type: MOCK_TYPE, user_id: int
    ) -> list[ExamsModel]:
        self.database.connection.ping(attempts=3)

        if mock_type == "all":
            self.database.cursor.execute(
                """
                SELECT
                    e.exam_id,
                    e.exam_name,
                    e.exam_type,
                    e.exam_date,
                    e.exam_duration
                    -- Add any other exam details you need
                FROM
                    class_user AS cu
                JOIN
                    class AS c ON cu.class_id = c.class_id
                JOIN
                    class_exam AS ce ON c.class_id = ce.class_id
                JOIN
                    exams AS e ON ce.exam_id = e.exam_id
                WHERE
                    cu.user_id = %s
                    AND c.enabled = 1
                    AND e.enabled = 1;
            """,
                (user_id,),
            )

        else:
            self.database.cursor.execute(
                """
                SELECT
                    e.exam_id,
                    e.exam_name,
                    e.exam_type,
                    e.exam_date,
                    e.exam_duration
                    -- Add any other exam details you need
                FROM
                    class_user AS cu
                JOIN
                    class AS c ON cu.class_id = c.class_id
                JOIN
                    class_exam AS ce ON c.class_id = ce.class_id
                JOIN
                    exams AS e ON ce.exam_id = e.exam_id
                WHERE
                    cu.user_id = %s
                    AND e.exam_type = %s
                    AND c.enabled = 1
                    AND e.enabled = 1;
            """,
                (user_id, mock_type),
            )

        fetch_data = self.database.cursor.fetchall()
        self.logger.info(fetch_data)

        return [
            ExamsModel(
                exam_id=exam["exam_id"],
                exam_name=exam["exam_name"],
                exam_type=exam["exam_type"],
                exam_date=exam["exam_date"],
                exam_duration=exam["exam_duration"],
            )
            for exam in fetch_data
        ]

    def insert_new_mock_exam(
        self,
        exam_name: str,
        exam_type: MOCK_TYPE,
        exam_date: datetime,
        exam_duration: int,
    ) -> int:
        self.database.connection.ping(attempts=3)

        self.database.cursor.execute(
            """
            INSERT INTO exams (
                exam_name, 
                exam_type, 
                exam_date, 
                exam_duration, 
                enabled
            ) VALUES (%s, %s, %s, %s, DEFAULT);
            """,
            (exam_name, exam_type, exam_date, exam_duration),
        )

        self.database.sql_query_logger()
        self.database.commit()

        self.database.cursor.execute("SELECT LAST_INSERT_ID() AS last_id;")
        last_id = self.database.cursor.fetchone()["last_id"]
        self.logger.info(last_id)
        return last_id

    def insert_class_exam(self, class_id: int, exam_id: int) -> bool:
        self.database.cursor.execute(
            """
            INSERT INTO class_exam (
                class_id,
                exam_id
            ) VALUES (%s, %s);
            """,
            (class_id, exam_id),
        )

        return self.database.commit()

    def insert_new_mock_exam_and_class(
        self,
        class_id: int,
        exam_name: str,
        exam_type: MOCK_TYPE,
        exam_date: datetime,
        exam_duration: int,
    ) -> int | None:
        self.database.connection.ping(attempts=3)
        try:
            self.database.cursor.execute(
                """
                INSERT INTO exams (exam_name, exam_type, exam_date, exam_duration, enabled)
                VALUES (%s, %s, %s, %s, DEFAULT);
                """,
                (exam_name, exam_type, exam_date, exam_duration),
            )
            self.database.sql_query_logger()

            self.database.cursor.execute("SELECT LAST_INSERT_ID() AS last_id;")
            self.database.sql_query_logger()
            new_exam_id = self.database.cursor.fetchone()["last_id"]
            self.logger.debug(new_exam_id)
            self.database.cursor.execute(
                """
                INSERT INTO class_exam (class_id, exam_id)
                VALUES (%s, %s);
                """,
                (class_id, new_exam_id),
            )

            self.database.commit()
            return new_exam_id
        except Exception as e:
            self.logger.error(e)
            self.database.connection.rollback()
            return None

    def insert_new_exam_question(self, exam_id: int, question_text: str) -> int | None:
        self.database.connection.ping(attempts=3)
        try:
            self.database.cursor.execute(
                """
                INSERT INTO question (question_text)
                VALUES (%s)
                """,
                (question_text,),
            )
            self.database.sql_query_logger()

            self.database.cursor.execute("SELECT LAST_INSERT_ID() AS last_id;")
            self.database.sql_query_logger()
            question_id = self.database.cursor.fetchone()["last_id"]
            self.logger.debug(question_id)
            self.database.cursor.execute(
                """
                INSERT INTO exam_questions (exam_id, question_id)
                VALUES (%s, %s)
                """,
                (exam_id, question_id),
            )

            self.database.commit()
            return question_id
        except Exception as e:
            self.logger.error(e)
            self.database.connection.rollback()
            return None

    def insert_new_exam_question_option(
        self, question_id: int, option_text: str, is_correct: bool
    ) -> int | None:
        self.database.connection.ping(attempts=3)
        try:
            self.database.cursor.execute(
                """
                INSERT INTO `option` (option_text, is_correct)
                VALUES (%s, %s)
                """,
                (option_text, is_correct),
            )
            self.database.sql_query_logger()

            self.database.cursor.execute("SELECT LAST_INSERT_ID() AS last_id;")
            self.database.sql_query_logger()
            option_id = self.database.cursor.fetchone()["last_id"]
            self.logger.debug(question_id)
            self.database.cursor.execute(
                """
                INSERT INTO question_option (question_id, option_id)
                VALUES (%s, %s)
                """,
                (question_id, option_id),
            )

            self.database.commit()
            return option_id
        except Exception as e:
            self.logger.error(e)
            self.database.connection.rollback()
            return None

    def insert_new_exam_question_image(self, question_id: int, image_uuid: str) -> bool:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            INSERT INTO question_image (question_id, image_uuid)
            VALUES (%s, %s)
            """,
            (question_id, image_uuid),
        )
        self.database.sql_query_logger()

        return self.database.commit()

    def disable_exam(self, exam_id: int) -> bool:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            UPDATE exams 
            SET enabled = FALSE
            WHERE exam_id = %s
            """,
            (exam_id,),
        )
        return self.database.commit()

    def disable_exam_question(self, question_id: int) -> bool:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            UPDATE question 
            SET enabled = FALSE
            WHERE question_id = %s
            """,
            (question_id,),
        )
        return self.database.commit()

    def disable_exam_question_option(self, option_id: int) -> bool:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            UPDATE `option` 
            SET enabled = FALSE
            WHERE option_id = %s
            """,
            (option_id,),
        )
        return self.database.commit()

    def disable_exam_question_image(
        self, exam_id: int, question_id: int, image_uuid: str
    ) -> bool:
        image_path = (
            Path("./images/mock/")
            / str(exam_id)
            / str(question_id)
            / (image_uuid + ".png")
        )
        file_content_to_restore = None
        try:
            self.database.connection.ping(attempts=3)

            if image_path.exists():
                with image_path.open("rb") as f:
                    file_content_to_restore = f.read()

                image_path.unlink()
                self.logger.debug(f"File deleted: {image_path}")
            else:
                self.logger.warning(
                    f"Attempted to disable non-existent file: {image_path}"
                )

            self.database.cursor.execute(
                """
                UPDATE question_image
                SET enabled = FALSE
                WHERE image_uuid = %s
                """,
                (image_uuid,),
            )
            self.database.sql_query_logger()

            self.database.connection.commit()
            return True
        except Exception as e:
            self.logger.error(f"Error disabling image and DB record: {e}")
            self.database.connection.rollback()

            if file_content_to_restore is not None:
                try:
                    image_path.parent.mkdir(parents=True, exist_ok=True)
                    with image_path.open("wb") as f:
                        f.write(file_content_to_restore)
                    self.logger.debug(
                        f"Restored file after failed DB transaction: {image_path}"
                    )
                except Exception as restore_e:
                    self.logger.error(
                        f"CRITICAL: Failed to restore file {image_path} after DB rollback: {restore_e}"
                    )
            return False

    def modify_exam(
        self,
        class_id: int,
        exam_id: int,
        exam_name: str,
        exam_type: MOCK_TYPE,
        exam_date: datetime,
        exam_duration: int,
    ) -> bool:
        self.database.connection.ping(attempts=3)
        try:
            self.database.cursor.execute(
                """
                UPDATE exams
                SET exam_name=%s, exam_type=%s, exam_date=%s, exam_duration=%s
                WHERE exam_id=%s;
                """,
                (exam_name, exam_type, exam_date, exam_duration, exam_id),
            )
            self.database.sql_query_logger()

            self.database.cursor.execute(
                """
                UPDATE class_exam 
                SET class_id=%s
                WHERE exam_id=%s;
                """,
                (class_id, exam_id),
            )

            return self.database.commit()
        except Exception as e:
            self.logger.error(e)
            self.database.connection.rollback()
            return False

    def modify_exam_question(self, question_id: int, question_text: str) -> bool:
        self.database.connection.ping(attempts=3)
        try:
            self.database.cursor.execute(
                """
                UPDATE question 
                SET question_text=%s
                WHERE question_id=%s
                """,
                (question_text, question_id),
            )
            self.database.sql_query_logger()
            return self.database.commit()
        except Exception as e:
            self.logger.error(e)
            self.database.connection.rollback()
            return False

    def modify_exam_question_option(
        self, option_id: int, option_text: str, is_correct: bool
    ) -> bool:
        self.database.connection.ping(attempts=3)
        try:
            self.database.cursor.execute(
                """
                UPDATE `option` 
                SET option_text=%s, is_correct=%s
                WHERE option_id=%s
                """,
                (option_text, is_correct, option_id),
            )
            self.database.sql_query_logger()
            return self.database.commit()
        except Exception as e:
            self.logger.error(e)
            self.database.connection.rollback()
            return False

    def modify_exam_question_image(
        self, exam_id: int, question_id: int, image_uuid: str, new_base64_image: str
    ) -> bool:
        """
        Modifies the content of an existing exam question image.
        Ensures atomicity across file system operations and database state.

        Args:
            exam_id (int): The ID of the exam.
            question_id (int): The ID of the question associated with the image.
            image_uuid (str): The UUID of the image to be modified.
            new_base64_image (str): The new image content as a base64 encoded string.

        Returns:
            bool: True if the image was successfully modified, False otherwise.
        """
        image_path = (
            Path("./images/mock/")
            / str(exam_id)
            / str(question_id)
            / (image_uuid + ".png")
        )

        file_content_to_restore = None

        self.database.connection.ping(attempts=3)

        try:
            if image_path.exists():
                with image_path.open("rb") as f:
                    file_content_to_restore = f.read()
                self.logger.debug(
                    f"Old image content read into buffer for {image_path}"
                )
            else:
                self.logger.warning(
                    f"Attempted to modify non-existent image file: {image_path}. Proceeding to write new file."
                )

            decoded_new_image = base64.b64decode(new_base64_image)

            if image_path.exists():
                image_path.unlink()
                self.logger.debug(f"Old file deleted: {image_path}")

            image_path.parent.mkdir(parents=True, exist_ok=True)
            with image_path.open("wb") as f:
                f.write(decoded_new_image)
            self.logger.debug(f"New file written: {image_path}")

            self.database.connection.commit()
            return True

        except Exception as e:
            self.logger.error(
                f"Error modifying image file for {image_uuid} (Exam: {exam_id}, Question: {question_id}): {e}"
            )

            self.database.connection.rollback()

            if file_content_to_restore is not None:
                try:
                    image_path.parent.mkdir(parents=True, exist_ok=True)
                    with image_path.open("wb") as f:
                        f.write(file_content_to_restore)
                    self.logger.warning(
                        f"Restored old file after failed modification operation: {image_path}"
                    )
                except Exception as restore_e:
                    self.logger.error(
                        f"CRITICAL: Failed to restore file {image_path} after primary operation rollback: {restore_e}"
                    )
            return False

    def query_exam_question(self, exam_id: int) -> list[QuestionModel]:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            SELECT 
                q.question_id,
                q.question_text
            FROM 
                question AS q
            JOIN 
                exam_questions as eq ON q.question_id = eq.question_id
            WHERE 
                eq.exam_id = %s
                AND q.enabled = 1
            """,
            (exam_id,),
        )

        fetch_data = self.database.cursor.fetchall()
        self.logger.info(fetch_data)

        return [
            QuestionModel(
                question_id=question["question_id"],
                question_text=question["question_text"],
            )
            for question in fetch_data
        ]

    def query_question_option(
        self, exam_id: int, question_id: int
    ) -> list[OptionModel]:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            SELECT
                o.option_id, o.option_text, o.is_correct
            FROM
                `option` AS o
            JOIN
                question_option AS qo ON o.option_id = qo.option_id
            JOIN
                exam_questions AS eq ON qo.question_id = eq.question_id -- Join to exam_questions
            WHERE
                eq.exam_id = %s
                AND qo.question_id = %s
                AND o.enabled = 1
            """,
            (exam_id, question_id),
        )

        fetch_data = self.database.cursor.fetchall()
        self.logger.info(fetch_data)

        return [
            OptionModel(
                option_id=option["option_id"],
                option_text=option["option_text"],
                is_correct=option["is_correct"],
            )
            for option in fetch_data
        ]

    def query_question_image(
        self, exam_id: int, question_id: int
    ) -> list[QuestionImageModel]:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            SELECT
                qi.question_id, qi.image_uuid
            FROM
                question_image AS qi
            JOIN
                exam_questions AS eq ON qi.question_id = eq.question_id -- Join to exam_questions
            WHERE
                eq.exam_id = %s
                AND qi.question_id = %s
                AND qi.enabled = 1
            """,
            (exam_id, question_id),
        )

        fetch_data = self.database.cursor.fetchall()
        self.logger.info(fetch_data)

        return [
            QuestionImageModel(
                question_id=image["question_id"],
                image_uuid=image["image_uuid"],
            )
            for image in fetch_data
        ]

    def query_tag_list(self) -> list[TagModel]:
        self.database.cursor.execute(
            """
            SELECT tag_id, name, description FROM tag WHERE enabled = TRUE;
            """,
        )
        self.database.sql_query_logger()
        fetch_data = self.database.cursor.fetchall()

        if not fetch_data:
            return []
        self.logger.debug(fetch_data)
        return [
            TagModel(
                tag_id=tag["tag_id"],
                name=tag["name"],
                description=tag["description"],
            )
            for tag in fetch_data
        ]

    def add_question_tag(self, question_id: int, tag_id: int) -> bool:
        self.database.cursor.execute(
            """
            INSERT INTO question_tag (question_id, tag_id) VALUES (%s, %s);
            """,
            (question_id, tag_id),
        )

        self.database.sql_query_logger()
        success = self.database.commit()

        return success

    def remove_question_tag(self, question_id: int, tag_id: int) -> bool:
        self.database.cursor.execute(
            """
            UPDATE question_tag SET enabled = FALSE
            WHERE tag_id = %s AND question_id = %s;
            """,
            (tag_id, question_id),
        )

        self.database.sql_query_logger()
        success = self.database.commit()

        return success

    def query_tag(self, tag_id: int) -> TagModel | None:
        self.database.cursor.execute(
            """
            SELECT tag_id, name, description FROM tag WHERE enabled = TRUE AND tag_id = %s;
            """,
            (tag_id,),
        )
        self.database.sql_query_logger()
        fetch_data = self.database.cursor.fetchall()

        if not fetch_data:
            return None
        self.logger.debug(fetch_data)

        return TagModel(
            tag_id=fetch_data[0]["tag_id"],
            name=fetch_data[0]["name"],
            description=fetch_data[0]["description"],
        )

    def create_tag(self, tag_name: str, tag_description: str) -> bool:
        self.database.cursor.execute(
            """
            INSERT INTO tag (name, description) VALUES (%s, %s);
            """,
            (tag_name, tag_description),
        )

        self.database.sql_query_logger()
        success = self.database.commit()

        return success

    def disable_tag(self, tag_id: int) -> bool:
        self.database.cursor.execute(
            """
            UPDATE tag SET enabled = FALSE
            WHERE tag_id = %s;
            """,
            (tag_id,),
        )

        self.database.sql_query_logger()
        success = self.database.commit()

        return success
