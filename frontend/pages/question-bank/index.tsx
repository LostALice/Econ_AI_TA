import DefaultLayout from "@/layouts/default";
import { useState } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
} from "@nextui-org/react";
import { Listbox, ListboxItem } from "@nextui-org/react";
import { Spinner } from "@nextui-org/react";
import { Link } from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import { CsvMngButton } from "@/components/csvMng-btn";

interface FileData {
    name: string;
    content: string[][];
}

export default function ProblemData() {
    const [fileList, setFileList] = useState<FileData[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // upload .csv file
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {    
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        
        // 檢查文件類型
        if (!file.name.endsWith(".csv") && !file.name.endsWith(".asc")) {
            alert("請上傳 .csv 或 .asc 檔案");
            setIsLoading(false);
            return;
        }
        
        // read upload file
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            
            // 清理和解析文件內容
            const rows = content
                .trim()
                .split(/\r?\n/)
                .map(row => {
                    // 移除 BOM 標記和清理行
                    const cleanRow = row
                        .replace(/^\ufeff/, '')  // 移除 BOM
                        .trim()
                        .split(',')
                        .map(cell => cell.trim());  // 清理每個單元格
                    return cleanRow;
                });

            // 獲取標題行的列數
            const headerColumnCount = rows[0].length;

            // 標準化每一行的列數
            const cleanedRows = rows.map(row => {
                if (row.length > headerColumnCount) {
                    // 如果列數過多，截斷
                    return row.slice(0, headerColumnCount);
                }
                if (row.length < headerColumnCount) {
                    // 如果列數不足，補充空值
                    return [...row, ...new Array(headerColumnCount - row.length).fill('')];
                }
                return row;
            });

            // 創建新的文件對象
            const newFile = {
                name: file.name,
                content: cleanedRows
            };

            setFileList(prevFileList => [...prevFileList, newFile]);
            setIsLoading(false);
        };

        reader.onerror = () => {
            alert("讀取文件時發生錯誤");
            setIsLoading(false);
        };

        reader.readAsText(file, 'utf-8');
    };    
    
    // select file
    const handleFileSelect = (fileName: string) => {
        setSelectedFile(fileName);
    };

    // edit file value
    const handleFileEdit = (rowIdx: number, colIdx: number, value: string) => {
        if (!selectedFile) return;
        const updatedFileList = fileList.map((file) => {
            if (file.name === selectedFile) {
              const newContent = [...file.content];
              newContent[rowIdx][colIdx] = value;
              return { ...file, content: newContent };
            }
            return file;
        });
        setFileList(updatedFileList);
    };

    // download file
    const handleFileDownload = () => {
        if (!selectedFile) return;
        const selectedData = fileList.find((file) => file.name === selectedFile);
        if (!selectedData) return;

        const csvContent = selectedData.content.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = selectedFile;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <DefaultLayout>
            <div className="flex">
                <div className="mt-1 mx-3">
                    <CsvMngButton onFileUpload={handleFileUpload} isLoading={isLoading} />
                    <Listbox
                        disallowEmptySelection
                        aria-label="Actions"
                        className="h-full w-[15rem]"
                        onAction={(key) => handleFileSelect(key.toString())}
                        variant="flat"
                        selectionMode="single"
                    >
                        {fileList.map((file) => (
                            <ListboxItem key={file.name} value={file.name}>
                                {file.name}
                            </ListboxItem>
                        ))}
                    </Listbox>
                </div>
                <Table 
                    aria-label="file table" 
                    className="flex-1"
                >   
                    <TableHeader>
                        <TableColumn key="name">文件名稱</TableColumn>
                        <TableColumn key="date">最後更新日期</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {fileList.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell>
                                    <Link
                                        href="#"
                                        className="cursor-pointer"
                                        onPress={() => handleFileSelect(item.name)}
                                    >
                                        {item.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{new Date().toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </DefaultLayout>
    );
}