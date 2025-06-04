```mermaid
graph TD
    A[首頁] --> B[智能TA對話界面主視窗-done]
    A --> C[功能選單]
    A --> D[回饋功能]
    B --> E[使用者提問區]
    B --> F[回答顯示區]
    C --> G[學習目標選擇]
    C --> H[模擬考試入口]
    C --> I[教師上傳檔案區]
    C --> J[其他設置]
    G --> K[大一經濟學原理公務員高普考]
    J --> L[帳號資訊偏好設定]
    D --> M[評價本次回答品質]
    D --> N[問題回報意見回饋]
    D --> O[線上客服聯繫]
    M --> P[星級或表情符號]
    N --> Q[簡易表單]
```

```mermaid
erDiagram
    ROLE {
      INT role_id PK "Auto Increment"
      VARCHAR role_name
    }
    
    USER {
      INT user_id PK "Auto Increment"
      VARCHAR username
      INT role_id FK
    }
    
    LOGIN {
      INT user_id PK
      VARCHAR password
      VARCHAR jwt "Default: ``"
      TIMESTAMP last_login "Default: NOW()"
    }
    
    CHAT {
      VARCHAR chat_id PK
      INT user_id FK
      VARCHAR chat_name
    }
    
    FILE {
      VARCHAR file_id PK
      VARCHAR collection PK "Default: 'default'"
      VARCHAR file_name
      TIMESTAMP last_update "Default: NOW()"
      TINYINT expired "Default: 0"
      JSON tags "Default: JSON_OBJECT()"
    }
    
    QA {
      VARCHAR chat_id PK
      VARCHAR qa_id PK
      LONGTEXT question
      VARCHAR images
      LONGTEXT answer
      INT token_size "Default: 0"
      TINYINT rating
      TIMESTAMP sent_time "Default: CURRENT_TIMESTAMP"
      VARCHAR sent_by
    }
    
    ATTACHMENT {
      VARCHAR chat_id
      VARCHAR qa_id PK
      VARCHAR file_id PK
    }
    
    IMAGES {
      VARCHAR chat_id
      VARCHAR qa_id PK
      VARCHAR images_file_id PK
    }
    
    %% Relationships
    ROLE ||--o{ USER : "assigned to"
    USER ||--|| LOGIN : "has"
    USER ||--o{ CHAT : "creates"
    CHAT ||--o{ QA : "contains"
    CHAT ||--o{ ATTACHMENT : "has"
    CHAT ||--o{ IMAGES : "has"
    QA ||--o{ ATTACHMENT : "linked"
    QA ||--o{ IMAGES : "has"
    FILE ||--o{ ATTACHMENT : "attached in"

```

# Backend API

## Authentication

## POST /api/v1/authentication/login/

```python

Authenticate a user and generate a JWT token upon successful login.

This function handles the user login process. It verifies the provided credentials, generates a JWT token for authenticated users, and stores the token in the database.

Args: login_form (LoginFormModel): An object containing the user's login credentials. It includes the following attributes: - username (str): The user's username. - hashed_password (str): The hashed password of the user.

Returns: Union[LoginFormSuccessModel, LoginFormUnsuccessModel]: - If login is successful, returns a LoginFormSuccessModel containing: - status_code (int): HTTP status code (200 for success). - success (bool): True for successful login. - jwt_token (str): The generated JWT token. - role (str): The role of the authenticated user. - If login fails, returns a LoginFormUnsuccessModel containing: - status_code (int): HTTP status code indicating the error. - success (bool): False for failed login. - response (int): The error status code.

Raises: HTTPException: - 500 status code if there's an unknown issue during token insertion. - 401 status code if the credentials are unrecognized.

```

- #### Parameters

    - username: string

    - password: string

- #### Responses

    - status_code: integer

    - success: boolean

## POST /api/v1/authentication/signup/

```python

Register a new user with the provided username and password.

This function handles the user registration process. It hashes the provided password using SHA3-256 algorithm and attempts to create a new user in the database.

Args: username (str): The desired username for the new user account. password (str): The password for the new user account (will be hashed before storage).

Returns: SingUpSuccessModel: An object containing: - status_code (int): HTTP status code (200 for success). - success (bool): True if the user was successfully created.

Raises: HTTPException: - 500 status code if there's an internal server error during user creation.
```

- #### Parameters

    - username: string

    - password: string

- #### Responses

    - status_code: integer

    - success: boolean

---

## Chatroom API

## GET /api/v1/authentication/signup/

```python

Generates uuid for a new chatroom.

Returns: uuid: String

```

## POST /api/v1/chatroom/rating/

```python
Update the rating for a specific answer in the chatroom.

This function receives a rating for an answer, updates it in the database, and returns the status of the operation.

Args: rating_model (RatingModel): A model containing the rating information. It includes: - question_uuid (str): The unique identifier of the question. - rating (bool): The rating given to the answer (True for positive, False for negative).

Returns: AnswerRatingModel: A model containing the result of the rating operation. It includes: - status_code (int): HTTP status code (200 for success). - success (bool): Indicates whether the rating update was successful.

Raises: HTTPException: If there's an internal server error (status code 500).
```

- #### Request body
    - question_uuid: string
    - rating: Boolean
- #### Responses
    - status_code: integer
    - success: boolean

## POST /api/v1/chatroom/{chat_id}/

```python
Ask the question and return the answer from RAG

Args: Args: chat_id (str): chatroom uuid question (str): question content user_id (str): user id collection (str, optional): collection of docs database. Defaults to "default". language (str): language for the response

Returns: answer: response of the question server_status_code: 200 | 500
```

- #### Request body
    - chat_id: string
    - user_id: string
    - language: string = "CHINESE"
    - collection: string = "default"
    - question: \[string\]
- #### Responses
    - status_code: integer
    - question_uuid: string
    - answer: string
    - files: list\[string\]

---

# Documentation

## GET /api/v1/documentation/{docs_id}

```python
Retrieve and return a specific document file based on its unique identifier.

This function fetches the document file associated with the provided docs_id from the file system and returns it as a FileResponse. It also handles error cases such as empty requests or non-existent files.

Args: docs_id (str): The unique identifier of the document to retrieve.

Returns: FileResponse: A FileResponse object containing the requested document file.

Raises: HTTPException: - 422 status code if the docs_id is empty. - 500 status code if the UUID format is incorrect or the file is not found.
```

- #### Parameters
    - docs_id: string
- #### Responses
    - FileResponse

## GET /api/v1/documentation/{documentation_type}

```python
Retrieve a list of documents based on the specified documentation type.

This function queries the database for documents matching the given documentation type and returns a list of these documents.

Args: documentation_type (str, optional): The type of documentation to retrieve. Defaults to "其他" (meaning "Other" in Chinese).

Returns: QueryDocumentListModel: A model containing the status code and the list of documents matching the specified type.

Raises: HTTPException: If no documents are found for the given documentation type.
```

- #### Parameters
    - documentation_type: str
- #### Responses
    - status_code
    - docs_list: list
        - file_id: string
        - file_name: string
        - last_update_time: string

## POST /api/v1/documentation/upload

```python
Upload a document file, process its content, and store it in the database.

This function handles the upload of a document file, splits its content, generates vector representations, and stores the information in both MySQL and Milvus databases.

Args: docs_file (UploadFile): The uploaded document file. tags (Annotated[list[str], Form()]): A list of tags associated with the document. docs_format (str, optional): The format of the document. Defaults to "docx". collection (str, optional): The name of the collection to store the document in. Defaults to "default".

Returns: FileUploadSuccessModel: A model containing the status code and the UUID of the uploaded file.

Raises: HTTPException: If there's an error in file type, format, or database operations.
```

- #### Parameters
    - docs_format: string
    - collection: string
- #### Request body
    - docs_file: File object
    - tags: list
        - tag: string
- #### Responses
    - status_code: integer
    - file_id: string

---

```sql
CREATE TABLE exams (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(255) NOT NULL,
    exam_date DATETIME NOT NULL,
    exam_duration INT NOT NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE question (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT,
    enabled TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE exam_questions (
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    PRIMARY KEY (exam_id, question_id),
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id),
    FOREIGN KEY (question_id) REFERENCES question(question_id)
);
CREATE TABLE question_image (
    question_id INT NOT NULL,
    image_uuid CHAR(36) NOT NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (question_id, image_uuid),
    FOREIGN KEY (question_id) REFERENCES question(question_id)
);
CREATE TABLE `option` (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    option_text TEXT NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    enabled TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE question_option (
    question_id INT NOT NULL,
    option_id INT NOT NULL,
    PRIMARY KEY (question_id, option_id),
    FOREIGN KEY (question_id) REFERENCES question(question_id),
    FOREIGN KEY (option_id) REFERENCES `option`(option_id)
);
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
```