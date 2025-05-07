// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";
import { useState, useContext, Key } from "react";

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
} from "@heroui/react";

import { LanguageTable } from "@/i18n";
import { LangContext } from "@/contexts/LangContext";

import { fetchDocsList, fetchDocs } from "@/pages/api/api";
import { IDocsFormat } from "@/types/api/types";

// import { FileUploadButton } from "@/components/upload/fileUpload-btn";

export default function DocsPage() {
  const { language, setLang } = useContext(LangContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<IDocsFormat[]>([]);

  // Not recommended to change following key, unless you know what you are doing.
  // Not recommended to change following key, unless you know what you are doing.
  // Not recommended to change following key, unless you know what you are doing.
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

  async function loadFileList(documentationType: string) {
    setIsLoading(true);
    try {
      const docsList = await fetchDocsList(documentationType);
      setFileList(docsList);
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
    } catch (error) {
      console.error("Error loading file list:", error);
      addToast({
        color: "danger",
        title: "載入失敗",
        description: "無法連接到後端服務，顯示模擬資料",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 處理文件點擊事件，對於模擬數據使用不同的處理邏輯
  const handleDocClick = async (item: IDocsFormat) => {
    try {
      if (item.fileID.startsWith("mock-")) {
        // 處理模擬文檔
        addToast({
          color: "primary", // Changed from "info" to "primary" which is an allowed value
          title: "模擬文件",
          description: "後端未連接，無法顯示實際文件內容",
        });

        // 創建一個簡單的文本說明，表示這是一個模擬文件
        const textBlob = new Blob(
          [
            `這是一個模擬文件：${item.fileName}\n\n後端伺服器未連接，無法顯示實際文件內容。`,
          ],
          { type: "text/plain" }
        );

        // 創建暫時的下載連結
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

      // 處理實際文檔
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

  return (
    <DefaultLayout>
      <div className="flex">
        <div className="mt-1 mx-3">
          {/* <FileUploadButton /> */}
          <Listbox
            disallowEmptySelection
            className="h-full w-[15rem]"
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
        <Table isStriped aria-label="Docs page">
          <TableHeader>
            <TableColumn key="name">
              {LanguageTable.docs.page.lessonName[language]}
            </TableColumn>
            <TableColumn key="height">
              {LanguageTable.docs.page.lastUpdate[language]}
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
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DefaultLayout>
  );
}
