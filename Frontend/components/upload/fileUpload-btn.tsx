import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react"
import { useEffect, useState, useContext } from "react"


import { getCookie } from "cookies-next"
import { siteConfig } from "@/config/site"
import { AuthContext } from "@/contexts/AuthContext"
import { LangContext } from "@/contexts/LangContext"
import { LanguageTable } from "@/i18n";
import { fetcher } from "@/api/fetcher"

export const FileUploadButton = () => {
  const { role, setRole } = useContext(AuthContext)

  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [uploadSuccess, setUploadSuccess] = useState<number>(0)
  const [isProgressing, setIsProgressing] = useState<boolean>(false)
  const [fileObject, setFileObject] = useState<File | null>()
  const [fileURL, setFileURL] = useState<string>()
  const { language, setLang } = useContext(LangContext);

  useEffect(() => {
    const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language]
    setRole(userRole)
  })

  function renderFilePreview(file: File) {
    const fileType = file.type

    switch (fileType) {
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return (
          <div className="w-full flex justify-center">
            <span className="text-left text-lg">
              {uploadSuccess ? (uploadSuccess == 200 ? LanguageTable.docs.component.fileUploadButton.uploadSuccess[language] : LanguageTable.docs.component.fileUploadButton.uploadFailed[language]) : ""}
              {file.name}
            </span>
          </div>
        )
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return (
          <div className="w-full flex justify-center">
            <span className="text-left text-lg">
              {uploadSuccess ? (uploadSuccess == 200 ? LanguageTable.docs.component.fileUploadButton.uploadSuccess[language] : LanguageTable.docs.component.fileUploadButton.uploadFailed[language]) : ""}
              {file.name}
            </span>
          </div>
        )
      default:
        return (
          <object
            className="rounded-md w-full h-[60svh]"
            data={fileURL}
            type="image/png"
          />
        )
    }
  }

  async function uploadFile(
    file: File,
    collection: string = "default",
    tags: Array<string>
  ) {
    const apiUploadFileURL = new URL(siteConfig.api_url + "/upload/")
    const fileFormData = new FormData()
    let department = "None"

    switch (file.type) {
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        department = "docx"
        break
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        department = "pptx"
        break
    }

    fileFormData.append("docs_file", file)
    tags.forEach((tag) => fileFormData.append("tags", tag))

    apiUploadFileURL.searchParams.append("department", department)
    apiUploadFileURL.searchParams.append("collection", collection)

    const resp = await fetcher(apiUploadFileURL.toString(), {
      method: "POST",
      body: fileFormData,
      credentials: "include",
    })

    const respJson = await resp
    console.log(respJson)
    if (respJson.status_code === 200) {
      console.log("File uploaded successfully")
      setIsProgressing(false)
      setUploadSuccess(200)
    } else {
      console.error("Error uploading file")
      setIsProgressing(false)
      setUploadSuccess(422)
    }
  }

  return (
    <>
      <Button
        className="bg-transparent text-medium text-center w-full dark:bg-stone-600 shadow-md"
        isDisabled={role == "Admin" ? false : true}
        onPress={() => {
          onOpen()
          setIsProgressing(false)
          setUploadSuccess(0)
          setFileURL("")
          setFileObject(null)
        }}
      >
        {LanguageTable.docs.component.fileUploadButton.fileUpload[language]}
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
              <ModalHeader>{LanguageTable.docs.component.fileUploadButton.fileUpload[language]}</ModalHeader>
              <ModalBody className="mb-3">
                <div
                  className="container mx-auto"
                  onDragOver={(e) => {
                    e.preventDefault()
                  }}
                  onDragLeave={(e) => { }}
                  onDragEnd={(e) => {
                    e.preventDefault()
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    [...e.dataTransfer.items].forEach((item) => {
                      if (item.kind === "file") {
                        const droppedFile = e.dataTransfer.items[0].getAsFile()
                        if (droppedFile) {
                          let blobUrl = URL.createObjectURL(droppedFile)
                          setFileURL(blobUrl)
                          setFileObject(droppedFile)
                        }
                      }
                    })
                  }}
                >
                  <div className="container">
                    {!fileObject ? (
                      <div className="mx-auto flex flex-col w-full h-72 border-dashed items-center justify-center border-4">
                        <label
                          htmlFor="file"
                          className="flex justify-center text-center h-full w-full items-center"
                        >
                          <span className="text-blue-500">{LanguageTable.docs.component.fileUploadButton.clickToUpload[language]}</span>
                          <span>{LanguageTable.docs.component.fileUploadButton.dropToUpload[language]}</span>
                        </label>
                        <input
                          id="file"
                          type="file"
                          className="hidden"
                          accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={(e) => {
                            let droppedFiles = e.target.files
                            if (droppedFiles && droppedFiles[0]) {
                              let blobUrl = URL.createObjectURL(
                                droppedFiles[0]
                              )
                              setFileURL(blobUrl)
                              setFileObject(droppedFiles[0])
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-row gap-2 px-3 py-3 justify-center">
                        <div className="flex flex-col items-center w-full">
                          {renderFilePreview(fileObject)}
                          <ModalFooter className="flex justify-center">
                            {uploadSuccess != 0 ? (
                              <Button
                                onPress={() => {
                                  setFileURL("")
                                  setFileObject(null)
                                  setUploadSuccess(0)
                                }}
                                className="px-5 rounded text-medium bg-gray-400"
                              >
                                {LanguageTable.docs.component.fileUploadButton.close[language]}
                              </Button>
                            ) : (
                              <div className="flex justify-center gap-2">
                                <Button
                                  onPress={() => {
                                    setFileURL("")
                                    setFileObject(null)
                                  }}
                                  className="px-5 rounded text-medium bg-gray-400"
                                >
                                  {LanguageTable.docs.component.fileUploadButton.reset[language]}
                                </Button>
                                <Button
                                  isLoading={isProgressing}
                                  onPress={() => {
                                    setIsProgressing(true)
                                    uploadFile(fileObject, "default", [""])
                                  }}
                                  className="px-5 rounded text-medium"
                                >
                                  {LanguageTable.docs.component.fileUploadButton.upload[language]}
                                </Button>
                              </div>
                            )}
                          </ModalFooter>
                        </div>
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
