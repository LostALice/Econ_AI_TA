// Code by AkinoAlice@TyrantRey
// Code by wonmeow

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";
import { useState, useContext, Key, useRef, useEffect } from "react";
import { getCookie, hasCookie, setCookie } from "cookies-next";
import * as XLSX from 'xlsx'; // 引入 xlsx 庫

import {
  Listbox,
  ListboxItem,
  Spinner,
  Link,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  addToast,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Image
} from "@heroui/react";

import { LanguageTable } from "@/i18n";
import { LangContext } from "@/contexts/LangContext";
import { AuthContext } from "@/contexts/AuthContext";

import { IExcelQuestion, IDocContent, IDocsFormat } from "@/types/global";

import { FileUploadButton } from "@/components/upload/fileUpload-btn";

// Excel API 函數
import { fetchExcelFileList, uploadExcelFile, fetchExcelQuestions, deleteExcelFile, updateExcelQuestions } from "@/api/excel";

import { validateQuestion } from "@/utils/dataValidation";

// 統一的 Toast 消息管理
const TOAST_MESSAGES = {
  SUCCESS: {
    LOAD: "載入成功",
    UPLOAD: "上傳成功",
    SAVE: "儲存成功",
    DELETE: "刪除成功",
    UPDATE: "更新成功",
    ADD: "新增成功"
  },
  ERROR: {
    LOAD: "載入失敗，請稍後再試",
    UPLOAD: "上傳失敗",
    OPERATION: "操作失敗",
    FORMAT: "格式不支援，請使用 Excel 檔案"
  },
  WARNING: {
    NO_CONTENT: "暫無可用內容",
    FILE_NOT_FOUND: "找不到檔案",
    NO_CHAPTER: "請選擇章節",
    STORAGE_FULL: "存儲空間不足"
  },
  INFO: {
    PROCESSING: "處理中...",
    NO_CHANGES: "無需同步"
  }
};

// 用於在本地存儲模擬文件列表
const LOCAL_STORAGE_DOCS_KEY = "mock_docs_list";
const LOCAL_STORAGE_DOCS_CONTENT_KEY = "mock_docs_content";

// 顯示題目圖片的組件
const QuestionCard = ({ question }: { question: IExcelQuestion }) => {
  const safeQuestion = validateQuestion(question);

  return (
    <div className="bg-content1 shadow-md p-4 rounded-lg mb-4">
      {/* 顯示題目來源檔案 */}
      {safeQuestion.sourceFile && (
        <div className="mb-3 p-2 bg-content2 rounded-md">
          <div className="text-xs text-default-600">
            來源檔案: {safeQuestion.sourceFile}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="font-semibold mb-2">題目：</div>
        <div>{safeQuestion.question}</div>
      </div>

      {/* 支援多圖片顯示，優先使用新的 pictures 屬性 */}
      {((safeQuestion.pictures?.length ?? 0) > 0 || safeQuestion.picture) && (
        <div className="mb-4">
          <div className="font-semibold mb-2">圖片：</div>

          {/* 有多張圖片的情況 */}
          {safeQuestion.pictures && safeQuestion.pictures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {safeQuestion.pictures.map((picSrc, index) => (
                <div key={index} className="flex justify-center">
                  <Image
                    src={picSrc}
                    alt={`題目圖片 ${index + 1}`}
                    className="max-w-full max-h-64 object-contain border border-divider rounded-md"
                    onError={() => console.warn(`圖片載入失敗: ${picSrc}`)
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            /* 僅有單張圖片 */
            safeQuestion.picture && (
              <Image
                src={safeQuestion.picture}
                alt="題目圖片"
                className="max-w-full max-h-64 object-contain border border-divider rounded-md"
                onError={() => console.warn(`圖片載入失敗: ${safeQuestion.picture}`)}
              />
            )
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="font-semibold mb-2">選項：</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {safeQuestion.options.length > 0 ? (
            safeQuestion.options.map((option, index) => (
              <div key={index} className="flex items-start">
                <div className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</div>
                <div>{option || `選項 ${String.fromCharCode(65 + index)}`}</div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 col-span-2">此題目沒有可用選項</div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="font-semibold mb-2">答案：</div>
        <div>{safeQuestion.answer}</div>
      </div>

      <div>
        <div className="font-semibold mb-2">章節：</div>
        <div>{safeQuestion.category}</div>
      </div>
    </div>
  );
};

export default function DocsPage() {
  const { language } = useContext(LangContext);
  const { role, userInfo, isLoggedIn } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<IDocsFormat[]>([]);
  const [currentDocType, setCurrentDocType] = useState<string>("TESTING");

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editingFile, setEditingFile] = useState<IDocsFormat | null>(null);
  const [editFileName, setEditFileName] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 新增的狀態
  const [currentContent, setCurrentContent] = useState<IDocContent | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'questions' | 'chapterBrowse'>('list');
  const [editingQuestion, setEditingQuestion] = useState<IExcelQuestion | null>(null);
  const [editQuestionModal, setEditQuestionModal] = useState<boolean>(false);

  // 新增章節篩選相關狀態
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);

  // 新增：學生題庫選擇狀態
  const [selectedQuestionBank, setSelectedQuestionBank] = useState<string>("TESTING");

  // 新增：學生章節選擇相關狀態
  const [availableStudentChapters, setAvailableStudentChapters] = useState<string[]>([]);
  const [selectedStudentChapter, setSelectedStudentChapter] = useState<string>("");
  const [studentViewMode, setStudentViewMode] = useState<'bankSelection' | 'chapterSelection' | 'questions'>('bankSelection');

  // 新增：分頁相關狀態
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [questionsPerPage] = useState<number>(1); // 一題一頁

  // 新增：老師/助教章節瀏覽相關狀態
  const [teacherChapterViewMode, setTeacherChapterViewMode] = useState<'bankSelection' | 'chapterSelection' | 'questions'>('bankSelection');
  const [teacherSelectedQuestionBank, setTeacherSelectedQuestionBank] = useState<string>("TESTING");
  const [teacherAvailableChapters, setTeacherAvailableChapters] = useState<string[]>([]);
  const [teacherSelectedChapter, setTeacherSelectedChapter] = useState<string>("");

  // 檢查登入狀態
  useEffect(() => {
    const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language];
    if (userRole === LanguageTable.nav.role.unsigned[language]) {
      // 用戶未登入，不執行其他初始化邏輯
      return;
    }
  }, [language]);

  // 判斷是否為教師或助教
  const isTeacherOrTA =
    role === LanguageTable.login.role.teacher.en ||
    role === LanguageTable.login.role.ta.en ||
    role === LanguageTable.nav.role.admin.en;

  // 判斷是否為學生
  const isStudent = userInfo?.role === 'student' || role === LanguageTable.login.role.student[language];

  // 檢查是否未登入
  const isUnsigned = role === LanguageTable.nav.role.unsigned[language];

  // 學生題庫選項
  const studentQuestionBanks = [
    {
      key: "TESTING",
      label: "公務員高普考",
      description: "公務員考試相關題目"
    },
    {
      key: "THEOREM",
      label: "大一經濟學原理",
      description: "基礎經濟學理論題目"
    }
  ];

  // 輸出調試信息
  useEffect(() => {
    console.log("====== 角色狀態檢查 ======");
    console.log("DocsPage - Current role (display name):", role);
    console.log("DocsPage - userInfo:", userInfo);
    console.log("DocsPage - isTeacherOrTA:", isTeacherOrTA);
    console.log("DocsPage - isStudent:", isStudent);
    console.log("DocsPage - isLoggedIn:", isLoggedIn);
    console.log("DocsPage - 判斷條件:", {
      '是否有 userInfo': !!userInfo,
      'userInfo.role 值': userInfo?.role,
      '是否為 teacher': userInfo?.role === 'teacher',
      '是否為 ta': userInfo?.role === 'ta',
      '是否為 admin': userInfo?.role === 'admin',
      '是否為 student': userInfo?.role === 'student',
      '最終判斷結果': isTeacherOrTA
    });
    console.log("==========================");
  }, [role, userInfo, isTeacherOrTA, isStudent, isLoggedIn]);

  // 自動清理過期快取
  const clearExpiredCache = () => {
    try {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24小時

      // 檢查文件列表快取
      const docsData = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
      if (docsData) {
        const parsedDocs = JSON.parse(docsData);
        let hasExpired = false;

        // 檢查每個文件類型的快取時間
        for (const docType in parsedDocs) {
          if (Array.isArray(parsedDocs[docType])) {
            parsedDocs[docType] = parsedDocs[docType].filter((file: any) => {
              const fileTime = new Date(file.lastUpdate || file.uploadTime || 0).getTime();
              const isExpired = (now - fileTime) > oneDay;
              if (isExpired) hasExpired = true;
              return !isExpired;
            });
          }
        }

        if (hasExpired) {
          localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(parsedDocs));
          console.log("已清理過期的文件列表快取");
        }
      }

      // 檢查文件內容快取
      const contentData = localStorage.getItem(LOCAL_STORAGE_DOCS_CONTENT_KEY);
      if (contentData) {
        const parsedContent = JSON.parse(contentData);
        const validContent: any = {};

        for (const fileId in parsedContent) {
          const content = parsedContent[fileId];
          const contentTime = content.lastModified || content.uploadTime || 0;
          const isExpired = (now - contentTime) > oneDay;

          if (!isExpired) {
            validContent[fileId] = content;
          }
        }

        localStorage.setItem(LOCAL_STORAGE_DOCS_CONTENT_KEY, JSON.stringify(validContent));
        console.log("已清理過期的文件內容快取");
      }

    } catch (error) {
      console.error("清理過期快取時發生錯誤:", error);
    }
  };

  // 檢查快取有效性並自動管理
  const manageCacheAutomatically = () => {
    try {
      const lastSync = localStorage.getItem('last_cache_sync');
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000; // 2小時檢查一次

      if (!lastSync || (now - parseInt(lastSync)) > twoHours) {
        // 自動清理過期快取
        clearExpiredCache();
        localStorage.setItem('last_cache_sync', now.toString());

        // 檢查本地存儲使用量
        const storageUsage = JSON.stringify(localStorage).length;
        const maxStorage = 5 * 1024 * 1024; // 5MB限制

        if (storageUsage > maxStorage) {
          console.warn("本地存儲使用量過大，執行清理");
          clearOldestCache();
        }
      }
    } catch (error) {
      console.error("自動快取管理失敗:", error);
    }
  };

  // 清理最舊的快取項目
  const clearOldestCache = () => {
    try {
      const contentData = localStorage.getItem(LOCAL_STORAGE_DOCS_CONTENT_KEY);
      if (contentData) {
        const parsedContent = JSON.parse(contentData);
        const contentEntries = Object.entries(parsedContent);

        // 按時間排序，保留最新的50%
        contentEntries.sort((a: any, b: any) => {
          const timeA = a[1].lastModified || a[1].uploadTime || 0;
          const timeB = b[1].lastModified || b[1].uploadTime || 0;
          return timeB - timeA;
        });

        const keepCount = Math.floor(contentEntries.length * 0.5);
        const keptEntries = contentEntries.slice(0, keepCount);

        const newContent = Object.fromEntries(keptEntries);
        localStorage.setItem(LOCAL_STORAGE_DOCS_CONTENT_KEY, JSON.stringify(newContent));

        console.log(`已清理 ${contentEntries.length - keepCount} 個舊的快取項目`);
      }
    } catch (error) {
      console.error("清理舊快取失敗:", error);
    }
  };

  // 頁面載入時自動載入文件列表和管理快取
  useEffect(() => {
    if (isUnsigned) {
      return;
    }

    const manageCacheAutomatically = () => {
      try {
        const lastSync = localStorage.getItem('last_cache_sync');
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000; // 2小時檢查一次

        if (!lastSync || (now - parseInt(lastSync)) > twoHours) {
          // 自動清理過期快取
          clearExpiredCache();
          localStorage.setItem('last_cache_sync', now.toString());

          // 檢查本地存儲使用量
          const storageUsage = JSON.stringify(localStorage).length;
          const maxStorage = 5 * 1024 * 1024; // 5MB限制

          if (storageUsage > maxStorage) {
            clearOldestCache();
          }
        }
      } catch (error) {
        console.error("自動快取管理失敗:", error);
      }
    };

    const loadFileList = async (documentationType: string) => {
      setIsLoading(true);
      setCurrentDocType(documentationType);
      setViewMode('list'); // 重置視圖模式

      try {
        // 先嘗試從資料庫取得檔案列表
        const dbDocs = await fetchExcelFileList(documentationType);

        if (dbDocs && dbDocs.length > 0) {
          // 使用資料庫資料
          setFileList(dbDocs);
          addToast({
            color: "success",
            title: TOAST_MESSAGES.SUCCESS.LOAD,
            description: `已成功載入 ${dbDocs.length} 個${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
          });
        } else {
          // 嘗試載入本地緩存的資料作為備用
          const localDocs = loadLocalStorageDocsList(documentationType);

          if (localDocs && localDocs.length > 0) {
            setFileList(localDocs);
            addToast({
              color: "success",
              title: TOAST_MESSAGES.SUCCESS.LOAD,
              description: `已成功載入 ${localDocs.length} 個${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
            });
          } else {
            // 完全沒有資料
            setFileList([]);
            addToast({
              color: "primary",
              title: TOAST_MESSAGES.WARNING.NO_CONTENT,
              description: `請上傳${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
            });
          }
        }
      } catch (error) {
        console.error("Error loading file list:", error);

        // 嘗試從本地緩存載入資料作為備用
        const localDocs = loadLocalStorageDocsList(documentationType);

        if (localDocs && localDocs.length > 0) {
          setFileList(localDocs);
          addToast({
            color: "warning",
            title: TOAST_MESSAGES.WARNING.FILE_NOT_FOUND,
            description: "使用本地緩存資料替代",
          });
        } else {
          // 完全沒有資料
          setFileList([]);
          addToast({
            color: "danger",
            title: TOAST_MESSAGES.ERROR.LOAD,
            description: "無法載入文件列表，請稍後再試",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    // 自動管理快取
    manageCacheAutomatically();

    if (isStudent) {
      setStudentViewMode('bankSelection');
      setCurrentContent(null);
    } else {
      loadFileList(currentDocType);
      console.log("頁面載入，自動載入文件列表:", currentDocType);
    }
  }, [isStudent, isUnsigned, currentDocType]);

  // 每30分鐘檢查快取
  useEffect(() => {
    const manageCacheAutomatically = () => {
      try {
        const lastSync = localStorage.getItem('last_cache_sync');
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000; // 2小時檢查一次

        if (!lastSync || (now - parseInt(lastSync)) > twoHours) {
          // 自動清理過期快取
          clearExpiredCache();
          localStorage.setItem('last_cache_sync', now.toString());

          // 檢查本地存儲使用量
          const storageUsage = JSON.stringify(localStorage).length;
          const maxStorage = 5 * 1024 * 1024; // 5MB限制

          if (storageUsage > maxStorage) {
            console.warn("本地存儲使用量過大，執行清理");
            // 清理最舊的快取項目
            clearOldestCache();
          }
        }
      } catch (error) {
        console.error("自動快取管理失敗:", error);
      }
    };

    const interval = setInterval(() => {
      manageCacheAutomatically();
    }, 30 * 60 * 1000); // 30分鐘

    return () => clearInterval(interval);
  }, []);



  const documentationTypeList = [
    {
      key: "TESTING",
      label: LanguageTable.docs.page.testing[language],
    },
    {
      key: "THEOREM",
      label: LanguageTable.docs.page.theorem[language],
    },
  ];

  // 從本地存儲載入模擬文件列表
  const loadLocalStorageDocsList = (docType: string): IDocsFormat[] => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        return parsedData[docType] || [];
      }
    } catch (error) {
      console.error("Error loading docs from localStorage:", error);
    }
    return [];
  };

  // 保存模擬文件列表到本地存儲
  const saveLocalStorageDocsList = (docType: string, docs: IDocsFormat[]) => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
      const parsedData = storedData ? JSON.parse(storedData) : {};

      parsedData[docType] = docs;
      localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(parsedData));
    } catch (error) {
      console.error("Error saving docs to localStorage:", error);
    }
  };
  // 載入文件列表，從資料庫取得
  async function loadFileList(documentationType: string) {
    setIsLoading(true);
    setCurrentDocType(documentationType);
    setViewMode('list'); // 重置視圖模式

    try {
      // 先嘗試從資料庫取得檔案列表
      const dbDocs = await fetchExcelFileList(documentationType);

      if (dbDocs && dbDocs.length > 0) {
        // 使用資料庫資料
        setFileList(dbDocs);
        addToast({
          color: "success",
          title: TOAST_MESSAGES.SUCCESS.LOAD,
          description: `已成功載入 ${dbDocs.length} 個${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
        });
      } else {
        // 尚無資料，也可以嘗試載入本地緩存的資料作為備用
        const localDocs = loadLocalStorageDocsList(documentationType);

        if (localDocs && localDocs.length > 0) {
          setFileList(localDocs);
          addToast({
            color: "success",
            title: TOAST_MESSAGES.SUCCESS.LOAD,
            description: `已成功載入 ${localDocs.length} 個${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
          });
        } else {
          // 完全沒有資料
          setFileList([]);
          addToast({
            color: "primary",
            title: TOAST_MESSAGES.WARNING.NO_CONTENT,
            description: `請上傳${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
          });
        }
      }
    } catch (error) {
      console.error("Error loading file list:", error);

      // 嘗試從本地緩存載入資料作為備用
      const localDocs = loadLocalStorageDocsList(documentationType);

      if (localDocs && localDocs.length > 0) {
        setFileList(localDocs);
        addToast({
          color: "warning",
          title: TOAST_MESSAGES.WARNING.FILE_NOT_FOUND,
          description: "使用本地緩存資料替代",
        });
      } else {
        // 完全沒有資料
        setFileList([]);
        addToast({
          color: "danger",
          title: TOAST_MESSAGES.ERROR.LOAD,
          description: "無法載入文件列表，請稍後再試",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // 生成空的數據列表而不是模擬數據
  const generateMockData = (docType: string, count: number): IDocsFormat[] => {
    return []; // 返回空數組，不再生成模擬數據
  };

  const saveFileContent = (fileID: string, content: any) => {
    try {
      // 如果內容包含題目，確保每個題目的 options 都是陣列
      if (content.questions && Array.isArray(content.questions)) {
        content.questions = content.questions.map((q: any) => validateQuestion(q));
        console.log(`驗證並修正了 ${content.questions.length} 個題目的資料格式`);
      }

      const contentData = getFileContent("") || {};
      contentData[fileID] = content;

      // 簡單保存，如果失敗則記錄警告但不影響上傳流程
      try {
        localStorage.setItem(LOCAL_STORAGE_DOCS_CONTENT_KEY, JSON.stringify(contentData));
        console.log(`已臨時保存文件內容: ${fileID}`);
      } catch (error) {
        console.warn('localStorage 保存失敗，但不影響上傳:', error);

        // 如果是存儲配額錯誤，給用戶提示
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          addToast({
            color: "warning",
            title: TOAST_MESSAGES.WARNING.STORAGE_FULL,
            description: "檔案仍會正常上傳到資料庫，本地備份已跳過。",
          });
        }
      }

    } catch (error) {
      console.error("處理文件內容失敗:", error);
    }
  };

  const getFileContent = (fileID: string): any => {
    try {
      const contentData = localStorage.getItem(LOCAL_STORAGE_DOCS_CONTENT_KEY);
      if (contentData) {
        const parsedData = JSON.parse(contentData);
        if (fileID && parsedData[fileID]) {
          const content = parsedData[fileID];
          // 確保載入的題目資料格式正確
          if (content.questions && Array.isArray(content.questions)) {
            content.questions = content.questions.map((q: any) => validateQuestion(q));
            console.log(`驗證並修正了載入的 ${content.questions.length} 個題目資料`);
          }
          return content;
        }
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error("讀取文件內容失敗:", error);
      return null;
    }
  };

  // 處理 Excel 檔案並解析題目
  const parseExcelContent = (fileContent: any): IExcelQuestion[] => {
    try {
      // 如果是字串形式的base64內容，需要先轉換
      let data;
      if (typeof fileContent.content === 'string' && fileContent.content.startsWith('data:')) {
        const base64 = fileContent.content.split(',')[1];
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: fileContent.type });
        const arrayBuffer = new Uint8Array(array).buffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        data = workbook;
      } else if (fileContent.originalContent) {
        data = fileContent.originalContent;
      } else {
        console.error("Invalid file content format");
        return [];
      }

      // 檢查 data.SheetNames 是否存在
      if (!data.SheetNames || !Array.isArray(data.SheetNames) || data.SheetNames.length === 0) {
        console.error("SheetNames 不存在或為空");
        return [];
      }

      // 假設第一個工作表包含題目
      const firstSheetName = data.SheetNames[0];
      
      // 檢查 data.Sheets 和 worksheet 是否存在
      if (!data.Sheets || !data.Sheets[firstSheetName]) {
        console.error("data.Sheets 或 worksheet 不存在");
        return [];
      }

      const worksheet = data.Sheets[firstSheetName];

      // 將工作表轉換為JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 檢查是否為空
      if (!jsonData || jsonData.length === 0) {
        console.error("Excel 檔案中沒有找到任何數據");
        return [];
      }

      // 檢測檔案格式，輸出首行做為調試資訊
      console.log("=== Excel 解析調試信息 ===");
      console.log("工作表名稱:", firstSheetName);
      console.log("總行數:", jsonData.length);
      console.log("Excel 首行資料:", jsonData[0]);
      console.log("所有欄位名稱:", Object.keys(jsonData[0] || {}));

      // 檢查前幾行的資料結構
      if (jsonData.length > 1) {
        console.log("第二行資料:", jsonData[1]);
      }
      if (jsonData.length > 2) {
        console.log("第三行資料:", jsonData[2]);
      }

      // 將JSON資料轉換為題目格式，根據檢測到的欄位進行適配
      const questions: IExcelQuestion[] = jsonData.map((row: any, index: number) => {
        console.log(`=== 處理第 ${index + 1} 行資料 ===`);
        console.log("原始行資料:", row);

        // 支援以下欄位：
        // QuestionNo. ChapterNo QuestionInChinese AnswerAInChinese AnswerBInChinese AnswerCInChinese AnswerDInChinese CorrectAnswer AnswerExplainInChinese

        if (row.QuestionInChinese !== undefined) {
          console.log("使用 QuestionInChinese 格式解析");
          const options = [];

          const optionFields = [
            { key: 'AnswerAInChinese', label: 'A' },
            { key: 'AnswerBInChinese', label: 'B' },
            { key: 'AnswerCInChinese', label: 'C' },
            { key: 'AnswerDInChinese', label: 'D' }
          ];

          for (const field of optionFields) {
            const value = row[field.key];
            console.log(`選項 ${field.label} (${field.key}):`, value);
            if (value && typeof value === 'string' && value.trim() !== '') {
              options.push(value.trim());
            } else {
              // 如果選項為空，提供預設選項
              options.push(`選項 ${field.label}`);
              console.warn(`題目 ${index + 1} 的選項 ${field.label} 為空，使用預設值`);
            }
          }

          while (options.length < 4) {
            options.push(`選項 ${String.fromCharCode(65 + options.length)}`);
          }

          let correctAnswer = row.CorrectAnswer || "";
          console.log("原始正確答案:", correctAnswer);

          if (correctAnswer === "A" && row.AnswerAInChinese) correctAnswer = row.AnswerAInChinese;
          else if (correctAnswer === "B" && row.AnswerBInChinese) correctAnswer = row.AnswerBInChinese;
          else if (correctAnswer === "C" && row.AnswerCInChinese) correctAnswer = row.AnswerCInChinese;
          else if (correctAnswer === "D" && row.AnswerDInChinese) correctAnswer = row.AnswerDInChinese;

          const parsedQuestion = {
            id: (row.QuestionNo || index + 1).toString(),
            question: row.QuestionInChinese || "未定義題目",
            options: options, // 確保始終為陣列且有4個選項
            answer: correctAnswer,
            category: row.ChapterNo?.toString() || "",
            difficulty: "普通",
            modified: false
          };

          console.log("解析結果:", parsedQuestion);
          return parsedQuestion;
        }
        // 檢查可能使用不同的欄位名稱
        else if (row['題目'] !== undefined || row['問題'] !== undefined || row['題目內容'] !== undefined) {
          console.log("使用中文欄位格式解析");

          // 檢查中文欄位名稱
          const questionContent = row['題目'] || row['問題'] || row['題目內容'] || "未定義題目";
          console.log("題目內容:", questionContent);

          // 檢查中文選項欄位
          const options = [];
          const chineseOptionFields = [
            { keys: ['選項A', '選項 A', 'A選項', 'A', '(A)', '（A）'], label: 'A' },
            { keys: ['選項B', '選項 B', 'B選項', 'B', '(B)', '（B）'], label: 'B' },
            { keys: ['選項C', '選項 C', 'C選項', 'C', '(C)', '（C）'], label: 'C' },
            { keys: ['選項D', '選項 D', 'D選項', 'D', '(D)', '（D）'], label: 'D' }
          ];

          for (const field of chineseOptionFields) {
            let optionValue = null;
            for (const key of field.keys) {
              if (row[key] !== undefined && row[key] !== null) {
                optionValue = row[key];
                console.log(`找到選項 ${field.label} 在欄位 "${key}":`, optionValue);
                break;
              }
            }

            if (optionValue && typeof optionValue === 'string' && optionValue.trim() !== '') {
              options.push(optionValue.trim());
            } else {
              options.push(`選項 ${field.label}`);
              console.warn(`題目 ${index + 1} 的選項 ${field.label} 為空，使用預設值`);
            }
          }

          // 確保至少有4個選項
          while (options.length < 4) {
            options.push(`選項 ${String.fromCharCode(65 + options.length)}`);
          }

          // 檢查中文答案欄位
          let correctAnswer = row['正確答案'] || row['答案'] || row['正解'] || row['解答'] || "";
          console.log("原始正確答案:", correctAnswer);

          if (correctAnswer === "A" || correctAnswer === "(A)" || correctAnswer === "（A）") {
            correctAnswer = options[0];
          } else if (correctAnswer === "B" || correctAnswer === "(B)" || correctAnswer === "（B）") {
            correctAnswer = options[1];
          } else if (correctAnswer === "C" || correctAnswer === "(C)" || correctAnswer === "（C）") {
            correctAnswer = options[2];
          } else if (correctAnswer === "D" || correctAnswer === "(D)" || correctAnswer === "（D）") {
            correctAnswer = options[3];
          }

          const parsedQuestion = {
            id: (row['題號'] || row['編號'] || row['序號'] || index + 1).toString(),
            question: questionContent,
            options: options,
            answer: correctAnswer,
            category: (row['章節'] || row['章'] || row['單元'] || "").toString(),
            difficulty: "普通",
            modified: false
          };

          console.log("解析結果:", parsedQuestion);
          return parsedQuestion;
        }

        else if (row.Question || row.question) {
          console.log("使用通用 Question 格式解析");
          // 檢查常見欄位命名
          const questionContent = row.Question || row.question || row.QuestionContent || row.Content || "未定義題目";
          const optionFields = [
            { field: 'option1', fallbacks: ['Option1', 'OptionA', 'optionA', 'AnswerA', 'answerA', 'A'] },
            { field: 'option2', fallbacks: ['Option2', 'OptionB', 'optionB', 'AnswerB', 'answerB', 'B'] },
            { field: 'option3', fallbacks: ['Option3', 'OptionC', 'optionC', 'AnswerC', 'answerC', 'C'] },
            { field: 'option4', fallbacks: ['Option4', 'OptionD', 'optionD', 'AnswerD', 'answerD', 'D'] },
          ];

          const options = [];

          for (const optionField of optionFields) {
            // 檢查主欄位和備用欄位
            let optionValue = row[optionField.field];
            if (optionValue === undefined || optionValue === null) {
              for (const fallback of optionField.fallbacks) {
                if (row[fallback] !== undefined && row[fallback] !== null) {
                  optionValue = row[fallback];
                  console.log(`找到選項 ${optionField.field} 在欄位 ${fallback}:`, optionValue);
                  break;
                }
              }
            }

            // 確保選項值為有效字串
            if (optionValue && typeof optionValue === 'string' && optionValue.trim() !== '') {
              options.push(optionValue.trim());
            } else {
              options.push(`選項 ${String.fromCharCode(65 + options.length)}`);
            }
          }

          while (options.length < 4) {
            options.push(`選項 ${String.fromCharCode(65 + options.length)}`);
          }

          const answerField = row.answer || row.Answer || row.correctAnswer || row.CorrectAnswer || '';

          const parsedQuestion = {
            id: row.id?.toString() || row.ID?.toString() || row.QuestionNo?.toString() || (index + 1).toString(),
            question: questionContent,
            options: options, 
            answer: answerField,
            category: row.category || row.Category || row.chapter || row.Chapter || row.ChapterNo?.toString() || "",
            difficulty: row.difficulty || row.Difficulty || "普通",
            modified: false
          };

          console.log("解析結果:", parsedQuestion);
          return parsedQuestion;
        } else {
          console.log("使用智能猜測格式解析");
          const columns = Object.keys(row);
          console.log("可用欄位:", columns);

          // 尋找可能的問題欄位
          const questionColumns = columns.filter(col =>
            col.toLowerCase().includes('question') ||
            col.includes('題目') ||
            col.includes('問題') ||
            col.includes('Chinese')
          );
          console.log("可能的題目欄位:", questionColumns);

          // 尋找可能是選項的欄位
          const optionColumns = columns.filter(col =>
            col.toLowerCase().includes('option') ||
            col.toLowerCase().includes('answer') ||
            col.includes('選項') ||
            col.match(/[A-D]/) 
          );
          console.log("可能的選項欄位:", optionColumns);

          // 尋找可能的正確答案欄位
          const correctColumns = columns.filter(col =>
            col.toLowerCase().includes('correct') ||
            col.includes('正確')
          );
          console.log("可能的答案欄位:", correctColumns);

          const questionField = questionColumns.length > 0 ? questionColumns[0] : '';

          const options = optionColumns
            .map(col => row[col])
            .filter((val: any) => val !== undefined && val !== null && val !== '' && typeof val === 'string')
            .map((val: any) => val.trim());

          console.log("提取的選項:", options);

          while (options.length < 4) {
            options.push(`選項 ${String.fromCharCode(65 + options.length)}`);
          }

          if (options.length === 0) {
            options.push("選項 A", "選項 B", "選項 C", "選項 D");
            console.warn(`題目 ${index + 1} 沒有找到有效選項，使用預設選項`);
          }

          const correctField = correctColumns.length > 0 ? correctColumns[0] : '';

          const parsedQuestion = {
            id: (index + 1).toString(),
            question: questionField ? row[questionField] : "未定義題目",
            options: options, // 確保始終為陣列
            answer: correctField ? row[correctField] : "",
            category: "",
            difficulty: "普通",
            modified: false
          };

          console.log("解析結果:", parsedQuestion);
          return parsedQuestion;
        }
      });

      // 過濾掉沒有題目內容的題目
      const validQuestions = questions.filter(q => {
        return q.question && q.question !== "未定義題目";
      }).map(q => validateQuestion(q));

      console.log(`成功解析 ${validQuestions.length} 個題目`);
      return validQuestions;
    } catch (error) {
      console.error("Error parsing Excel content:", error);
      return [];
    }
  };

  // 將題目資料轉換回Excel格式
  const saveQuestionsToExcel = (questions: IExcelQuestion[], fileContent: any): any => {
    try {
      // 檢查 fileContent 和 originalContent 是否存在
      if (!fileContent || !fileContent.originalContent) {
        console.warn("fileContent 或 originalContent 不存在，創建新的工作簿");
        const worksheetData = questions.map(q => ({
          id: q.id,
          question: q.question,
          option1: q.options[0] || "",
          option2: q.options[1] || "",
          option3: q.options[2] || "",
          option4: q.options[3] || "",
          answer: q.answer,
          category: q.category,
          difficulty: q.difficulty
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        return {
          ...fileContent,
          originalContent: workbook
        };
      }

      const data = fileContent.originalContent;
      
      // 檢查 data.SheetNames 是否存在
      if (!data.SheetNames || !Array.isArray(data.SheetNames) || data.SheetNames.length === 0) {
        console.warn("SheetNames 不存在或為空，創建新的工作簿");
        const worksheetData = questions.map(q => ({
          id: q.id,
          question: q.question,
          option1: q.options[0] || "",
          option2: q.options[1] || "",
          option3: q.options[2] || "",
          option4: q.options[3] || "",
          answer: q.answer,
          category: q.category,
          difficulty: q.difficulty
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        return {
          ...fileContent,
          originalContent: workbook
        };
      }

      const firstSheetName = data.SheetNames[0];
      
      // 檢查 data.Sheets 和 worksheet 是否存在
      if (!data.Sheets || !data.Sheets[firstSheetName]) {
        console.warn("data.Sheets 或 worksheet 不存在，創建新的工作簿");
        const worksheetData = questions.map(q => ({
          id: q.id,
          question: q.question,
          option1: q.options[0] || "",
          option2: q.options[1] || "",
          option3: q.options[2] || "",
          option4: q.options[3] || "",
          answer: q.answer,
          category: q.category,
          difficulty: q.difficulty
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        return {
          ...fileContent,
          originalContent: workbook
        };
      }

      const worksheet = data.Sheets[firstSheetName];
      const originalData = XLSX.utils.sheet_to_json(worksheet);

      // 使用預設的欄位結構
      if (!originalData || originalData.length === 0) {
        const worksheetData = questions.map(q => ({
          id: q.id,
          question: q.question,
          option1: q.options[0] || "",
          option2: q.options[1] || "",
          option3: q.options[2] || "",
          option4: q.options[3] || "",
          answer: q.answer,
          category: q.category,
          difficulty: q.difficulty
        }));

        // 創建工作表
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = fileContent.originalContent || XLSX.utils.book_new();
        const sheetName = workbook.SheetNames && workbook.SheetNames[0] ? workbook.SheetNames[0] : "Sheet1";

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName, true);

        return {
          ...fileContent,
          originalContent: workbook
        };
      }

      // 檢查原始檔案的欄位結構
      const sampleRow = originalData[0] as Record<string, any>;

      if (sampleRow.QuestionInChinese !== undefined) {
        const worksheetData = questions.map(q => {
          let correctAnswerLetter = "";

          if (q.options[0] === q.answer) correctAnswerLetter = "A";
          else if (q.options[1] === q.answer) correctAnswerLetter = "B";
          else if (q.options[2] === q.answer) correctAnswerLetter = "C";
          else if (q.options[3] === q.answer) correctAnswerLetter = "D";

          return {
            QuestionNo: q.id,
            ChapterNo: q.category,
            QuestionInChinese: q.question,
            AnswerAInChinese: q.options[0] || "",
            AnswerBInChinese: q.options[1] || "",
            AnswerCInChinese: q.options[2] || "",
            AnswerDInChinese: q.options[3] || "",
            CorrectAnswer: correctAnswerLetter || q.answer,
            AnswerExplainInChinese: sampleRow.AnswerExplainInChinese || "" 
          };
        });

        // 創建工作表
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = fileContent.originalContent || XLSX.utils.book_new();
        const sheetName = workbook.SheetNames && workbook.SheetNames[0] ? workbook.SheetNames[0] : "Sheet1";

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName, true);

        return {
          ...fileContent,
          originalContent: workbook
        };
      } else {
        const worksheetData = questions.map(q => ({
          id: q.id,
          question: q.question,
          option1: q.options[0] || "",
          option2: q.options[1] || "",
          option3: q.options[2] || "",
          option4: q.options[3] || "",
          answer: q.answer,
          category: q.category,
          difficulty: q.difficulty
        }));

        // 創建工作表
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = fileContent.originalContent || XLSX.utils.book_new();
        const sheetName = workbook.SheetNames && workbook.SheetNames[0] ? workbook.SheetNames[0] : "Sheet1";

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName, true);

        return {
          ...fileContent,
          originalContent: workbook
        };
      }
    } catch (error) {
      console.error("Error saving questions to Excel:", error);
      return fileContent;
    }
  };
  // 文件上傳至資料庫
  const handleFileUpload = async (file: File): Promise<void> => {
    try {
      setIsLoading(true);
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        addToast({
          color: "warning",
          title: TOAST_MESSAGES.ERROR.FORMAT,
          description: "",
        });
        setIsLoading(false);
        return;
      }

      addToast({
        color: "primary",
        title: TOAST_MESSAGES.INFO.PROCESSING,
        description: "",
      });

      // 上傳檔案至資料庫
      const result = await uploadExcelFile(file, currentDocType);
      const newFile: IDocsFormat = {
        fileID: result.file_id,
        fileName: result.file_name,
        lastUpdate: result.last_update,
        docType: currentDocType,
        questionCount: 0  
      };

      // 讀取文件內容在本地備份
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileContent: {
            name: string;
            type: string;
            size: number;
            lastModified: number;
            content: string | ArrayBuffer | null | undefined;
            originalContent?: any;
          } = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            content: e.target?.result
          };

          // 處理 Excel 文件
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const arrayBuffer = e.target?.result;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            fileContent.originalContent = workbook;
          }

          try {
            saveFileContent(result.file_id, fileContent);
          } catch (storageError) {
            console.warn("本地備份失敗，但檔案已成功上傳到資料庫:", storageError);

            if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
              addToast({
                color: "warning",
                title: TOAST_MESSAGES.WARNING.STORAGE_FULL,
                description: "檔案已上傳成功，但無法本地備份。建議點擊「清理存儲空間」按鈕。",
              });
            }
          }
        } catch (error) {
          console.error("Error processing file for local backup:", error);
        }
      };

      reader.readAsArrayBuffer(file);

      // 獲取上傳後的題目
      try {
        const questionsResult = await fetchExcelQuestions(result.file_id);
        newFile.questionCount = questionsResult.questions.length;
        const hasImages = questionsResult.questions.some(q => q.picture);
        if (hasImages) {
          addToast({
            color: "success",
            title: TOAST_MESSAGES.SUCCESS.UPLOAD,
            description: `檔案中的圖片已成功提取並與題目關聯`,
          });
        }
      } catch (error) {
        console.error("Failed to fetch questions after upload:", error);
      }

      // 更新文件
      const updatedList = [...fileList, newFile];
      setFileList(updatedList);
      saveLocalStorageDocsList(currentDocType, updatedList);
      // 清理 localStorage 
      try {
        const contentData = getFileContent("") || {};
        if (contentData[result.file_id]) {
          delete contentData[result.file_id];
          localStorage.setItem(LOCAL_STORAGE_DOCS_CONTENT_KEY, JSON.stringify(contentData));
          console.log(`上傳成功後已清理 localStorage 中的檔案內容: ${result.file_id}`);
        }
      } catch (error) {
        console.warn("清理 localStorage 檔案內容時發生錯誤:", error);
      }

      addToast({
        color: "success",
        title: TOAST_MESSAGES.SUCCESS.UPLOAD,
        description: `文件已成功上傳至資料庫，包含 ${newFile.questionCount} 個題目`,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error uploading file:", error);

      // 上傳失敗，儲存到本地
      try {
        const newFileID = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newFile: IDocsFormat = {
          fileID: newFileID,
          fileName: file.name,
          lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
          docType: currentDocType,
          questionCount: 0  
        };

        const reader = new FileReader();
        reader.onload = (e) => {
          const fileContent: {
            name: string;
            type: string;
            size: number;
            lastModified: number;
            content: string | ArrayBuffer | null | undefined;
            parsedContent?: IDocContent;
            originalContent?: any;
          } = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            content: e.target?.result,
            parsedContent: undefined,
            originalContent: undefined
          };

          // 處理 Excel 文件
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const arrayBuffer = e.target?.result;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const questions = parseExcelContent({
              content: e.target?.result,
              type: file.type,
              originalContent: workbook
            });

            const docContent: IDocContent = {
              fileID: newFileID,
              fileName: file.name,
              lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
              questions: questions,
              originalContent: workbook
            };

            fileContent.parsedContent = docContent;

            // 更新題目數量
            newFile.questionCount = questions.length;
          }

          saveFileContent(newFileID, fileContent);
          const updatedList = [...fileList, newFile];
          setFileList(updatedList);
          saveLocalStorageDocsList(currentDocType, updatedList);

          addToast({
            color: "warning",
            title: "上傳至本地成功",
            description: `資料庫連接失敗，檔案已暫存在本機，包含 ${newFile.questionCount} 個題目`,
          });

          setIsLoading(false);
        };

        reader.onerror = () => {
          console.error("Error reading file:", reader.error);
          addToast({
            color: "danger",
            title: "上傳失敗",
            description: "讀取文件時發生錯誤",
          });
          setIsLoading(false);
        };

        reader.readAsArrayBuffer(file);
      } catch (localError) {
        console.error("Error on local backup:", localError);
        addToast({
          color: "danger",
          title: "上傳失敗",
          description: "無法上傳文件，請稍後再試",
        });
        setIsLoading(false);
      }
    }
  };
  // 查看題目列表
  const handleDocClick = async (item: IDocsFormat) => {
    try {
      if (item.fileID.startsWith("db-")) {
        try {
          setIsLoading(true);
          const result = await fetchExcelQuestions(item.fileID);

          const docContent: IDocContent = {
            fileID: item.fileID,
            fileName: item.fileName,
            lastUpdate: item.lastUpdate,
            questions: result.questions,
            originalContent: null 
          };

          setCurrentContent(docContent);
          setViewMode('questions');
        } catch (dbError) {
          console.error("Error fetching questions from database:", dbError);
          const fileContent = getFileContent(item.fileID);
          if (fileContent && fileContent.parsedContent) {
            setCurrentContent(fileContent.parsedContent);
            setViewMode('questions');

            addToast({
              color: "warning",
              title: "使用本地緩存",
              description: "資料庫連接失敗，使用本地緩存的題目",
            });
          } else {
            throw dbError; 
          }
        } finally {
          setIsLoading(false);
        }
        return;
      }
      else if (item.fileID.startsWith("local-")) {
        const fileContent = getFileContent(item.fileID);

        if (fileContent) {
          // 解析並顯示題目
          if (item.fileName.endsWith('.xlsx') || item.fileName.endsWith('.xls')) {
            const questions = parseExcelContent(fileContent);

            const docContent: IDocContent = {
              fileID: item.fileID,
              fileName: item.fileName,
              lastUpdate: item.lastUpdate,
              questions: questions,
              originalContent: fileContent.originalContent
            };

            setCurrentContent(docContent);
            setViewMode('questions');
            return;
          }

          const contentType = fileContent.type || "application/octet-stream";
          const blob = dataURLtoBlob(fileContent.content as string, contentType);
          const url = URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = fileContent.name || item.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          addToast({
            color: "warning",
            title: TOAST_MESSAGES.WARNING.FILE_NOT_FOUND,
            description: "",
          });
        }

        return;
      }

      // URL 開啟其他文件
      window.open(`${siteConfig.api_url}/documentation/${item.fileID}`, "_blank");
    } catch (error) {
      console.error("Error handling document click:", error);
      addToast({
        color: "danger",
        title: TOAST_MESSAGES.ERROR.LOAD,
        description: "",
      });
    }
  };

  // 回到文件列表
  const handleBackToList = () => {
    setViewMode('list');
    setCurrentContent(null);
    setSelectedChapter("all");
    setAvailableChapters([]);
    setCurrentPage(1); // 重置分頁
  };

  // dataURL 轉 Blob
  const dataURLtoBlob = (dataURL: string, contentType: string): Blob => {
    const arr = dataURL.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: contentType });
  };

  // 題目編輯
  const handleEditQuestion = (question: IExcelQuestion) => {
    setEditingQuestion({ ...question });
    setEditQuestionModal(true);
  };
  const syncDatabaseQuestions = async (fileId: string, questions: IExcelQuestion[]) => {
    try {
      setIsLoading(true);
      const questionsToSync = questions.map(q => ({
        ...q,
        deleted: q.deleted === true ? true : undefined
      }));

      console.log("同步到資料庫的題目:", questionsToSync);

      const result = await updateExcelQuestions(fileId, questionsToSync);
      console.log("資料庫更新結果:", result);

      addToast({
        color: "success",
        title: TOAST_MESSAGES.SUCCESS.UPDATE,
        description: `已更新 ${result.updated_count} 個題目，刪除 ${result.deleted_count} 個題目`
      });

    } catch (error) {
      console.error("同步資料庫失敗:", error);
      addToast({
        color: "danger",
        title: TOAST_MESSAGES.ERROR.OPERATION,
        description: "無法將修改同步到資料庫，但已保存在本地"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存編輯後的題目
  const saveEditedQuestion = async () => {
    if (!editingQuestion || !currentContent) return;

    const updatedQuestions = currentContent.questions.map(q =>
      q.id === editingQuestion.id ? { ...editingQuestion, modified: true } : q
    );

    const updatedContent: IDocContent = {
      ...currentContent,
      questions: updatedQuestions,
      lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    const updatedFileList = fileList.map(file =>
      file.fileID === currentContent.fileID
        ? { ...file, lastUpdate: updatedContent.lastUpdate }
        : file
    );

    const fileContent = getFileContent(currentContent.fileID);
    console.log("saveEditedQuestion - fileContent:", fileContent);
    console.log("saveEditedQuestion - currentContent.fileID:", currentContent.fileID);
    if (fileContent) {
      console.log("saveEditedQuestion - fileContent.originalContent:", fileContent.originalContent);
      const updatedFileContent = saveQuestionsToExcel(updatedQuestions, fileContent);
      saveFileContent(currentContent.fileID, updatedFileContent);
    } else {
      console.warn("saveEditedQuestion - fileContent is null or undefined");
    }

    setCurrentContent(updatedContent);
    setFileList(updatedFileList);
    saveLocalStorageDocsList(currentDocType, updatedFileList);
    setEditQuestionModal(false);
    setEditingQuestion(null);

    // 如果是數據庫文件，同步到數據庫
    if (currentContent.fileID.startsWith('db-')) {
      await syncDatabaseQuestions(currentContent.fileID, updatedQuestions);
    }

    addToast({
      color: "success",
      title: TOAST_MESSAGES.SUCCESS.UPDATE,
      description: "題目已成功更新",
    });
  };  // 刪除題目
  const handleDeleteQuestion = async (questionId: string) => {
    if (!currentContent) return;

    const questionToDelete = currentContent.questions.find(q => q.id === questionId);
    if (!questionToDelete) return;

    const updatedQuestions = currentContent.questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          modified: true,
          deleted: true 
        };
      }
      return q;
    });

    // 同步到資料庫
    if (currentContent.fileID.startsWith('db-')) {
      await syncDatabaseQuestions(currentContent.fileID, updatedQuestions);
    }

    const visibleQuestions = updatedQuestions.filter(q => !q.deleted);

    const updatedContent: IDocContent = {
      ...currentContent,
      questions: updatedQuestions,
      lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    const updatedFileList = fileList.map(file =>
      file.fileID === currentContent.fileID
        ? { ...file, lastUpdate: updatedContent.lastUpdate }
        : file
    );

    const fileContent = getFileContent(currentContent.fileID);
    if (fileContent) {
      const updatedFileContent = saveQuestionsToExcel(updatedQuestions, fileContent);
      saveFileContent(currentContent.fileID, updatedFileContent);
    }

    setCurrentContent(updatedContent);
    setFileList(updatedFileList);
    saveLocalStorageDocsList(currentDocType, updatedFileList);

    addToast({
      color: "success",
      title: TOAST_MESSAGES.SUCCESS.DELETE,
      description: "題目已成功刪除",
    });
  };
  // 儲存所有修改至資料庫
  const saveAllChangesToDatabase = async () => {
    if (!currentContent || !currentContent.fileID.startsWith('db-')) return;

    try {
      setIsLoading(true);

      const modifiedQuestions = currentContent.questions.filter(q => q.modified);
      if (modifiedQuestions.length === 0) {
        addToast({
          color: "primary",
          title: TOAST_MESSAGES.INFO.NO_CHANGES,
          description: "沒有檢測到任何修改"
        });
        setIsLoading(false);
        return;
      }

      // 同步到資料庫
      await syncDatabaseQuestions(currentContent.fileID, modifiedQuestions);

      const clearedQuestions = currentContent.questions.map(q => {
        if (q.modified) {
          return { ...q, modified: false };
        }
        return q;
      });

      const updatedContent = {
        ...currentContent,
        questions: clearedQuestions
      };

      setCurrentContent(updatedContent);

    } catch (error) {
      console.error("保存所有修改失敗:", error);
      addToast({
        color: "danger",
        title: TOAST_MESSAGES.ERROR.OPERATION,
        description: "無法將所有修改保存到資料庫"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 新增題目
  const handleAddQuestion = () => {
    if (!currentContent) return;

    const newQuestion: IExcelQuestion = {
      id: `new-${Date.now()}`,
      question: "新題目",
      options: ["選項1", "選項2", "選項3", "選項4"],
      answer: "選項1",
      category: "",
      difficulty: "普通",
      modified: true
    };

    setEditingQuestion(newQuestion);
    setEditQuestionModal(true);
  };
  // 儲存新題目
  const saveNewQuestion = async () => {
    if (!editingQuestion || !currentContent) return;

    const markedQuestion = {
      ...editingQuestion,
      modified: true
    };

    const updatedQuestions = [...currentContent.questions, markedQuestion];

    const updatedContent: IDocContent = {
      ...currentContent,
      questions: updatedQuestions,
      lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    const updatedFileList = fileList.map(file =>
      file.fileID === currentContent.fileID
        ? { ...file, lastUpdate: updatedContent.lastUpdate }
        : file
    );

    const fileContent = getFileContent(currentContent.fileID);
    if (fileContent) {
      const updatedFileContent = saveQuestionsToExcel(updatedQuestions, fileContent);
      saveFileContent(currentContent.fileID, updatedFileContent);
    }

    setCurrentContent(updatedContent);
    setFileList(updatedFileList);
    saveLocalStorageDocsList(currentDocType, updatedFileList);
    setEditQuestionModal(false);
    setEditingQuestion(null);

    // 同步到資料庫
    if (currentContent.fileID.startsWith('db-')) {
      await syncDatabaseQuestions(currentContent.fileID, updatedQuestions);
    }

    addToast({
      color: "success",
      title: TOAST_MESSAGES.SUCCESS.ADD,
      description: "題目已成功新增",
    });
  };

  // 開啟編輯
  const handleEditClick = (item: IDocsFormat) => {
    setEditingFile(item);
    setEditFileName(item.fileName);
    setSelectedFile(null);
    onOpen();
  };

  // 選擇檔案
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // 處理檔案選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // 檔案更新
  const handleUpdateDoc = async () => {
    if (!editingFile) return;

    setIsEditing(true);

    try {
      let updatedList = [...fileList];
      const fileIndex = updatedList.findIndex(f => f.fileID === editingFile.fileID);

      if (fileIndex >= 0) {
        // 更新文件名稱
        if (editFileName !== editingFile.fileName) {
          updatedList[fileIndex] = {
            ...updatedList[fileIndex],
            fileName: editFileName,
            lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
          };

          addToast({
            color: "success",
            title: TOAST_MESSAGES.SUCCESS.UPDATE,
            description: "文件名稱已成功更新",
          });
        }

        // 更新文件內容
        if (selectedFile) {
          // 讀取新文件內容
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent: {
              name: string;
              type: string;
              size: number;
              lastModified: number;
              content: string | ArrayBuffer | null | undefined;
              parsedContent?: IDocContent;
              originalContent?: any;
            } = {
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
              lastModified: selectedFile.lastModified,
              content: e.target?.result,
            };

            // 處理 Excel 文件
            if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
              const arrayBuffer = e.target?.result;
              const workbook = XLSX.read(arrayBuffer, { type: 'array' });

              const questions = parseExcelContent({
                content: e.target?.result,
                type: selectedFile.type,
                originalContent: workbook
              });

              const docContent: IDocContent = {
                fileID: editingFile.fileID,
                fileName: selectedFile.name,
                lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
                questions: questions,
                originalContent: workbook
              };

              fileContent.parsedContent = docContent;
            }

            // 儲存新文件
            saveFileContent(editingFile.fileID, fileContent);

            // 更新列表中的文件名稱
            updatedList[fileIndex] = {
              ...updatedList[fileIndex],
              fileName: selectedFile.name,
              lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
            };

            setFileList(updatedList);
            saveLocalStorageDocsList(currentDocType, updatedList);

            addToast({
              color: "success",
              title: TOAST_MESSAGES.SUCCESS.UPDATE,
              description: "文件內容已成功替換",
            });

            onOpenChange();
            setIsEditing(false);
          };

          reader.onerror = () => {
            console.error("Error reading file:", reader.error);
            addToast({
              color: "danger",
              title: "更新失敗",
              description: "讀取文件時發生錯誤",
            });
            setIsEditing(false);
          };

          reader.readAsArrayBuffer(selectedFile);
          return;
        }

        // 存更新後的文件列表
        setFileList(updatedList);
        saveLocalStorageDocsList(currentDocType, updatedList);
      } else {
        addToast({
          color: "warning",
          title: "更新失敗",
          description: "找不到要更新的文件",
        });
      }

      onOpenChange();
    } catch (error) {
      console.error("Error updating document:", error);
      addToast({
        color: "danger",
        title: "更新失敗",
        description: "無法更新文件，請稍後再試",
      });
    } finally {
      setIsEditing(false);
    }
  };  // 處理檔案刪除
  const handleDeleteDoc = async () => {
    if (!editingFile) return;

    setIsEditing(true);

    try {
      let successMessage = "文件已成功從本地存儲中刪除";

      // 檢查檔案來源
      if (editingFile.fileID.startsWith("db-")) {
        try {
          await deleteExcelFile(editingFile.fileID);
          successMessage = "文件已成功從資料庫和本地存儲中刪除";
        } catch (dbError) {
          console.error("Error deleting file from database:", dbError);
          addToast({
            color: "warning",
            title: "資料庫刪除失敗",
            description: "無法從資料庫刪除，但已從本地存儲中刪除"
          });
        }
      }

      try {
        const contentData = localStorage.getItem(LOCAL_STORAGE_DOCS_CONTENT_KEY);
        if (contentData) {
          const parsedContent = JSON.parse(contentData);
          if (parsedContent[editingFile.fileID]) {
            delete parsedContent[editingFile.fileID];
            localStorage.setItem(LOCAL_STORAGE_DOCS_CONTENT_KEY, JSON.stringify(parsedContent));
            console.log(`已從本地存儲中刪除檔案內容: ${editingFile.fileID}`);
          }
        }

        const listData = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
        if (listData) {
          const parsedLists = JSON.parse(listData);

          let updated = false;
          for (const docType in parsedLists) {
            if (Array.isArray(parsedLists[docType])) {
              const initialLength = parsedLists[docType].length;
              parsedLists[docType] = parsedLists[docType].filter(
                (file: any) => file.fileID !== editingFile.fileID
              );

              if (parsedLists[docType].length < initialLength) {
                updated = true;
                console.log(`已從 ${docType} 列表中刪除檔案: ${editingFile.fileID}`);
              }
            }
          }

          if (updated) {
            localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(parsedLists));
          }
        }

        const updatedList = fileList.filter(file => file.fileID !== editingFile.fileID);
        setFileList(updatedList);

        // 文件被刪除，回到文件列表
        if (currentContent && currentContent.fileID === editingFile.fileID) {
          setCurrentContent(null);
          setViewMode('list');
        }
      } catch (error) {
        console.error("Error removing file from localStorage:", error);
        addToast({
          color: "warning",
          title: "本地清理不完全",
          description: "無法完全清理本地存儲，系統將自動處理"
        });
      }

      // 重新載入文件列表
      if (editingFile.docType) {
        loadFileList(editingFile.docType);
      } else {
        loadFileList(currentDocType);
      }

      addToast({
        color: "success",
        title: TOAST_MESSAGES.SUCCESS.DELETE,
        description: successMessage,
      });

      onOpenChange();
    } catch (error) {
      console.error("Error deleting document:", error);
      addToast({
        color: "danger",
        title: "刪除失敗",
        description: "無法刪除文件，請稍後再試",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // 渲染
  const renderTitle = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {currentDocType === "TESTING"
            ? LanguageTable.docs.page.testing[language]
            : LanguageTable.docs.page.theorem[language]}
        </h2>
      </div>
    );
  };

  // 題目列表
  const renderQuestionList = () => {
    if (!currentContent) return null;

    // 學生模式
    if (isStudent) {
      const sortedQuestions = [...currentContent.questions]
        .filter(q => !q.deleted)
        .sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          const aNum = parseInt(a.id.replace(/\D/g, ''));
          const bNum = parseInt(b.id.replace(/\D/g, ''));
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a.id.localeCompare(b.id);
        });

      const questionsWithImages = sortedQuestions.filter(q => q.picture).length;
      const sourceFiles = [...new Set(currentContent.questions
        .filter(q => !q.deleted)
        .map(q => q.sourceFile)
        .filter(file => file)
      )];

      // 計算分頁
      const totalQuestions = sortedQuestions.length;
      const totalPages = Math.ceil(totalQuestions / questionsPerPage);
      const startIndex = (currentPage - 1) * questionsPerPage;
      const endIndex = startIndex + questionsPerPage;
      const currentQuestion = totalQuestions > 0 ? sortedQuestions[startIndex] : null;

      return (
        <div>
          {/* 學生模式的簡化題目摘要 */}
          <div className="mb-4 p-3 bg-content2 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">題目摘要</h3>
            <div className="text-sm">
              <p>章節: {currentContent.fileName}</p>
              <p>題目數量: {totalQuestions} 題</p>
              <p>包含圖片: {questionsWithImages} 題</p>
              {sourceFiles.length > 0 && (
                <p>來源檔案: {sourceFiles.length} 個檔案</p>
              )}
              <p>最後更新: {currentContent.lastUpdate}</p>
            </div>
          </div>

          {totalQuestions === 0 ? (
            <div className="text-center p-8">
              <p className="text-xl font-medium mb-2">沒有題目</p>
              <p className="text-default-500">此章節不包含可顯示的題目</p>
            </div>
          ) : (
            <div>
              {/* 分頁導航 */}
              <div className="flex justify-between items-center mb-4 p-3 bg-content2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="light"
                    isDisabled={currentPage === 1}
                    onPress={() => setCurrentPage(currentPage - 1)}
                  >
                    上一題
                  </Button>
                  <span className="text-sm">
                    {currentPage}/{totalQuestions}
                  </span>
                  <Button
                    size="sm"
                    variant="light"
                    isDisabled={currentPage === totalQuestions}
                    onPress={() => setCurrentPage(currentPage + 1)}
                  >
                    下一題
                  </Button>
                </div>
                
                {/* 頁數選擇器 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm">跳轉</span>
                  <Select
                    size="sm"
                    placeholder="選擇頁數"
                    selectedKeys={[currentPage.toString()]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      if (selected) {
                        setCurrentPage(parseInt(selected));
                      }
                    }}
                    className="w-32"
                    items={Array.from({ length: totalQuestions }, (_, i) => ({
                      key: (i + 1).toString(),
                      label: `第 ${i + 1} 題`
                    }))}
                  >
                    {(item) => (
                      <SelectItem key={item.key}>
                        {item.label}
                      </SelectItem>
                    )}
                  </Select>
                </div>
              </div>



              {/* 當前題目 */}
              {currentQuestion && (
                <div className="mb-4">
                  <QuestionCard question={currentQuestion} />
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // 教師/助教模式
    const allChapters = [...new Set(currentContent.questions
      .filter(q => !q.deleted)
      .map(q => q.category)
      .filter(category => category && category.trim() !== "")
    )].sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });

    // 章節列表
    if (JSON.stringify(allChapters) !== JSON.stringify(availableChapters)) {
      setAvailableChapters(allChapters);
    }

    // 篩選題目
    const filteredQuestions = currentContent.questions
      .filter(q => !q.deleted)
      .filter(q => selectedChapter === "all" || q.category === selectedChapter);

    // 題目排序
    const sortedQuestions = [...filteredQuestions]
      .sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        const aNum = parseInt(a.id.replace(/\D/g, ''));
        const bNum = parseInt(b.id.replace(/\D/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.id.localeCompare(b.id);
      });

    const questionsWithImages = sortedQuestions.filter(q => q.picture).length;

    const isChapterBrowseMode = currentContent.fileName.includes('章節瀏覽');

    // 計算分頁
    const totalQuestions = sortedQuestions.length;
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const currentQuestion = totalQuestions > 0 ? sortedQuestions[startIndex] : null;

    // 確保 currentPage 不超過總題數
    if (totalQuestions > 0 && currentPage > totalQuestions) {
      setCurrentPage(1);
    }

    return (
      <div>
        {/* 根據模式顯示不同的題目摘要 */}
        {isChapterBrowseMode ? (
          <div className="mb-4 p-3 bg-content2 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">題目摘要</h3>
            <div className="text-sm">
              <p>章節: {currentContent.fileName}</p>
              <p>題目數量: {sortedQuestions.length} 題</p>
              <p>包含圖片: {questionsWithImages} 題</p>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-content2 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">題目摘要</h3>
                <div className="text-sm">
                  <p>題庫: {currentContent.fileName}</p>
                  <p>總題數: {currentContent.questions.filter(q => !q.deleted).length} 題</p>
                  <p>顯示題數: {sortedQuestions.length} 題</p>
                  <p>包含圖片: {questionsWithImages} 題</p>
                  {(() => {
                    const sourceFiles = [...new Set(currentContent.questions
                      .filter(q => !q.deleted)
                      .map(q => q.sourceFile)
                      .filter(file => file)
                    )];
                    return sourceFiles.length > 0 && (
                      <p>來源檔案: {sourceFiles.length} 個檔案</p>
                    );
                  })()}
                  <p>最後更新: {currentContent.lastUpdate}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">篩選章節：</label>
                <Select
                  size="sm"
                  placeholder="選擇章節"
                  selectedKeys={[selectedChapter]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedChapter(selected || "all");
                    setCurrentPage(1); // 切換章節時重置分頁
                  }}
                  className="w-48"
                  items={[
                    { key: "all", label: "全部章節" },
                    ...allChapters.map(chapter => ({ key: chapter, label: `第 ${chapter} 章` }))
                  ]}
                >
                  {(item) => (
                    <SelectItem key={item.key}>
                      {item.label}
                    </SelectItem>
                  )}
                </Select>
              </div>
            </div>
          </div>
        )}

        {totalQuestions === 0 ? (
          <div className="text-center p-8">
            <p className="text-xl font-medium mb-2">
              {selectedChapter === "all" ? "沒有題目" : `第 ${selectedChapter} 章沒有題目`}
            </p>
            <p className="text-default-500">
              {selectedChapter === "all"
                ? "此文件不包含可顯示的題目"
                : "請選擇其他章節或查看全部章節"
              }
            </p>
          </div>
        ) : (
          <div>
            {/* 分頁導航 */}
            <div className="flex justify-between items-center mb-4 p-3 bg-content2 rounded-lg">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="light"
                  isDisabled={currentPage === 1}
                  onPress={() => setCurrentPage(currentPage - 1)}
                >
                  上一題
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalQuestions}
                </span>
                <Button
                  size="sm"
                  variant="light"
                  isDisabled={currentPage === totalQuestions}
                  onPress={() => setCurrentPage(currentPage + 1)}
                >
                  下一題
                </Button>
              </div>
              
              {/* 頁數選擇器 */}
              <div className="flex items-center gap-2">
                <span className="text-sm">跳轉</span>
                <Select
                  size="sm"
                  placeholder="選擇頁數"
                  selectedKeys={[currentPage.toString()]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    if (selected) {
                      setCurrentPage(parseInt(selected));
                    }
                  }}
                  className="w-32"
                  items={Array.from({ length: totalQuestions }, (_, i) => ({
                    key: (i + 1).toString(),
                    label: `第 ${i + 1} 題`
                  }))}
                >
                  {(item) => (
                    <SelectItem key={item.key}>
                      {item.label}
                    </SelectItem>
                  )}
                </Select>
              </div>
            </div>



            {/* 當前題目 */}
            {currentQuestion && (
              <div className="relative mb-4">
                {isTeacherOrTA && (
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <Button
                      size="sm"
                      color="primary"
                      variant="light"
                      onPress={() => handleEditQuestion(currentQuestion)}
                    >
                      編輯
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => handleDeleteQuestion(currentQuestion.id)}
                    >
                      刪除
                    </Button>
                  </div>
                )}
                <QuestionCard question={currentQuestion} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 載入學生題庫章節列表
  const loadStudentChapters = async (questionBankType: string) => {
    setIsLoading(true);
    try {
      const dbDocs = await fetchExcelFileList(questionBankType);
      if (dbDocs && dbDocs.length > 0) {
        const allChapters = new Set<string>();

        for (const file of dbDocs) {
          try {
            const questionsResult = await fetchExcelQuestions(file.fileID);
            questionsResult.questions.forEach(q => {
              if (q.category && q.category.trim() !== "") {
                allChapters.add(q.category.trim());
              }
            });
          } catch (error) {
            console.error(`載入檔案 ${file.fileName} 的題目失敗:`, error);
          }
        }

        // 排序章節
        const sortedChapters = Array.from(allChapters).sort((a, b) => {
          const aNum = parseInt(a);
          const bNum = parseInt(b);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a.localeCompare(b);
        });

        setAvailableStudentChapters(sortedChapters);
        setSelectedQuestionBank(questionBankType);
        setStudentViewMode('chapterSelection');

        const bankLabel = studentQuestionBanks.find(bank => bank.key === questionBankType)?.label || questionBankType;
        addToast({
          color: "success",
          title: "章節載入成功",
          description: `已載入 ${bankLabel} 共 ${sortedChapters.length} 個章節`,
        });
      } else {
        // 從本地載入
        const localDocs = loadLocalStorageDocsList(questionBankType);
        if (localDocs && localDocs.length > 0) {
          const allChapters = new Set<string>();

          for (const file of localDocs) {
            try {
              const fileContent = getFileContent(file.fileID);
              if (fileContent) {
                const questions = parseExcelContent(fileContent);
                questions.forEach(q => {
                  if (q.category && q.category.trim() !== "") {
                    allChapters.add(q.category.trim());
                  }
                });
              }
            } catch (error) {
              console.error(`載入本地檔案 ${file.fileName} 的題目失敗:`, error);
            }
          }

          const sortedChapters = Array.from(allChapters).sort((a, b) => {
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            return a.localeCompare(b);
          });

          setAvailableStudentChapters(sortedChapters);
          setSelectedQuestionBank(questionBankType);
          setStudentViewMode('chapterSelection');

          const bankLabel = studentQuestionBanks.find(bank => bank.key === questionBankType)?.label || questionBankType;
          addToast({
            color: "success",
            title: "章節載入成功 (本地緩存)",
            description: `已載入 ${bankLabel} 共 ${sortedChapters.length} 個章節`,
          });
        } else {
          const bankLabel = studentQuestionBanks.find(bank => bank.key === questionBankType)?.label || questionBankType;
          addToast({
            color: "warning",
            title: "暫無章節",
            description: `目前沒有可用的${bankLabel}章節`,
          });

          setStudentViewMode('bankSelection');
        }
      }
    } catch (error) {
      console.error("Error loading student chapters:", error);
      const bankLabel = studentQuestionBanks.find(bank => bank.key === questionBankType)?.label || questionBankType;
      addToast({
        color: "danger",
        title: "載入失敗",
        description: `無法載入${bankLabel}章節，請稍後再試`,
      });

      setStudentViewMode('bankSelection');
    } finally {
      setIsLoading(false);
    }
  };

  // 學生：載入指定章節題目
  const loadStudentQuestions = async (questionBankType?: string, chapterFilter?: string) => {
    const bankType = questionBankType || selectedQuestionBank;
    const chapter = chapterFilter || selectedStudentChapter;

    if (!chapter) {
      addToast({
        color: "warning",
        title: TOAST_MESSAGES.WARNING.NO_CHAPTER,
        description: "",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 從資料庫載入
      const dbDocs = await fetchExcelFileList(bankType);

      if (dbDocs && dbDocs.length > 0) {
        const chapterQuestions: IExcelQuestion[] = [];
        let totalFiles = 0;
        let successFiles = 0;

        for (const file of dbDocs) {
          try {
            totalFiles++;
            const questionsResult = await fetchExcelQuestions(file.fileID);

            // 篩選指定章節題目
            const filteredQuestions = questionsResult.questions
              .filter(q => q.category === chapter)
              .map(q => ({
                ...q,
                id: `${file.fileID}-${q.id}`, 
                sourceFile: file.fileName, 
                sourceFileId: file.fileID
              }));

            if (filteredQuestions.length > 0) {
              chapterQuestions.push(...filteredQuestions);
              successFiles++;
            }
          } catch (error) {
            console.error(`載入檔案 ${file.fileName} 的題目失敗:`, error);
          }
        }

        if (chapterQuestions.length > 0) {
          // 創建章節題目內容
          const docContent: IDocContent = {
            fileID: `chapter-${bankType}-${chapter}-${Date.now()}`,
            fileName: `${studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType} - 第 ${chapter} 章`,
            lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
            questions: chapterQuestions,
            originalContent: null
          };

          setCurrentContent(docContent);
          setStudentViewMode('questions');

          const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
          addToast({
            color: "success",
            title: TOAST_MESSAGES.SUCCESS.LOAD,
            description: `${chapterQuestions.length} 個題目`,
          });
        } else {
          const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
          addToast({
            color: "warning",
            title: TOAST_MESSAGES.WARNING.NO_CONTENT,
            description: "",
          });

          setCurrentContent(null);
          setStudentViewMode('chapterSelection');
        }
      } else {
        // 從本地載入指定章節的題目
        const localDocs = loadLocalStorageDocsList(bankType);
        if (localDocs && localDocs.length > 0) {
          const chapterQuestions: IExcelQuestion[] = [];
          let totalFiles = 0;
          let successFiles = 0;

          for (const file of localDocs) {
            try {
              totalFiles++;
              const fileContent = getFileContent(file.fileID);

              if (fileContent) {
                const questions = parseExcelContent(fileContent);

                // 篩選指定章節題目
                const filteredQuestions = questions
                  .filter(q => q.category === chapter)
                  .map(q => ({
                    ...q,
                    id: `${file.fileID}-${q.id}`, 
                    sourceFile: file.fileName,
                    sourceFileId: file.fileID 
                  }));

                if (filteredQuestions.length > 0) {
                  chapterQuestions.push(...filteredQuestions);
                  successFiles++;
                }
              }
            } catch (error) {
              console.error(`載入本地檔案 ${file.fileName} 的題目失敗:`, error);
            }
          }

          if (chapterQuestions.length > 0) {
            const docContent: IDocContent = {
              fileID: `chapter-local-${bankType}-${chapter}-${Date.now()}`,
              fileName: `${studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType} - 第 ${chapter} 章 (本地)`,
              lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
              questions: chapterQuestions,
              originalContent: null
            };

            setCurrentContent(docContent);
            setStudentViewMode('questions');

            const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
            addToast({
              color: "success",
              title: TOAST_MESSAGES.SUCCESS.LOAD,
              description: `${chapterQuestions.length} 個題目`,
            });
          } else {
            const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
            addToast({
              color: "warning",
              title: TOAST_MESSAGES.WARNING.NO_CONTENT,
              description: "",
            });

            setCurrentContent(null);
            setStudentViewMode('chapterSelection');
          }
        } else {
          const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
          addToast({
            color: "primary",
            title: TOAST_MESSAGES.WARNING.NO_CONTENT,
            description: "",
          });

          setCurrentContent(null);
          setStudentViewMode('chapterSelection');
        }
      }
    } catch (error) {
      console.error("Error loading student questions:", error);
      const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
      addToast({
        color: "danger",
        title: TOAST_MESSAGES.ERROR.LOAD,
        description: "",
      });

      setCurrentContent(null);
      setStudentViewMode('chapterSelection');
    } finally {
      setIsLoading(false);
    }
  };

  // 老師/助教載入題庫章節列表
  const loadTeacherChapters = async (questionBankType: string) => {
    setIsLoading(true);
    try {
      // 從資料庫載入
      const dbDocs = await fetchExcelFileList(questionBankType);

      if (dbDocs && dbDocs.length > 0) {
        const allChapters = new Set<string>();

        for (const file of dbDocs) {
          try {
            const questionsResult = await fetchExcelQuestions(file.fileID);
            questionsResult.questions.forEach(q => {
              if (q.category && q.category.trim() !== "") {
                allChapters.add(q.category.trim());
              }
            });
          } catch (error) {
            console.error(`載入檔案 ${file.fileName} 的題目失敗:`, error);
          }
        }

        // 排序章節
        const sortedChapters = Array.from(allChapters).sort((a, b) => {
          const aNum = parseInt(a);
          const bNum = parseInt(b);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a.localeCompare(b);
        });

        setTeacherAvailableChapters(sortedChapters);
        setTeacherSelectedQuestionBank(questionBankType);
        setTeacherChapterViewMode('chapterSelection');

        const bankLabel = studentQuestionBanks.find(bank => bank.key === questionBankType)?.label || questionBankType;
        addToast({
          color: "success",
          title: "章節載入成功",
          description: `已載入 ${bankLabel} 共 ${sortedChapters.length} 個章節`,
        });
      } else {
        // 從本地載入
        const localDocs = loadLocalStorageDocsList(questionBankType);
        if (localDocs && localDocs.length > 0) {
          const allChapters = new Set<string>();

          for (const file of localDocs) {
            try {
              const fileContent = getFileContent(file.fileID);
              if (fileContent) {
                const questions = parseExcelContent(fileContent);
                questions.forEach(q => {
                  if (q.category && q.category.trim() !== "") {
                    allChapters.add(q.category.trim());
                  }
                });
              }
            } catch (error) {
              console.error(`載入本地檔案 ${file.fileName} 的題目失敗:`, error);
            }
          }

          const sortedChapters = Array.from(allChapters).sort((a, b) => {
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            return a.localeCompare(b);
          });

          setTeacherAvailableChapters(sortedChapters);
          setTeacherSelectedQuestionBank(questionBankType);
          setTeacherChapterViewMode('chapterSelection');

          const bankLabel = studentQuestionBanks.find(bank => bank.key === questionBankType)?.label || questionBankType;
          addToast({
            color: "success",
            title: "章節載入成功 (本地緩存)",
            description: `已載入 ${bankLabel} 共 ${sortedChapters.length} 個章節`,
          });
        } else {
          const bankLabel = studentQuestionBanks.find(bank => bank.key === questionBankType)?.label || questionBankType;
          addToast({
            color: "warning",
            title: "暫無章節",
            description: `目前沒有可用的${bankLabel}章節`,
          });

          setTeacherChapterViewMode('bankSelection');
        }
      }
    } catch (error) {
      console.error("Error loading teacher chapters:", error);
      const bankLabel = studentQuestionBanks.find(bank => bank.key === questionBankType)?.label || questionBankType;
      addToast({
        color: "danger",
        title: "載入失敗",
        description: `無法載入${bankLabel}章節，請稍後再試`,
      });

      setTeacherChapterViewMode('bankSelection');
    } finally {
      setIsLoading(false);
    }
  };

  // 老師/助教載入指定章節題目
  const loadTeacherQuestions = async (questionBankType?: string, chapterFilter?: string) => {
    const bankType = questionBankType || teacherSelectedQuestionBank;
    const chapter = chapterFilter || teacherSelectedChapter;

    if (!chapter) {
      addToast({
        color: "warning",
        title: "請選擇章節",
        description: "請先選擇要查看的章節",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 從資料庫載入
      const dbDocs = await fetchExcelFileList(bankType);

      if (dbDocs && dbDocs.length > 0) {
        const chapterQuestions: IExcelQuestion[] = [];
        let totalFiles = 0;
        let successFiles = 0;

        for (const file of dbDocs) {
          try {
            totalFiles++;
            const questionsResult = await fetchExcelQuestions(file.fileID);
            const filteredQuestions = questionsResult.questions
              .filter(q => q.category === chapter)
              .map(q => ({
                ...q,
                id: `${file.fileID}-${q.id}`, 
                sourceFile: file.fileName, 
                sourceFileId: file.fileID 
              }));

            if (filteredQuestions.length > 0) {
              chapterQuestions.push(...filteredQuestions);
              successFiles++;
            }
          } catch (error) {
            console.error(`載入檔案 ${file.fileName} 的題目失敗:`, error);
          }
        }

        if (chapterQuestions.length > 0) {
          // 創建章節題目內容
          const docContent: IDocContent = {
            fileID: `teacher-chapter-${bankType}-${chapter}-${Date.now()}`,
            fileName: `${studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType} - 第 ${chapter} 章 (章節瀏覽)`,
            lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
            questions: chapterQuestions,
            originalContent: null
          };

          setCurrentContent(docContent);
          setTeacherChapterViewMode('questions');

          const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
          addToast({
            color: "success",
            title: TOAST_MESSAGES.SUCCESS.LOAD,
            description: `${chapterQuestions.length} 個題目`,
          });
        } else {
          const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
          addToast({
            color: "warning",
            title: "暫無題目",
            description: `第 ${chapter} 章目前沒有可用的${bankLabel}題目`,
          });

          setCurrentContent(null);
          setTeacherChapterViewMode('chapterSelection');
        }
      } else {
        // 從本地載入指定章節的題目
        const localDocs = loadLocalStorageDocsList(bankType);
        if (localDocs && localDocs.length > 0) {
          const chapterQuestions: IExcelQuestion[] = [];
          let totalFiles = 0;
          let successFiles = 0;

          for (const file of localDocs) {
            try {
              totalFiles++;
              const fileContent = getFileContent(file.fileID);

              if (fileContent) {
                const questions = parseExcelContent(fileContent);
                const filteredQuestions = questions
                  .filter(q => q.category === chapter)
                  .map(q => ({
                    ...q,
                    id: `${file.fileID}-${q.id}`, 
                    sourceFile: file.fileName, 
                    sourceFileId: file.fileID 
                  }));

                if (filteredQuestions.length > 0) {
                  chapterQuestions.push(...filteredQuestions);
                  successFiles++;
                }
              }
            } catch (error) {
              console.error(`載入本地檔案 ${file.fileName} 的題目失敗:`, error);
            }
          }

          if (chapterQuestions.length > 0) {
            const docContent: IDocContent = {
              fileID: `teacher-chapter-local-${bankType}-${chapter}-${Date.now()}`,
              fileName: `${studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType} - 第 ${chapter} 章 (章節瀏覽-本地)`,
              lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
              questions: chapterQuestions,
              originalContent: null
            };

            setCurrentContent(docContent);
            setTeacherChapterViewMode('questions');

            const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
            addToast({
              color: "success",
              title: TOAST_MESSAGES.SUCCESS.LOAD,
              description: `${chapterQuestions.length} 個題目`,
            });
          } else {
            const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
            addToast({
              color: "warning",
              title: "暫無題目",
              description: `第 ${chapter} 章目前沒有可用的本地${bankLabel}題目`,
            });

            setCurrentContent(null);
            setTeacherChapterViewMode('chapterSelection');
          }
        } else {
          const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
          addToast({
            color: "primary",
            title: "暫無題目",
            description: `目前沒有可用的${bankLabel}題目`,
          });

          setCurrentContent(null);
          setTeacherChapterViewMode('chapterSelection');
        }
      }
    } catch (error) {
      console.error("Error loading teacher questions:", error);
      const bankLabel = studentQuestionBanks.find(bank => bank.key === bankType)?.label || bankType;
      addToast({
        color: "danger",
        title: "載入失敗",
        description: `無法載入${bankLabel}第 ${chapter} 章題目，請稍後再試`,
      });

      setCurrentContent(null);
      setTeacherChapterViewMode('chapterSelection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col">
        {/* 如果用戶未登入，顯示登入提示 */}
        {isUnsigned ? (
          <div className="flex items-center justify-center h-[90vh]">
            <div className="flex flex-col justify-center items-center h-full w-3/6 gap-5">
              <h1 className="text-3xl font-bold mb-4">題庫</h1>
              <p className="text-lg text-default-600 mb-6 text-center">
                請先登入以閱覽題庫功能
              </p>
              <Button
                className="border text-medium border-none"
                as={Link}
                href="/login"
                color="primary"
                size="lg"
              >
                立即登入
              </Button>
            </div>
          </div>
        ) : (
          /* 已登入用戶介面 */
          <>
            {/* 如果是學生，只顯示題目頁面 */}
            {isStudent ? (
              <div className="p-4">
                {isLoading && (
                  <div className="flex justify-center items-center h-64">
                    <Spinner
                      color="success"
                      label="載入中..."
                    />
                  </div>
                )}

                {!isLoading && studentViewMode === 'bankSelection' && (
                  /* 學生題庫選擇頁面 */
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold mb-4">選擇題庫</h1>
                      <p className="text-lg text-default-600">請選擇您要練習的題庫類型</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {studentQuestionBanks.map((bank) => (
                        <div
                          key={bank.key}
                          className="bg-content1 shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary select-none"
                          style={{ userSelect: 'none' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('題庫卡片被點擊:', bank.key);
                            loadStudentChapters(bank.key);
                          }}
                        >
                          <div className="text-center pointer-events-none">
                            <h3 className="text-xl font-semibold mb-3">{bank.label}</h3>
                            <p className="text-default-600 mb-4">{bank.description}</p>
                            <div className="w-full bg-primary text-primary-foreground rounded-medium px-4 py-2 text-sm font-medium">
                              選擇題庫
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-sm text-default-500">
                        點擊上方卡片選擇題庫，然後選擇章節開始練習
                      </p>
                    </div>
                  </div>
                )}

                {!isLoading && studentViewMode === 'chapterSelection' && (
                  /* 學生章節選擇頁面 */
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold mb-4">
                        {studentQuestionBanks.find(bank => bank.key === selectedQuestionBank)?.label || "選擇章節"}
                      </h1>
                      <Button
                        color="default"
                        variant="solid"
                        size="sm"
                        className="mt-2"
                        onPress={() => {
                          setStudentViewMode('bankSelection');
                          setAvailableStudentChapters([]);
                          setSelectedStudentChapter("");
                        }}
                      >
                        返回題庫選擇
                      </Button>
                    </div>

                    {availableStudentChapters.length > 0 ? (
                      <div className="bg-content1 shadow-lg rounded-lg p-6">
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-full max-w-md">
                            <label className="block text-lg font-medium mb-3 text-center">
                              選擇章節
                            </label>
                            <Select
                              size="lg"
                              placeholder="請選擇要練習的章節"
                              selectionMode="single"
                              selectedKeys={selectedStudentChapter ? [selectedStudentChapter] : []}
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                if (selected) {
                                  setSelectedStudentChapter(selected);
                                }
                              }}
                              className="w-full"
                              classNames={{
                                trigger: "min-h-12",
                                value: "text-lg"
                              }}
                              renderValue={(items) => {
                                if (items.length === 0) return "";
                                return `第 ${items[0].key} 章`;
                              }}
                            >
                              {availableStudentChapters.map((chapter) => (
                                <SelectItem key={chapter}>
                                  第 {chapter} 章
                                </SelectItem>
                              ))}
                            </Select>
                          </div>

                          <Button
                            color="primary"
                            size="lg"
                            className="px-8"
                            isDisabled={!selectedStudentChapter}
                            onPress={() => {
                              if (selectedStudentChapter) {
                                loadStudentQuestions(selectedQuestionBank, selectedStudentChapter);
                              }
                            }}
                          >
                            開始練習
                          </Button>

                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <p className="text-xl font-medium mb-2">暫無可用章節</p>
                        <p className="text-default-500 mb-4">此題庫目前沒有可用的章節</p>
                        <Button
                          color="default"
                          variant="solid"
                          onPress={() => setStudentViewMode('bankSelection')}
                        >
                          返回題庫選擇
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!isLoading && studentViewMode === 'questions' && currentContent && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold">
                          {currentContent.fileName}
                        </h2>
                        <Button
                          color="default"
                          variant="solid"
                          size="sm"
                          onPress={() => {
                            setStudentViewMode('chapterSelection');
                            setCurrentContent(null);
                            setSelectedChapter("all");
                            setAvailableChapters([]);
                          }}
                        >
                          返回章節選擇
                        </Button>
                      </div>
                    </div>
                    {renderQuestionList()}
                  </div>
                )}

                {!isLoading && studentViewMode === 'questions' && !currentContent && (
                  <div className="text-center p-8">
                    <p className="text-xl font-medium mb-2">暫無可用題目</p>
                    <p className="text-default-500 mb-4">請聯繫老師或助教上傳題目</p>
                    <Button
                      color="default"
                      variant="solid"
                      onPress={() => setStudentViewMode('chapterSelection')}
                    >
                      返回章節選擇
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* 教師/助教介面 */
              <>
                {viewMode === 'list' ? (
                  <div className="flex flex-col md:flex-row p-2 gap-2">
                    <div className="mt-1 mx-3 w-full md:w-[15rem]">
                      {isTeacherOrTA && (
                        <div className="mb-4">
                          <h3 className="text-md font-medium mb-2">上傳考古題/文件</h3>
                          <FileUploadButton
                            onFileUpload={handleFileUpload}
                            acceptedFileTypes=".xlsx,.xls,.docx,.pptx,.pdf"
                          />
                        </div>
                      )}

                      <Listbox
                        disallowEmptySelection
                        className="h-full w-full mt-2"
                        onAction={(key) => loadFileList(key as string)}
                        variant="flat"
                        selectionMode="single"
                        aria-label="Actions"
                        items={documentationTypeList}
                        emptyContent={
                          <Spinner
                            color="success"
                            label={LanguageTable.docs.page.loading[language]}
                          />
                        }
                      >
                        {(item) => <ListboxItem key={item.key}>{item.label}</ListboxItem>}
                      </Listbox>
                    </div>

                    <div className="w-full">
                      {renderTitle()}

                      {/* 新增：檔案管理和章節瀏覽模式切換 */}
                      <div className="mb-4 flex gap-2">
                        <Button
                          color="primary"
                          variant="solid"
                          size="sm"
                          onPress={() => {
                            setViewMode('list');
                            setCurrentContent(null);
                            setTeacherChapterViewMode('bankSelection');
                          }}
                        >
                          檔案管理
                        </Button>
                        <Button
                          color="default"
                          variant="light"
                          size="sm"
                          onPress={() => {
                            setViewMode('chapterBrowse');
                            setCurrentContent(null);
                            setTeacherChapterViewMode('bankSelection');
                          }}
                        >
                          章節瀏覽
                        </Button>
                      </div>

                      <Table isStriped aria-label="Docs page" className="w-full">
                        <TableHeader>
                          <TableColumn key="name">
                            {LanguageTable.docs.page.lessonName[language]}
                          </TableColumn>
                          <TableColumn key="lastUpdate">
                            {LanguageTable.docs.page.lastUpdate[language]}
                          </TableColumn>
                          {/* Always include the column but conditionally show content */}
                          <TableColumn
                            key="actions"
                            align="center"
                            width={100}
                          >
                            {isTeacherOrTA ? "操作" : ""}
                          </TableColumn>
                        </TableHeader>
                        <TableBody
                          items={fileList}
                          isLoading={isLoading}
                          loadingContent={
                            <Spinner
                              color="success"
                              label={LanguageTable.docs.page.loading[language]}
                            />
                          }
                        >
                          {(item: IDocsFormat) => (
                            <TableRow key={item.fileID}>
                              <TableCell>
                                <Link
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDocClick(item);
                                  }}
                                  underline="none"
                                >
                                  {item.fileName}
                                </Link>
                              </TableCell>
                              <TableCell> {item.lastUpdate} </TableCell>
                              <TableCell className={isTeacherOrTA ? "" : "hidden"}>
                                {isTeacherOrTA && (
                                  <Button
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    onPress={() => handleEditClick(item)}
                                  >
                                    編輯
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : viewMode === 'chapterBrowse' ? (
                  /* 老師/助教章節瀏覽 */
                  <div className="p-4">
                    {isLoading && (
                      <div className="flex justify-center items-center h-64">
                        <Spinner
                          color="success"
                          label="載入中..."
                        />
                      </div>
                    )}

                    {!isLoading && teacherChapterViewMode === 'bankSelection' && (
                      /* 老師/助教題庫選擇頁面 */
                      <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                          <h1 className="text-3xl font-bold mb-4">章節瀏覽 - 選擇題庫</h1>
                          <p className="text-lg text-default-600">請選擇您要瀏覽的題庫類型</p>

                          {/* 模式切換按鈕 */}
                          <div className="mt-4 mb-4 flex justify-center gap-2">
                            <Button
                              color="default"
                              variant="light"
                              size="sm"
                              onPress={() => {
                                setViewMode('list');
                                setTeacherChapterViewMode('bankSelection');
                              }}
                            >
                              檔案管理
                            </Button>
                            <Button
                              color="primary"
                              variant="solid"
                              size="sm"
                              onPress={() => {
                                setViewMode('chapterBrowse');
                                setCurrentContent(null);
                                setTeacherChapterViewMode('bankSelection');
                              }}
                            >
                              章節瀏覽
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {studentQuestionBanks.map((bank) => (
                            <div
                              key={bank.key}
                              className="bg-content1 shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary select-none"
                              style={{ userSelect: 'none' }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('老師題庫卡片被點擊:', bank.key);
                                loadTeacherChapters(bank.key);
                              }}
                            >
                              <div className="text-center pointer-events-none">
                                <h3 className="text-xl font-semibold mb-3">{bank.label}</h3>
                                <p className="text-default-600 mb-4">{bank.description}</p>
                                <div className="w-full bg-primary text-primary-foreground rounded-medium px-4 py-2 text-sm font-medium">
                                  瀏覽題庫
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 text-center">
                          <p className="text-sm text-default-500">
                            點擊上方卡片選擇題庫，然後選擇章節瀏覽題目
                          </p>
                        </div>
                      </div>
                    )}

                    {!isLoading && teacherChapterViewMode === 'chapterSelection' && (
                      /* 老師/助教章節選擇頁面 */
                      <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                          <h1 className="text-3xl font-bold mb-4">
                            {studentQuestionBanks.find(bank => bank.key === teacherSelectedQuestionBank)?.label || "選擇章節"}
                          </h1>
                          <Button
                            color="default"
                            variant="solid"
                            size="sm"
                            className="mt-2"
                            onPress={() => {
                              setTeacherChapterViewMode('bankSelection');
                              setTeacherAvailableChapters([]);
                              setTeacherSelectedChapter("");
                            }}
                          >
                            返回題庫選擇
                          </Button>
                        </div>

                        {teacherAvailableChapters.length > 0 ? (
                          <div className="bg-content1 shadow-lg rounded-lg p-6">
                            <div className="flex flex-col items-center gap-6">
                              <div className="w-full max-w-md">
                                <label className="block text-lg font-medium mb-3 text-center">
                                  選擇章節
                                </label>
                                <Select
                                  size="lg"
                                  placeholder="請選擇要瀏覽的章節"
                                  selectionMode="single"
                                  selectedKeys={teacherSelectedChapter ? [teacherSelectedChapter] : []}
                                  onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0] as string;
                                    if (selected) {
                                      setTeacherSelectedChapter(selected);
                                    }
                                  }}
                                  className="w-full"
                                  classNames={{
                                    trigger: "min-h-12",
                                    value: "text-lg"
                                  }}
                                  renderValue={(items) => {
                                    if (items.length === 0) return "";
                                    return `第 ${items[0].key} 章`;
                                  }}
                                >
                                  {teacherAvailableChapters.map((chapter) => (
                                    <SelectItem key={chapter}>
                                      第 {chapter} 章
                                    </SelectItem>
                                  ))}
                                </Select>
                              </div>

                              <Button
                                color="primary"
                                size="lg"
                                className="px-8"
                                isDisabled={!teacherSelectedChapter}
                                onPress={() => {
                                  if (teacherSelectedChapter) {
                                    loadTeacherQuestions(teacherSelectedQuestionBank, teacherSelectedChapter);
                                  }
                                }}
                              >
                                瀏覽題目
                              </Button>

                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-8">
                            <p className="text-xl font-medium mb-2">暫無可用章節</p>
                            <p className="text-default-500 mb-4">此題庫目前沒有可用的章節</p>
                            <Button
                              color="primary"
                              variant="light"
                              onPress={() => setTeacherChapterViewMode('bankSelection')}
                            >
                              返回題庫選擇
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isLoading && teacherChapterViewMode === 'questions' && currentContent && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold">
                              {currentContent.fileName}
                            </h2>
                            <Button
                              color="default"
                              variant="light"
                              size="sm"
                              onPress={() => {
                                setTeacherChapterViewMode('chapterSelection');
                                setCurrentContent(null);
                                setSelectedChapter("all");
                                setAvailableChapters([]);
                              }}
                            >
                              返回章節選擇
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            {isTeacherOrTA && (
                              <>
                                <Button color="primary" onPress={handleAddQuestion}>
                                  新增題目
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {renderQuestionList()}
                      </div>
                    )}

                    {!isLoading && teacherChapterViewMode === 'questions' && !currentContent && (
                      <div className="text-center p-8">
                        <p className="text-xl font-medium mb-2">暫無可用題目</p>
                        <p className="text-default-500 mb-4">此章節目前沒有可用的題目</p>
                        <Button
                          color="primary"
                          variant="light"
                          onPress={() => setTeacherChapterViewMode('chapterSelection')}
                        >
                          返回章節選擇
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    {currentContent && (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-bold">{currentContent.fileName}</h2>
                          <div className="flex gap-2">
                            <Button color="default" variant="light" onPress={handleBackToList}>
                              返回文件列表
                            </Button>
                            {isTeacherOrTA && (
                              <>
                                <Button color="primary" onPress={handleAddQuestion}>
                                  新增題目
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {renderQuestionList()}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* 文件編輯對話框 */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                編輯文件
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-small font-medium mb-1">
                      文件名稱
                    </label>
                    <Input
                      label="文件名稱"
                      placeholder="輸入文件名稱"
                      value={editFileName}
                      onChange={(e) => setEditFileName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-small font-medium mb-1">
                      替換文件
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onPress={handleSelectFileClick}
                      >
                        選擇檔案
                      </Button>
                      <span className="text-small">
                        {selectedFile ? selectedFile.name : "未選擇文件"}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".xlsx,.xls,.docx,.pptx,.pdf"
                      />
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleDeleteDoc}
                  isDisabled={isEditing}
                >
                  刪除文件
                </Button>
                <Button
                  color="default"
                  variant="light"
                  onPress={() => onOpenChange()}
                >
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdateDoc}
                  isLoading={isEditing}
                >
                  更新
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 題目編輯對話框 */}
      <Modal
        isOpen={editQuestionModal}
        onOpenChange={(open) => {
          if (!open) setEditQuestionModal(false);
        }}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "max-h-[70vh] overflow-y-auto"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 sticky top-0 z-10 bg-background">
                {editingQuestion?.id.startsWith('new-') ? '新增題目' : '編輯題目'}
              </ModalHeader>
              <ModalBody className="overflow-y-auto">
                {editingQuestion && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-small font-medium mb-1">
                        題目內容
                      </label>
                      <Textarea
                        label="題目內容"
                        placeholder="輸入題目內容"
                        value={editingQuestion.question}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          question: e.target.value
                        })}
                        minRows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-small font-medium mb-2">
                        選項
                      </label>
                      <div className="space-y-2">
                        {editingQuestion.options.map((option, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Input
                              label={`選項 ${index + 1}`}
                              placeholder={`輸入選項 ${index + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...editingQuestion.options];
                                newOptions[index] = e.target.value;
                                setEditingQuestion({
                                  ...editingQuestion,
                                  options: newOptions
                                });
                              }}
                              className="flex-1"
                            />
                            <Button
                              color="danger"
                              size="sm"
                              isIconOnly
                              variant="light"
                              onPress={() => {
                                const newOptions = editingQuestion.options.filter((_, i) => i !== index);
                                const newAnswer = editingQuestion.answer === option ? '' : editingQuestion.answer;
                                setEditingQuestion({
                                  ...editingQuestion,
                                  options: newOptions,
                                  answer: newAnswer
                                });
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                        <Button
                          color="primary"
                          variant="light"
                          size="sm"
                          onPress={() => {
                            setEditingQuestion({
                              ...editingQuestion,
                              options: [...editingQuestion.options, '']
                            });
                          }}
                          className="mt-2"
                        >
                          新增選項
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-small font-medium mb-1">
                        正確答案
                      </label>
                      <Select
                        label="選擇正確答案"
                        placeholder="選擇正確答案"
                        selectedKeys={[editingQuestion.answer]}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          setEditingQuestion({
                            ...editingQuestion,
                            answer: selected
                          });
                        }}
                        className="max-w-xs"
                      >
                        {editingQuestion.options.map((option, index) => (
                          <SelectItem key={option}>
                            {option || `選項 ${index + 1}`}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* 新增圖片顯示區域 */}
                    {((editingQuestion.pictures?.length ?? 0) > 0 || editingQuestion.picture) && (
                      <div className="mb-4 p-2 border border-divider rounded-md">
                        <div className="font-semibold mb-2">題目圖片：</div>

                        {/* 多張圖片的情況 */}
                        {editingQuestion.pictures && editingQuestion.pictures.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {editingQuestion.pictures.map((picSrc, index) => (
                              <div key={index} className="flex justify-center">
                                <Image
                                  src={picSrc}
                                  alt={`題目圖片 ${index + 1}`}
                                  className="max-w-full max-h-64 object-contain border border-divider rounded-md"
                                  onError={() => console.warn(`圖片載入失敗: ${picSrc}`)}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* 僅有單張圖片 */
                          editingQuestion.picture && (
                            <div className="flex justify-center">
                              <Image
                                src={editingQuestion.picture}
                                alt="題目圖片"
                                className="max-w-full max-h-64 object-contain border border-divider rounded-md"
                                onError={() => console.warn(`圖片載入失敗: ${editingQuestion.picture}`)}
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-small font-medium mb-1">
                          章節
                        </label>
                        <Input
                          label="章節"
                          placeholder="輸入題目章節"
                          value={editingQuestion.category}
                          onChange={(e) => setEditingQuestion({
                            ...editingQuestion,
                            category: e.target.value
                          })}
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-small font-medium mb-1">
                          難度
                        </label>
                        <Select
                          label="選擇難度"
                          placeholder="選擇難度"
                          selectedKeys={[editingQuestion.difficulty]}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;
                            setEditingQuestion({
                              ...editingQuestion,
                              difficulty: selected
                            });
                          }}
                        >
                          <SelectItem key="簡單">簡單</SelectItem>
                          <SelectItem key="普通">普通</SelectItem>
                          <SelectItem key="困難">困難</SelectItem>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  onPress={() => setEditQuestionModal(false)}
                >
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={editingQuestion?.id.startsWith('new-') ? saveNewQuestion : saveEditedQuestion}
                >
                  儲存
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}
