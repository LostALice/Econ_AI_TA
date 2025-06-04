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
            WITH ExamQuestionCounts AS (
                SELECT
                    eq.exam_id,
                    COUNT(DISTINCT eq.question_id) AS total_questions_in_exam
                FROM
                    exam_questions AS eq
                JOIN
                    question AS q ON eq.question_id = q.question_id
                WHERE
                    q.enabled = 1
                GROUP BY
                    eq.exam_id
            )
            SELECT
                es.submission_id,
                cu.class_id,
                c.classname,
                es.user_id,
                u.username,
                es.exam_id,
                e.exam_name,
                e.exam_type,
                e.exam_date,
                es.submission_time,
                es.score,
                eqc.total_questions_in_exam
            FROM
                exam_submission AS es
            JOIN
                exams AS e ON es.exam_id = e.exam_id
            JOIN 
                class_user cu ON es.user_id = cu.user_id
            JOIN 
                class c ON cu.class_id = c.class_id
            JOIN 
                `user` u ON es.user_id = u.user_id
            LEFT JOIN
                ExamQuestionCounts AS eqc ON es.exam_id = eqc.exam_id
            WHERE
                e.enabled = 1
                --     AND es.exam_id = 9
                --     AND es.user_id = 2
                AND es.submission_id = %s
            ORDER BY
                es.exam_id, es.user_id, es.submission_time;
            """,
            (submission_id,),
        )
        fetch_data = self.database.cursor.fetchone()
        self.logger.info(fetch_data)

        return MockResult(
            submission_id=fetch_data["submission_id"],
            class_id=fetch_data["class_id"],
            classname=fetch_data["classname"],
            user_id=fetch_data["user_id"],
            username=fetch_data["username"],
            exam_id=fetch_data["exam_id"],
            exam_name=fetch_data["exam_name"],
            exam_type=fetch_data["exam_type"],
            exam_date=fetch_data["exam_date"].isoformat(),
            submission_time=fetch_data["submission_time"].isoformat(),
            score=fetch_data["score"],
            total_question=fetch_data["total_questions_in_exam"],
        )

    def query_mock_exam_result_by_exam(self, exam_id: int) -> list[MockResult]:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            WITH ExamQuestionCounts AS (
                SELECT
                    eq.exam_id,
                    COUNT(DISTINCT eq.question_id) AS total_questions_in_exam
                FROM
                    exam_questions AS eq
                JOIN
                    question AS q ON eq.question_id = q.question_id
                WHERE
                    q.enabled = 1
                GROUP BY
                    eq.exam_id
            )
            SELECT
                es.submission_id,
                cu.class_id,
                c.classname,
                es.user_id,
                u.username,
                es.exam_id,
                e.exam_name,
                e.exam_type,
                e.exam_date,
                es.submission_time,
                es.score,
                eqc.total_questions_in_exam
            FROM
                exam_submission AS es
            JOIN
                exams AS e ON es.exam_id = e.exam_id
            JOIN 
                class_user cu ON es.user_id = cu.user_id
            JOIN 
                class c ON cu.class_id = c.class_id
            JOIN 
                `user` u ON es.user_id = u.user_id
            LEFT JOIN
                ExamQuestionCounts AS eqc ON es.exam_id = eqc.exam_id
            WHERE
                e.enabled = 1
                AND es.exam_id = %s
                -- AND cu.class_id = 1
                -- AND es.user_id = 2
            ORDER BY
                es.exam_id, es.user_id, es.submission_time;
            """,
            (exam_id,),
        )
        fetch_data = self.database.cursor.fetchall()
        self.logger.info(fetch_data)

        return [
            MockResult(
                submission_id=data["submission_id"],
                class_id=data["class_id"],
                classname=data["classname"],
                user_id=data["user_id"],
                username=data["username"],
                exam_id=data["exam_id"],
                exam_name=data["exam_name"],
                exam_type=data["exam_type"],
                exam_date=data["exam_date"].isoformat(),
                submission_time=data["submission_time"].isoformat(),
                score=data["score"],
                total_question=data["total_questions_in_exam"],
            )
            for data in fetch_data
        ]

    def query_mock_exam_result_by_class(self, class_id: int) -> list[MockResult]:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            WITH ExamQuestionCounts AS (
                SELECT
                    eq.exam_id,
                    COUNT(DISTINCT eq.question_id) AS total_questions_in_exam
                FROM
                    exam_questions AS eq
                JOIN
                    question AS q ON eq.question_id = q.question_id
                WHERE
                    q.enabled = 1
                GROUP BY
                    eq.exam_id
            )
            SELECT
                es.submission_id,
                cu.class_id,
                c.classname,
                es.user_id,
                u.username,
                es.exam_id,
                e.exam_name,
                e.exam_type,
                e.exam_date,
                es.submission_time,
                es.score,
                eqc.total_questions_in_exam
            FROM
                exam_submission AS es
            JOIN
                exams AS e ON es.exam_id = e.exam_id
            JOIN 
                class_user cu ON es.user_id = cu.user_id
            JOIN 
                class c ON cu.class_id = c.class_id
            JOIN 
                `user` u ON es.user_id = u.user_id
            LEFT JOIN
                ExamQuestionCounts AS eqc ON es.exam_id = eqc.exam_id
            WHERE
                e.enabled = 1
                -- AND es.exam_id = 9
                AND cu.class_id = %s
                -- AND es.user_id = 2
            ORDER BY
                es.exam_id, es.user_id, es.submission_time;
            """,
            (class_id,),
        )
        fetch_data = self.database.cursor.fetchall()
        self.logger.info(fetch_data)

        return [
            MockResult(
                submission_id=data["submission_id"],
                class_id=data["class_id"],
                classname=data["classname"],
                user_id=data["user_id"],
                username=data["username"],
                exam_id=data["exam_id"],
                exam_name=data["exam_name"],
                exam_type=data["exam_type"],
                exam_date=data["exam_date"].isoformat(),
                submission_time=data["submission_time"].isoformat(),
                score=data["score"],
                total_question=data["total_questions_in_exam"],
            )
            for data in fetch_data
        ]

    def query_mock_exam_result_by_user(self, user_id: int) -> list[MockResult]:
        self.database.connection.ping(attempts=3)
        self.database.cursor.execute(
            """
            WITH ExamQuestionCounts AS (
                SELECT
                    eq.exam_id,
                    COUNT(DISTINCT eq.question_id) AS total_questions_in_exam
                FROM
                    exam_questions AS eq
                JOIN
                    question AS q ON eq.question_id = q.question_id
                WHERE
                    q.enabled = 1
                GROUP BY
                    eq.exam_id
            )
            SELECT
                es.submission_id,
                cu.class_id,
                c.classname,
                es.user_id,
                u.username,
                es.exam_id,
                e.exam_name,
                e.exam_type,
                e.exam_date,
                es.submission_time,
                es.score,
                eqc.total_questions_in_exam
            FROM
                exam_submission AS es
            JOIN
                exams AS e ON es.exam_id = e.exam_id
            JOIN 
                class_user cu ON es.user_id = cu.user_id
            JOIN 
                class c ON cu.class_id = c.class_id
            JOIN 
                `user` u ON es.user_id = u.user_id
            LEFT JOIN
                ExamQuestionCounts AS eqc ON es.exam_id = eqc.exam_id
            WHERE
                e.enabled = 1
                -- AND cu.class_id = 1
                -- AND es.exam_id = 9
                AND es.user_id = %s
            ORDER BY
                es.exam_id, es.user_id, es.submission_time;
            """,
            (user_id,),
        )
        fetch_data = self.database.cursor.fetchall()
        self.logger.info(fetch_data)

        return [
            MockResult(
                submission_id=data["submission_id"],
                class_id=data["class_id"],
                classname=data["classname"],
                user_id=data["user_id"],
                username=data["username"],
                exam_id=data["exam_id"],
                exam_name=data["exam_name"],
                exam_type=data["exam_type"],
                exam_date=data["exam_date"].isoformat(),
                submission_time=data["submission_time"].isoformat(),
                score=data["score"],
                total_question=data["total_questions_in_exam"],
            )
            for data in fetch_data
        ]
