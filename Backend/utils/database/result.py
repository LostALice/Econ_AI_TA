# Code by AkinoAlice@TyrantRey

from Backend.utils.database.database import mysql_client
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.helper.model.api.v1.result import MockResult


class ResultDatabaseController:
    def __init__(
        self,
    ) -> None:
        self.database = mysql_client
        self.logger = CustomLoggerHandler().get_logger()

    def query_mock_exam_result(self, submission_id: int) -> MockResult:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            SELECT 
                es.submission_id,
                es.exam_id,
                es.user_id,
                e.exam_name, 
                e.exam_type,
                e.exam_date,
                es.score,
                COUNT(o.option_id) AS total_question
            FROM 
                exams AS e
                JOIN exam_submission AS es ON es.exam_id = e.exam_id
                JOIN exam_questions eq ON e.exam_id = eq.exam_id
                JOIN question q ON eq.question_id = q.question_id
                JOIN question_option qo ON q.question_id = qo.question_id
                JOIN `option` o ON qo.option_id = o.option_id
            WHERE
                e.enabled = 1
                AND q.enabled = 1
                AND o.enabled = 1
                AND o.is_correct = 1
                AND es.submission_id = %s
            GROUP BY
                es.submission_id,
                es.exam_id,
                es.user_id,
                e.exam_name, 
                e.exam_type,
                e.exam_date,
                es.score;
            """,
            (submission_id,),
        )
        fetch_data = self.database.cursor.fetchone()
        self.logger.info(fetch_data)

        return MockResult(
            submission_id=fetch_data["submission_id"],
            exam_id=fetch_data["exam_id"],
            user_id=fetch_data["user_id"],
            exam_name=fetch_data["exam_name"],
            exam_type=fetch_data["exam_type"],
            exam_date=fetch_data["exam_date"].isoformat(),
            score=fetch_data["score"],
            total_question=fetch_data["total_question"],
        )
