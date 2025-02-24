import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
  } from "@nextui-org/react"
  import { useEffect, useState } from "react"
  import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@nextui-org/table"
  
  interface CsvMngButtonProps {
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    isLoading: boolean;
  }
  
  export const CsvMngButton: React.FC<CsvMngButtonProps> = ({ onFileUpload, isLoading }) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [fileObject, setFileObject] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<string[][]>([])
  
    const handleFileSelect = (file: File) => {
      if (!file.name.endsWith('.csv')) {
        alert('請上傳 CSV 檔案')
        return
      }
  
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const rows = content.split('\n').map(row => row.split(','))
        setPreviewData(rows)
        setFileObject(file)
      }
      reader.readAsText(file)
    }
  
    const renderCsvPreview = () => {
      if (previewData.length === 0) return null
  
      return (
        <Table aria-label="CSV Preview" className="max-h-[60vh] overflow-auto">
          <TableHeader>
            {previewData[0].map((header, index) => (
              <TableColumn key={index}>{header}</TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {previewData.slice(1).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }
  
    return (
      <>
        <Button
          className="bg-transparent text-medium text-center w-full dark:bg-stone-600 shadow-md"
          isDisabled={isLoading}
          onPress={onOpen}
        >
          上傳CSV檔案
        </Button>
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          size="3xl"
          isDismissable={false}
          isKeyboardDismissDisabled={true}
        >
          <ModalContent>
            {(onClose) => (
              <div>
                <ModalHeader>CSV檔案上傳</ModalHeader>
                <ModalBody className="mb-3">
                  <div
                    className="container mx-auto"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file) handleFileSelect(file)
                    }}
                  >
                    <div className="container">
                      {!fileObject ? (
                        <div className="mx-auto flex flex-col w-full h-72 border-dashed items-center justify-center border-4">
                          <label
                            htmlFor="csv-file"
                            className="flex flex-col justify-center text-center h-full w-full items-center cursor-pointer"
                          >
                            <span className="text-blue-500 mb-2">點擊上傳</span>
                            <span>或拖放CSV檔案</span>
                          </label>
                          <input
                            id="csv-file"
                            type="file"
                            className="hidden"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileSelect(file)
                            }}
                          />
                          <input
                            type="file"
                            accept=".csv,.asc"
                            onChange={onFileUpload}
                            style={{ display: "none" }}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="w-full">
                            {renderCsvPreview()}
                          </div>
                          <ModalFooter className="flex justify-center gap-2">
                            <Button
                              color="primary"
                              onClick={() => {
                                const event = {
                                  target: {
                                    files: [fileObject]
                                  }
                                } as unknown as React.ChangeEvent<HTMLInputElement>
                                onFileUpload(event)
                                onClose()
                              }}
                              isLoading={isLoading}
                            >
                              確認上傳
                            </Button>
                            <Button
                              color="danger"
                              onClick={() => {
                                setFileObject(null)
                                setPreviewData([])
                              }}
                            >
                              取消
                            </Button>
                          </ModalFooter>
                        </div>
                      )}
                    </div>
                  </div>
                </ModalBody>
              </div>
            )}
          </ModalContent>
        </Modal>
      </>
    )
  }