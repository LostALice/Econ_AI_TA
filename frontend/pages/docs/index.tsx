// Code by AkinoAlice@TyrantRey

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
  Tabs,
  Tab,
  Select,
  SelectItem,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

import { LanguageTable } from "@/i18n";
import { LangContext } from "@/contexts/LangContext";
import { AuthContext } from "@/contexts/AuthContext";

import { IDocsFormat } from "@/types/api/types";
import { IExcelQuestion, IDocContent } from "@/types/global";

import { FileUploadButton } from "@/components/upload/fileUpload-btn";

// 用於在本地存儲模擬文件列表
const LOCAL_STORAGE_DOCS_KEY = "mock_docs_list";
const LOCAL_STORAGE_DOCS_CONTENT_KEY = "mock_docs_content";

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
  const [viewMode, setViewMode] = useState<'list' | 'questions'>('list');
  const [editingQuestion, setEditingQuestion] = useState<IExcelQuestion | null>(null);
  const [editQuestionModal, setEditQuestionModal] = useState<boolean>(false);

  // 根據 userInfo.role 判斷是否為教師或助教，注意使用原始角色值而非轉換後的顯示名稱
  // 修改為使用顯示角色判斷，因為原始角色值可能不正確
  const isTeacherOrTA = userInfo?.role === 'teacher' || userInfo?.role === 'ta' || userInfo?.role === 'admin' || 
                         role === LanguageTable.login.role.teacher[language] || 
                         role === LanguageTable.login.role.ta[language] || 
                         role === LanguageTable.nav.role.admin[language];

  // 輸出調試信息，幫助排查問題
  useEffect(() => {
    console.log("====== 角色狀態檢查 ======");
    console.log("DocsPage - Current role (display name):", role);
    console.log("DocsPage - userInfo:", userInfo);
    console.log("DocsPage - isTeacherOrTA:", isTeacherOrTA);
    console.log("DocsPage - isLoggedIn:", isLoggedIn);
    console.log("DocsPage - 判斷條件:", {
      '是否有 userInfo': !!userInfo,
      'userInfo.role 值': userInfo?.role,
      '是否為 teacher': userInfo?.role === 'teacher',
      '是否為 ta': userInfo?.role === 'ta',
      '是否為 admin': userInfo?.role === 'admin',
      '最終判斷結果': isTeacherOrTA
    });
    console.log("==========================");
  }, [role, userInfo, isTeacherOrTA, isLoggedIn]);

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

  // 載入文件列表，只使用用戶上傳的文件
  async function loadFileList(documentationType: string) {
    setIsLoading(true);
    setCurrentDocType(documentationType);
    setViewMode('list'); // 重置視圖模式
    
    try {
      // 從本地存儲獲取用戶上傳的文件列表
      const localDocs = loadLocalStorageDocsList(documentationType);
      
      setFileList(localDocs);
      
      if (localDocs.length > 0) {
        addToast({
          color: "success",
          title: "文件載入成功",
          description: `已成功載入 ${localDocs.length} 個${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
        });
      } else {
        addToast({
          color: "primary",
          title: "尚無文件",
          description: `請上傳${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
        });
      }
    } catch (error) {
      console.error("Error loading file list:", error);
      addToast({
        color: "danger",
        title: "載入失敗",
        description: "無法載入文件列表，請稍後再試",
      });
      
      // 重置文件列表
      setFileList([]);
    } finally {
      setIsLoading(false);
    }
  }

  // 生成空的數據列表而不是模擬數據
  const generateMockData = (docType: string, count: number): IDocsFormat[] => {
    return []; // 返回空數組，不再生成模擬數據
  };

  // 保存文件內容到本地存儲
  const saveFileContent = (fileID: string, content: any) => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_DOCS_CONTENT_KEY);
      const parsedData = storedData ? JSON.parse(storedData) : {};
      
      parsedData[fileID] = content;
      localStorage.setItem(LOCAL_STORAGE_DOCS_CONTENT_KEY, JSON.stringify(parsedData));
    } catch (error) {
      console.error("Error saving file content to localStorage:", error);
    }
  };

  // 從本地存儲獲取文件內容
  const getFileContent = (fileID: string): any => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_DOCS_CONTENT_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        return parsedData[fileID] || null;
      }
    } catch (error) {
      console.error("Error loading file content from localStorage:", error);
    }
    return null;
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

      // 假設第一個工作表包含題目
      const firstSheetName = data.SheetNames[0];
      const worksheet = data.Sheets[firstSheetName];
      
      // 將工作表轉換為JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // 檢查是否為空
      if (!jsonData || jsonData.length === 0) {
        console.error("Excel 檔案中沒有找到任何數據");
        return [];
      }
      
      // 檢測檔案格式，輸出首行做為調試資訊
      console.log("Excel 首行資料:", jsonData[0]);
      
      // 將JSON資料轉換為題目格式，根據檢測到的欄位進行適配
      const questions: IExcelQuestion[] = jsonData.map((row: any, index: number) => {
        // 檢測並適配特定的欄位格式
        // 支援以下欄位：
        // QuestionNo. ChapterNo QuestionInChinese AnswerAInChinese AnswerBInChinese AnswerCInChinese AnswerDInChinese CorrectAnswer AnswerExplainInChinese
        
        // 優先檢查指定的欄位格式
        if (row.QuestionInChinese !== undefined) {
          // 獲取所有可能的選項欄位
          const options = [];
          if (row.AnswerAInChinese) options.push(row.AnswerAInChinese);
          if (row.AnswerBInChinese) options.push(row.AnswerBInChinese);
          if (row.AnswerCInChinese) options.push(row.AnswerCInChinese);
          if (row.AnswerDInChinese) options.push(row.AnswerDInChinese);
          
          // 獲取正確答案
          let correctAnswer = row.CorrectAnswer || "";
          
          // 如果正確答案是選項代號 (A, B, C, D) 而不是選項內容本身，則將其轉換為選項內容
          if (correctAnswer === "A" && row.AnswerAInChinese) correctAnswer = row.AnswerAInChinese;
          else if (correctAnswer === "B" && row.AnswerBInChinese) correctAnswer = row.AnswerBInChinese;
          else if (correctAnswer === "C" && row.AnswerCInChinese) correctAnswer = row.AnswerCInChinese;
          else if (correctAnswer === "D" && row.AnswerDInChinese) correctAnswer = row.AnswerDInChinese;
          
          return {
            id: (row.QuestionNo || index + 1).toString(),
            question: row.QuestionInChinese || "未定義題目",
            options: options,
            answer: correctAnswer,
            category: row.ChapterNo?.toString() || "",
            difficulty: "普通",
            modified: false
          };
        } 
        // 備用：檢查常見的其他欄位命名
        else if (row.Question || row.question) {
          // 檢查常見的問題欄位命名
          const questionContent = row.Question || row.question || row.QuestionContent || row.Content || "未定義題目";
          
          // 檢查各種可能的選項欄位命名
          const optionFields = [
            // 常見的選項欄位命名
            { field: 'option1', fallbacks: ['Option1', 'OptionA', 'optionA', 'AnswerA', 'answerA', 'A'] },
            { field: 'option2', fallbacks: ['Option2', 'OptionB', 'optionB', 'AnswerB', 'answerB', 'B'] },
            { field: 'option3', fallbacks: ['Option3', 'OptionC', 'optionC', 'AnswerC', 'answerC', 'C'] },
            { field: 'option4', fallbacks: ['Option4', 'OptionD', 'optionD', 'AnswerD', 'answerD', 'D'] },
          ];
          
          const options = [];
          
          for (const optionField of optionFields) {
            // 檢查主欄位和備用欄位
            let optionValue = row[optionField.field];
            if (optionValue === undefined) {
              // 嘗試備用欄位
              for (const fallback of optionField.fallbacks) {
                if (row[fallback] !== undefined) {
                  optionValue = row[fallback];
                  break;
                }
              }
            }
            
            // 只添加非空選項
            if (optionValue && typeof optionValue === 'string' && optionValue.trim() !== '') {
              options.push(optionValue);
            }
          }
          
          // 檢查各種可能的答案欄位命名
          const answerField = row.answer || row.Answer || row.correctAnswer || row.CorrectAnswer || '';
          
          return {
            id: row.id?.toString() || row.ID?.toString() || row.QuestionNo?.toString() || (index + 1).toString(),
            question: questionContent,
            options: options,
            answer: answerField,
            category: row.category || row.Category || row.chapter || row.Chapter || row.ChapterNo?.toString() || "",
            difficulty: row.difficulty || row.Difficulty || "普通",
            modified: false
          };
        } else {
          // 如果找不到任何已知格式，用欄位名稱來猜測
          const columns = Object.keys(row);
          
          // 尋找可能是問題的欄位（包含 'question'、'題目'、'問題' 等字樣）
          const questionColumns = columns.filter(col => 
            col.toLowerCase().includes('question') || 
            col.includes('題目') || 
            col.includes('問題') ||
            col.includes('Chinese')
          );
          
          // 尋找可能是選項的欄位（包含 'option'、'answer'、'選項' 等字樣）
          const optionColumns = columns.filter(col => 
            col.toLowerCase().includes('option') || 
            col.toLowerCase().includes('answer') || 
            col.includes('選項') ||
            col.match(/[A-D]/) // 包含 A、B、C、D 的欄位可能是選項
          );
          
          // 尋找可能是正確答案的欄位（包含 'correct'、'正確' 等字樣）
          const correctColumns = columns.filter(col => 
            col.toLowerCase().includes('correct') || 
            col.includes('正確')
          );
          
          // 取第一個可能是問題的欄位
          const questionField = questionColumns.length > 0 ? questionColumns[0] : '';
          
          // 從可能的選項欄位中獲取選項
          const options = optionColumns
            .map(col => row[col])
            .filter(val => val !== undefined && val !== null && val !== '');
          
          // 取第一個可能是正確答案的欄位
          const correctField = correctColumns.length > 0 ? correctColumns[0] : '';
          
          return {
            id: (index + 1).toString(),
            question: questionField ? row[questionField] : "未定義題目",
            options: options,
            answer: correctField ? row[correctField] : "",
            category: "",
            difficulty: "普通",
            modified: false
          };
        }
      });
      
      // 過濾掉沒有題目內容的題目
      return questions.filter(q => q.question && q.question !== "未定義題目");
    } catch (error) {
      console.error("Error parsing Excel content:", error);
      return [];
    }
  };

  // 將題目資料轉換回Excel格式並保存
  const saveQuestionsToExcel = (questions: IExcelQuestion[], fileContent: any): any => {
    try {
      // 檢查原始檔案格式，以保持相同的欄位結構
      const data = fileContent.originalContent;
      const firstSheetName = data.SheetNames[0];
      const worksheet = data.Sheets[firstSheetName];
      const originalData = XLSX.utils.sheet_to_json(worksheet);
      
      // 如果沒有原始數據，使用預設的欄位結構
      if (!originalData || originalData.length === 0) {
        // 將題目轉換為工作表數據
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
        
        // 創建工作簿並添加工作表
        const workbook = fileContent.originalContent || XLSX.utils.book_new();
        const sheetName = workbook.SheetNames && workbook.SheetNames[0] ? workbook.SheetNames[0] : "Sheet1";
        
        // 替換現有工作表或添加新工作表
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName, true);
        
        return {
          ...fileContent,
          originalContent: workbook
        };
      }
      
      // 檢查原始檔案的欄位結構
      const sampleRow = originalData[0] as Record<string, any>;
      
      // 如果檢測到特定欄位格式 (QuestionInChinese 等)
      if (sampleRow.QuestionInChinese !== undefined) {
        const worksheetData = questions.map(q => {
          // 找出對應原始選項的答案字母 (A, B, C, D)
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
            CorrectAnswer: correctAnswerLetter || q.answer, // 優先使用字母，如果找不到對應，使用完整答案
            AnswerExplainInChinese: sampleRow.AnswerExplainInChinese || "" // 保留原始解析，如果有的話
          };
        });
        
        // 創建工作表
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        
        // 創建工作簿並添加工作表
        const workbook = fileContent.originalContent || XLSX.utils.book_new();
        const sheetName = workbook.SheetNames && workbook.SheetNames[0] ? workbook.SheetNames[0] : "Sheet1";
        
        // 替換現有工作表或添加新工作表
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName, true);
        
        return {
          ...fileContent,
          originalContent: workbook
        };
      } else {
        // 對於其他格式，使用通用的欄位結構
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
        
        // 創建工作簿並添加工作表
        const workbook = fileContent.originalContent || XLSX.utils.book_new();
        const sheetName = workbook.SheetNames && workbook.SheetNames[0] ? workbook.SheetNames[0] : "Sheet1";
        
        // 替換現有工作表或添加新工作表
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

  // 處理文件上傳
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      
      // 創建一個新的文件記錄
      const newFileID = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newFile: IDocsFormat = {
        fileID: newFileID,
        fileName: file.name,
        lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
      };
      
      // 讀取文件內容並以 base64 格式保存
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
        }
        
        // 保存文件內容
        saveFileContent(newFileID, fileContent);
        
        // 更新文件列表
        const updatedList = [...fileList, newFile];
        setFileList(updatedList);
        saveLocalStorageDocsList(currentDocType, updatedList);
        
        addToast({
          color: "success",
          title: "上傳成功",
          description: `文件已成功上傳，文件ID: ${newFileID}`,
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
    } catch (error) {
      console.error("Error uploading file:", error);
      addToast({
        color: "danger",
        title: "上傳失敗",
        description: "無法上傳文件，請稍後再試",
      });
      setIsLoading(false);
    }
  };

  // 處理檔案點擊 - 修改為查看題目列表
  const handleDocClick = async (item: IDocsFormat) => {
    try {
      // 檢查是否為本地上傳的文件
      if (item.fileID.startsWith("local-")) {
        const fileContent = getFileContent(item.fileID);
        
        if (fileContent) {
          // 如果是Excel檔案，解析並顯示題目
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
          
          // 對於其他類型的檔案，仍然下載
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
            title: "檔案不存在",
            description: "找不到此檔案的內容",
          });
        }
        
        return;
      }

      // 對於 API 或其他來源的文件，嘗試從 URL 打開
      window.open(`${siteConfig.api_url}/documentation/${item.fileID}`, "_blank");
    } catch (error) {
      console.error("Error handling document click:", error);
      addToast({
        color: "danger",
        title: "載入失敗",
        description: "無法開啟文件，請稍後再試",
      });
    }
  };

  // 回到文件列表
  const handleBackToList = () => {
    setViewMode('list');
    setCurrentContent(null);
  };

  // 將 dataURL 轉換為 Blob
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

  // 處理題目編輯
  const handleEditQuestion = (question: IExcelQuestion) => {
    setEditingQuestion({...question});
    setEditQuestionModal(true);
  };

  // 儲存編輯後的題目
  const saveEditedQuestion = () => {
    if (!editingQuestion || !currentContent) return;

    const updatedQuestions = currentContent.questions.map(q => 
      q.id === editingQuestion.id ? {...editingQuestion, modified: true} : q
    );

    const updatedContent: IDocContent = {
      ...currentContent,
      questions: updatedQuestions,
      lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    // 更新文件列表中的最後更新時間
    const updatedFileList = fileList.map(file => 
      file.fileID === currentContent.fileID 
        ? {...file, lastUpdate: updatedContent.lastUpdate} 
        : file
    );

    // 更新保存的檔案內容
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

    addToast({
      color: "success",
      title: "更新成功",
      description: "題目已成功更新",
    });
  };

  // 刪除題目
  const handleDeleteQuestion = (questionId: string) => {
    if (!currentContent) return;

    const updatedQuestions = currentContent.questions.filter(q => q.id !== questionId);

    const updatedContent: IDocContent = {
      ...currentContent,
      questions: updatedQuestions,
      lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    // 更新文件列表中的最後更新時間
    const updatedFileList = fileList.map(file => 
      file.fileID === currentContent.fileID 
        ? {...file, lastUpdate: updatedContent.lastUpdate} 
        : file
    );

    // 更新保存的檔案內容
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
      title: "刪除成功",
      description: "題目已成功刪除",
    });
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
  const saveNewQuestion = () => {
    if (!editingQuestion || !currentContent) return;

    const updatedQuestions = [...currentContent.questions, editingQuestion];

    const updatedContent: IDocContent = {
      ...currentContent,
      questions: updatedQuestions,
      lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    // 更新文件列表中的最後更新時間
    const updatedFileList = fileList.map(file => 
      file.fileID === currentContent.fileID 
        ? {...file, lastUpdate: updatedContent.lastUpdate} 
        : file
    );

    // 更新保存的檔案內容
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

    addToast({
      color: "success",
      title: "新增成功",
      description: "題目已成功新增",
    });
  };

  // 開啟編輯對話框
  const handleEditClick = (item: IDocsFormat) => {
    setEditingFile(item);
    setEditFileName(item.fileName);
    setSelectedFile(null);
    onOpen();
  };

  // 觸發檔案選擇
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

  // 處理檔案更新
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
            title: "更新成功",
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
            
            // 保存新文件內容
            saveFileContent(editingFile.fileID, fileContent);
            
            // 更新列表中的文件名稱為上傳的文件名稱
            updatedList[fileIndex] = {
              ...updatedList[fileIndex],
              fileName: selectedFile.name,
              lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
            };
            
            // 保存更新後的文件列表
            setFileList(updatedList);
            saveLocalStorageDocsList(currentDocType, updatedList);
            
            addToast({
              color: "success",
              title: "替換成功",
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
        
        // 保存更新後的文件列表
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
  };

  // 處理檔案刪除
  const handleDeleteDoc = async () => {
    if (!editingFile) return;

    setIsEditing(true);

    try {
      // 從文件列表中刪除
      const updatedList = fileList.filter(file => file.fileID !== editingFile.fileID);
      setFileList(updatedList);
      saveLocalStorageDocsList(currentDocType, updatedList);
      
      // 刪除文件內容
      if (editingFile.fileID.startsWith("local-")) {
        try {
          const storedData = localStorage.getItem(LOCAL_STORAGE_DOCS_CONTENT_KEY);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            delete parsedData[editingFile.fileID];
            localStorage.setItem(LOCAL_STORAGE_DOCS_CONTENT_KEY, JSON.stringify(parsedData));
          }
        } catch (error) {
          console.error("Error removing file content from localStorage:", error);
        }
      }
      
      addToast({
        color: "success",
        title: "刪除成功",
        description: "文件已成功刪除",
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

  // 導出檔案
  const handleExportFile = () => {
    if (!currentContent) return;

    try {
      // 從儲存的內容中獲取工作簿
      const fileContent = getFileContent(currentContent.fileID);
      if (!fileContent || !fileContent.originalContent) {
        throw new Error("找不到原始檔案內容");
      }

      // 使用 xlsx 生成檔案並下載
      const workbook = fileContent.originalContent;
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = currentContent.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        color: "success",
        title: "匯出成功",
        description: "檔案已成功匯出",
      });
    } catch (error) {
      console.error("Error exporting file:", error);
      addToast({
        color: "danger",
        title: "匯出失敗",
        description: "無法匯出檔案，請稍後再試",
      });
    }
  };

  // 頁面載入時執行
  useEffect(() => {
    loadFileList("TESTING");
  }, []);

  return (
    <DefaultLayout>
      <div className="flex flex-col">
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
                          isDisabled={!item.fileID.startsWith("local-")}
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
                        <Button color="success" onPress={handleExportFile}>
                          匯出檔案
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <Table isStriped aria-label="Questions table">
                  <TableHeader>
                    <TableColumn key="id" width={80}>ID</TableColumn>
                    <TableColumn key="question">題目</TableColumn>
                    <TableColumn key="options" width={200}>選項數</TableColumn>
                    <TableColumn key="answer" width={100}>答案</TableColumn>
                    <TableColumn key="category" width={150}>類別</TableColumn>
                    <TableColumn key="difficulty" width={100}>難度</TableColumn>
                    {/* Always include the actions column but conditionally render content */}
                    <TableColumn key="actions" width={150}>{isTeacherOrTA ? "操作" : ""}</TableColumn>
                  </TableHeader>
                  <TableBody
                    items={currentContent.questions}
                    emptyContent={"這個檔案中沒有找到任何題目"}
                  >
                    {(question: IExcelQuestion) => (
                      <TableRow key={question.id} className={question.modified ? "bg-blue-100 dark:bg-blue-900/30" : ""}>
                        <TableCell>{question.id}</TableCell>
                        <TableCell>
                          <span className="line-clamp-2" title={question.question}>
                            {question.question}
                          </span>
                        </TableCell>
                        <TableCell>{question.options.length}</TableCell>
                        <TableCell>{question.answer}</TableCell>
                        <TableCell>{question.category}</TableCell>
                        <TableCell>{question.difficulty}</TableCell>
                        <TableCell>
                          {isTeacherOrTA && (
                            <div className="flex gap-2">
                              <Button size="sm" color="primary" onPress={() => handleEditQuestion(question)}>
                                編輯
                              </Button>
                              <Button size="sm" color="danger" onPress={() => handleDeleteQuestion(question.id)}>
                                刪除
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
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
      <Modal isOpen={editQuestionModal} onOpenChange={(open) => {
        if (!open) setEditQuestionModal(false);
      }} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editingQuestion?.id.startsWith('new-') ? '新增題目' : '編輯題目'}
              </ModalHeader>
              <ModalBody>
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
                        onChange={(e) => {
                          setEditingQuestion({
                            ...editingQuestion,
                            answer: e.target.value
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

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-small font-medium mb-1">
                          類別
                        </label>
                        <Input
                          label="類別"
                          placeholder="輸入題目類別"
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
                          onChange={(e) => {
                            setEditingQuestion({
                              ...editingQuestion,
                              difficulty: e.target.value
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
