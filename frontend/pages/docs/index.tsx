// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";
import { useState, useContext, Key, useRef, useEffect } from "react";
import { getCookie, hasCookie, setCookie } from "cookies-next";

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
} from "@heroui/react";

import { LanguageTable } from "@/i18n";
import { LangContext } from "@/contexts/LangContext";
import { AuthContext } from "@/contexts/AuthContext";

import { fetchDocsList } from "@/pages/api/api";
import { IDocsFormat } from "@/types/api/types";

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

  // 載入文件列表，優先使用本地存儲的模擬數據
  async function loadFileList(documentationType: string) {
    setIsLoading(true);
    setCurrentDocType(documentationType);
    
    try {
      // 首先嘗試從本地存儲獲取模擬文件列表
      const localDocs = loadLocalStorageDocsList(documentationType);
      
      if (localDocs.length > 0) {
        console.log("使用本地存儲的模擬文件列表:", localDocs);
        setFileList(localDocs);
        addToast({
          color: "success",
          title: "文件載入成功",
          description: `已成功載入 ${localDocs.length} 個${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
        });
      } else {
        // 如果本地無數據，嘗試調用 API (會返回模擬數據)
        console.log("本地無數據，嘗試調用 API...");
        const docsList = await fetchDocsList(documentationType);
        setFileList(docsList);
        
        // 將從 API 獲取的模擬數據保存到本地存儲
        saveLocalStorageDocsList(documentationType, docsList);
        
        if (docsList.length > 0) {
          addToast({
            color: "success",
            title: "文件載入成功",
            description: `已成功載入 ${docsList.length} 個${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
          });
        } else {
          addToast({
            color: "warning",
            title: "未找到文件",
            description: `未找到符合條件的${documentationType === "TESTING" ? "考古題" : "理論資料"}文件`,
          });
        }
      }
    } catch (error) {
      console.error("Error loading file list:", error);
      addToast({
        color: "danger",
        title: "載入失敗",
        description: "無法連接到後端服務，顯示模擬資料",
      });
      
      // 失敗時生成一些模擬數據
      const mockData = generateMockData(documentationType, 3);
      setFileList(mockData);
      saveLocalStorageDocsList(documentationType, mockData);
    } finally {
      setIsLoading(false);
    }
  }

  // 生成模擬數據
  const generateMockData = (docType: string, count: number): IDocsFormat[] => {
    const mockData: IDocsFormat[] = [];
    const topicPrefix = docType === "TESTING" ? "考古題" : "經濟學理論";
    
    for (let i = 1; i <= count; i++) {
      mockData.push({
        fileID: `mock-${docType.toLowerCase()}-${Date.now()}-${i}`,
        fileName: `${topicPrefix} - 示例文件 ${i}`,
        lastUpdate: new Date().toISOString().replace("T", " ").substring(0, 19),
      });
    }
    
    return mockData;
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
        const fileContent = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          content: e.target?.result,
        };
        
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
      
      reader.readAsDataURL(file);
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

  // 處理文件點擊事件
  const handleDocClick = async (item: IDocsFormat) => {
    try {
      if (item.fileID.startsWith("mock-")) {
        // 舊的模擬文件，顯示預設消息
        addToast({
          color: "primary",
          title: "模擬文件",
          description: "這是一個模擬文件，無法顯示實際內容",
        });

        const textBlob = new Blob(
          [
            `這是一個模擬文件：${item.fileName}\n\n這是自動生成的示例內容。`,
          ],
          { type: "text/plain" }
        );

        const url = URL.createObjectURL(textBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${item.fileName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return;
      }
      
      // 檢查是否為本地上傳的文件
      if (item.fileID.startsWith("local-")) {
        const fileContent = getFileContent(item.fileID);
        
        if (fileContent && fileContent.content) {
          // 建立 Blob URL 並下載文件
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
            const fileContent = {
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
              lastModified: selectedFile.lastModified,
              content: e.target?.result,
            };
            
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
          
          reader.readAsDataURL(selectedFile);
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

  // 頁面載入時執行
  useEffect(() => {
    loadFileList("TESTING");
  }, []);

  return (
    <DefaultLayout>
      <div className="flex flex-col">
        <div className="flex flex-col md:flex-row p-2 gap-2">
          <div className="mt-1 mx-3 w-full md:w-[15rem]">
            {isTeacherOrTA && (
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">上傳考古題/文件</h3>
                <FileUploadButton 
                  onFileUpload={handleFileUpload} 
                  acceptedFileTypes=".xlsx, .docx, .pptx, .pdf" 
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
              <TableColumn 
                key="actions" 
                align="center" 
                width={100}
                className={isTeacherOrTA ? "" : "hidden"}
              >
                操作
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
                        isDisabled={!item.fileID.startsWith("local-") && !item.fileID.startsWith("mock-")}
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
                        accept=".xlsx, .docx, .pptx, .pdf"
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
    </DefaultLayout>
  );
}
