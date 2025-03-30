import DefaultLayout from "@/layouts/default";
import { useState } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Card,
    CardBody,
    CardHeader,
    Divider,
    RadioGroup,
    Radio,
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

// 在組件頂部添加一個CSV解析函數
function parseCSVRow(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        // 引號內的雙引號表示單個引號
        current += '"';
        i++; // 跳過下一個引號
      } else {
        // 切換引號模式
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 字段結束
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // 添加最後一個字段
  result.push(current.trim());
  return result;
}

export default function ProblemData() {
    const [fileList, setFileList] = useState<FileData[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'list' | 'content'>('list');

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
            
            try {
                // 使用更強大的CSV解析方法
                const rows: string[][] = [];
                const lines = content.trim().split(/\r?\n/);
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].replace(/^\ufeff/, '').trim();
                    if (!line) continue; // 跳過空行
                    
                    const parsedRow = parseCSVRow(line);
                    rows.push(parsedRow);
                    console.log(`Row ${i}: ${parsedRow.length} columns`);
                }
                
                // 檢查是否有行數不匹配的情況
                const headerColumnCount = rows[0].length;
                console.log(`Header has ${headerColumnCount} columns`);
                
                // 確保所有行都具有相同數量的列
                const cleanedRows = rows.map((row, idx) => {
                    // 標題行保持不變
                    if (idx === 0) return row;
                    
                    if (row.length > headerColumnCount) {
                        console.log(`Row ${idx} has too many columns: ${row.length} > ${headerColumnCount}`);
                        console.log(`Row content: ${JSON.stringify(row)}`);
                        // 截斷多餘的列
                        return row.slice(0, headerColumnCount);
                    }
                    
                    if (row.length < headerColumnCount) {
                        console.log(`Row ${idx} has too few columns: ${row.length} < ${headerColumnCount}`);
                        // 填充缺少的列
                        return [...row, ...Array(headerColumnCount - row.length).fill('')];
                    }
                    
                    return row;
                });
                
                // 創建新的文件對象
                const newFile = {
                    name: file.name,
                    content: cleanedRows
                };
                
                setFileList(prevFileList => [...prevFileList, newFile]);
            } catch (error) {
                console.error("CSV解析錯誤:", error);
                alert(`解析檔案時發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setIsLoading(false);
            }
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
        setViewMode('content');
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

    // 顯示選定文件的內容
    const renderSelectedFileContent = () => {
        if (!selectedFile) return null;
        
        const selectedData = fileList.find(file => file.name === selectedFile);
        if (!selectedData || !selectedData.content.length) return null;

        const headers = selectedData.content[0];
        const questions = selectedData.content.slice(1);

        return (
            <div className="w-full mt-4">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">{selectedFile}</h2>
                    <div>
                        <Button color="primary" className="mr-2" onPress={handleFileDownload}>
                            下載檔案
                        </Button>
                        <Button color="secondary" onPress={() => setViewMode('list')}>
                            返回列表
                        </Button>
                    </div>
                </div>
                
                <div className="space-y-6">
                    {questions.map((question, qIdx) => {
                        const questionNo = question[0] || `題目 ${qIdx + 1}`;
                        const chapterNo = question[1] || '未指定';
                        const questionChinese = question[2] || '';
                        const questionEnglish = question[3] || '';
                        
                        // 獲取各選項
                        const answerAChinese = question[4] || '';
                        const answerAEnglish = question[5] || '';
                        const answerBChinese = question[6] || '';
                        const answerBEnglish = question[7] || '';
                        const answerCChinese = question[8] || '';
                        const answerCEnglish = question[9] || '';
                        const answerDChinese = question[10] || '';
                        const answerDEnglish = question[11] || '';
                        
                        // 正確答案和解釋
                        const correctAnswer = question[12] || '';
                        const explainChinese = question[13] || '';
                        const explainEnglish = question[14] || '';
                        
                        return (
                            <Card key={qIdx} className="p-4">
                                <CardHeader className="flex gap-3">
                                    <div>
                                        <p className="text-md font-bold">題號: {questionNo} (章節: {chapterNo})</p>
                                    </div>
                                </CardHeader>
                                <Divider/>
                                <CardBody>
                                    <div className="mb-3">
                                        <p className="font-bold text-md mb-1">題目:</p>
                                        <p>{questionChinese}</p>
                                        <p className="text-gray-500 text-sm">{questionEnglish}</p>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <RadioGroup label="選項" defaultValue={correctAnswer}>
                                            {answerAChinese && (
                                                <Radio value="A">
                                                    A. {answerAChinese}
                                                    {answerAEnglish && <div className="text-gray-500 text-sm">{answerAEnglish}</div>}
                                                </Radio>
                                            )}
                                            {answerBChinese && (
                                                <Radio value="B">
                                                    B. {answerBChinese}
                                                    {answerBEnglish && <div className="text-gray-500 text-sm">{answerBEnglish}</div>}
                                                </Radio>
                                            )}
                                            {answerCChinese && (
                                                <Radio value="C">
                                                    C. {answerCChinese}
                                                    {answerCEnglish && <div className="text-gray-500 text-sm">{answerCEnglish}</div>}
                                                </Radio>
                                            )}
                                            {answerDChinese && (
                                                <Radio value="D">
                                                    D. {answerDChinese}
                                                    {answerDEnglish && <div className="text-gray-500 text-sm">{answerDEnglish}</div>}
                                                </Radio>
                                            )}
                                        </RadioGroup>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <DefaultLayout>
            <div className="flex flex-col">
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
                    {viewMode === 'list' && (
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
                    )}
                </div>
                
                {/* 顯示選定文件的內容 */}
                {viewMode === 'content' && renderSelectedFileContent()}
            </div>
        </DefaultLayout>
    );
}