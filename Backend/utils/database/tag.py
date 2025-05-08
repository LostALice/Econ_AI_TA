self.cursor.execute(
    """
    CREATE TABLE tag (
        tag_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(15) NOT NULL UNIQUE,
        description VARCHAR(255) NOT NULL UNIQUE,
        enable TINYINT(1) NOT NULL DEFAULT TRUE
    );
    """
)

self.cursor.execute(
    """
    CREATE TABLE question_tag (
        question_tag_id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        tag_id INT NOT NULL,
        FOREIGN KEY (question_id) REFERENCES exam_questions(question_id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tag(tag_id) ON DELETE CASCADE
    );

    """
)


def create_tag(self, tag_name: str, tag_description: str) -> bool:
    self.cursor.execute(
        """
        INSERT INTO tag (name, description) VALUES (%s, %s);
        """,
        (tag_name, tag_description),
    )


def disable_tag(self, tag_id: int) -> bool:
    self.cursor.execute(
        """
        UPDATE tag SET enable = FALSE
        WHERE tag_id = %s;
        """,
        (tag_id,),
    )


def query_tag(self) -> list[dict]:
    self.cursor.execute(
        """
        SELECT tag_id, name, description FROM tag;
        """,
    )
