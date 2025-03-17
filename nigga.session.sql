SELECT e.exam_id,
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
WHERE s.submission_id = 1
GROUP BY e.exam_id,
    s.submission_id,
    s.user_id,
    e.exam_name,
    e.exam_type,
    e.exam_date;