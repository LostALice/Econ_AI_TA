[![wakatime](https://wakatime.com/badge/user/09ce4786-a8a5-43eb-8a65-50ad8684b5da/project/0ea3f1ad-2fa9-407b-807a-d28050e46eb5.svg)](https://wakatime.com/badge/user/09ce4786-a8a5-43eb-8a65-50ad8684b5da/project/0ea3f1ad-2fa9-407b-807a-d28050e46eb5)
```mermaid
flowchart TD 
    subgraph "Presentation Layer"
        FE["Frontend (Next.js Application)"]:::frontend
        ACTX["Auth Context"]:::auth
    end

    subgraph "Business Logic Layer"
        BE["Backend (Python API & Business Logic)"]:::backend
        API["API Endpoints (chat,authorization,documentation,mock)"]:::backend
        AUTH["Authorization API"]:::auth
    end

    subgraph "Data & Integration Layer"
        DB1["Database Ops (utils)"]:::data
        DB2["Database Ops (helper/model)"]:::data
        RAG["RAG Utilities"]:::integration
        RAG_HELP["RAG Helper (model)"]:::integration
        LLM["LLM & Embedding Integration"]:::integration
    end

    subgraph "Deployment Layer"
        BE_DOCK["Backend Docker Deployment"]:::deploy
        FE_DOCK["Frontend Docker Deployment"]:::deploy
    end

    U["User"]:::user

    %% Connections
    U -->|"uses"| FE
    FE -->|"callsAPI"| BE
    FE -->|"handlesAuth"| ACTX
    ACTX -->|"syncsWith"| AUTH
    BE -->|"routesTo"| API
    BE -->|"performsCRUD"| DB1
    BE -->|"performsCRUD"| DB2
    BE -->|"processesWith"| RAG
    RAG -->|"assists"| RAG_HELP
    RAG -->|"integrates"| LLM
    BE -->|"securedBy"| AUTH
    FE -->|"deployedIn"| FE_DOCK
    BE -->|"deployedIn"| BE_DOCK

    FE_DOCK -.-> FE
    BE_DOCK -.-> BE

    %% Click Events
    click FE "https://github.com/lostalice/econ_ai_ta/tree/main/Frontend/"
    click BE "https://github.com/lostalice/econ_ai_ta/tree/main/Backend/"
    click API "https://github.com/lostalice/econ_ai_ta/tree/main/Backend/api/v1/"
    click DB1 "https://github.com/lostalice/econ_ai_ta/tree/main/Backend/utils/database/"
    click DB2 "https://github.com/lostalice/econ_ai_ta/tree/main/Backend/utils/helper/model/database/"
    click RAG "https://github.com/lostalice/econ_ai_ta/tree/main/Backend/utils/RAG/"
    click RAG_HELP "https://github.com/lostalice/econ_ai_ta/tree/main/Backend/utils/helper/model/RAG/"
    click LLM "https://github.com/lostalice/econ_ai_ta/blob/main/Backend/utils/RAG/vector_extractor.py"
    click AUTH "https://github.com/lostalice/econ_ai_ta/blob/main/Backend/api/v1/authorization.py"
    click ACTX "https://github.com/lostalice/econ_ai_ta/blob/main/Frontend/contexts/AuthContext.tsx"
    click BE_DOCK "https://github.com/lostalice/econ_ai_ta/tree/main/Backend/dockerfile"
    click FE_DOCK "https://github.com/lostalice/econ_ai_ta/tree/main/Frontend/dockerfile"

    %% Styles
    classDef frontend fill:#AED6F1,stroke:#1B4F72,stroke-width:2px;
    classDef backend fill:#F9E79F,stroke:#7D6608,stroke-width:2px;
    classDef data fill:#A9DFBF,stroke:#145A32,stroke-width:2px;
    classDef integration fill:#F5B7B1,stroke:#78281F,stroke-width:2px;
    classDef deploy fill:#D6EAF8,stroke:#2874A6,stroke-width:2px;
    classDef auth fill:#FAD7A0,stroke:#7D6608,stroke-width:2px;
    classDef user fill:#D2B4DE,stroke:#512E5F,stroke-width:2px;
```

# FCU LLM

## 逢甲大學經濟學智能TA

### Feature
- [x] 班別系統 
- [x] 智能TA對話
- [x] 模擬考試
  - [x] 大一經濟學原理
  - [x] 公務員高普考
  - [x] 成績查詢
- [x] 教師上傳檔案
  - [ ] 標籤系統
- [ ] 學習目標選擇
  - [ ] 大一經濟學原理
  - [ ] 公務員高普考
- [x] 語言切換(i18n)

## Upload log

- 31/1/2025 
  - finished Mock Exam

## Backend .env File Documentation
### Development
| Parameter | Value |
| --------- | ----- |
| DEBUG     | True  |

### main.py
| Parameter           | Value |
| ------------------- | ----- |
| CORS_ALLOWED_ORIGIN |       |

### Database
| Parameter        | Value            |
| ---------------- | ---------------- |
| Debug            | True             |
| Host             | localhost        |
| User Name        | root             |
| Password         | example_password |
| Database         | FCU              |
| Port             | 3306             |
| Connection Retry | 3                |
| Root Username    | root             |
| Root Password    | example_password |

### Authentication
| Parameter | Value          |
| --------- | -------------- |
| Secret    | example_secret |
| Algorithm | HS256          |

### LLM and Embedding
| Deploy Mode           | Value                  |
| --------------------- | ---------------------- |
| LLM_DEPLOY_MODE       | openai                 |
| EMBEDDING_DEPLOY_MODE | text-embedding-3-small |

### AFS
| Parameter       | Value             |
| --------------- | ----------------- |
| API_URL         |                   |
| API_KEY         |                   |
| Model Name      | ffm               |
| Embedding Model | mxbai-embed-large |

### Ollama
| Parameter       | Value             |
| --------------- | ----------------- |
| Host            | http://localhost  |
| Port            | 11434             |
| Main Model      | llama3.2:3b       |
| Embedding Model | mxbai-embed-large |

### Openai
| Parameter  | Value                  |
| ---------- | ---------------------- |
| API_KEY    | <long string>          |
| Model Name | gpt-4o-mini            |
| Embedding  | text-embedding-3-small |

### Milvus
| Parameter        | Value     |
| ---------------- | --------- |
| Debug            | True      |
| Host             | localhost |
| Port             | 19530     |
| Vector Dimension | 1536      |


### Frontend .env file
| **Section** | **Variable**           | **Value**                    |
| ----------- | ---------------------- | ---------------------------- |
| **API URL** | NEXT_PUBLIC_API_URL    | http://localhost:8000/api/v1 |
|             | NEXT_PUBLIC_DEBUG_MODE | true                         |
