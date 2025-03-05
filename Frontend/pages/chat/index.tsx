// Code by AkinoAlice@TyrantRey

import { useState, useEffect, useRef, useContext } from "react"

import { askQuestion, getChatroomUUID } from "@/api/chat/index"
import { IMessageInfo, TQuestionMode } from "@/types/chat/types"
import { MessageBox } from "@/components/chat/messageBox"
import { ImageBox } from "@/components/chat/imageBox"

import DefaultLayout from "@/layouts/default"

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  ScrollShadow,
  Spinner,
  Button
} from "@heroui/react"

import { getCookie } from "cookies-next"

import { AuthContext } from "@/contexts/AuthContext"
import { LangContext } from "@/contexts/LangContext"
import { LanguageTable } from "@/i18n"

export default function ChatPage() {
  const { role, setRole } = useContext(AuthContext)
  const { language, setLang } = useContext(LangContext)

  const mode: TQuestionMode = "CHATTING"
  const [selectTarget, setSelectTarget] = useState<TQuestionMode>(mode)

  const [base64ImageList, setBase64ImageList] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [inputQuestion, setInputQuestion] = useState<string>("")
  const [chatInfo, setChatInfo] = useState<IMessageInfo[]>([])
  const [isLoading, setLoading] = useState<boolean>(false)
  const [chatroomUUID, setChatroomUUID] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  async function sendMessage() {
    if (inputQuestion == "") {
      console.error("no message")
      return
    }
    setLoading(true)

    const historyQuestions: string[] = []

    if (chatInfo.length > 0) {
      for (const chat of chatInfo) {
        console.log(chat)
        historyQuestions.push(chat.question.toString())
        if (chat.answer) {
          historyQuestions.push(chat.answer.toString())
        }
      }
    }
    historyQuestions.push(inputQuestion)

    const message = await askQuestion(
      chatroomUUID,
      historyQuestions,
      "Anonymous",
      language,
      "default",
      base64ImageList,
      selectTarget,
    )

    const message_info: IMessageInfo = {
      chatUUID: chatroomUUID,
      questionUUID: message.questionUUID,
      question: inputQuestion,
      answer: message.answer,
      files: message.files,
      time: new Date().toDateString(),
      images: base64ImageList
    }

    setChatInfo([...chatInfo, message_info])
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    setLoading(false)
    setInputQuestion("")
    setBase64ImageList([])
  }

  useEffect(() => {
    getChatroomUUID().then(data => {
      console.log("get chatroom UUID success", data)
      setChatroomUUID(data)
    })

    const userRole = getCookie("role") || LanguageTable.nav.role.unsigned[language]
    setRole(userRole)
  }, [setRole, language])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const item = event.clipboardData?.items[0]
      if (!item) { return }

      if (item.type.includes("image")) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            let base64String = e.target?.result as string
            if (base64String) {
              base64String = base64String.split(",")[1]
              setBase64ImageList(prev => [...prev, base64String])
            }
          }
          reader.readAsDataURL(file)
        }
      }
    }
    window.addEventListener("paste", handlePaste)
    return () => {
      window.removeEventListener("paste", handlePaste)
    }
  }, [base64ImageList])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (!files || files.length === 0) { return }
    console.log(base64ImageList.length)
    if (base64ImageList.length > 3) { return }

    const reader = new FileReader()
    reader.readAsDataURL(files[-1])
    reader.onload = () => {
      if (reader.result) {
        let base64ImageString = reader.result as string
        base64ImageString = base64ImageString.split(",")[1]
        setBase64ImageList([...base64ImageList, base64ImageString])
      }
      else {
        console.error("File reader failed")
      }
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setBase64ImageList(prevList =>
      prevList.filter((_, index) => index !== indexToRemove)
    )
  }

  const handleUploadClick = () => {
    if (fileInputRef.current == null) {
      return
    }
    fileInputRef.current.click()
  }

  return (
    <DefaultLayout>
      <Card className="h-[90vh] w-full flex flex-col shadow-md rounded-lg border">
        <CardHeader className="flex justify-between p-4">
          <span className="text-sm dark:text-gray-400">
            {LanguageTable.chat.page.ChatroomID[language]}: {chatroomUUID}
          </span>
          <Dropdown>
            <DropdownTrigger>
              <Button className="capitalize" variant="bordered">
                {LanguageTable.chat.page.target[selectTarget][language]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="selectTarget"
              selectedKeys={selectTarget}
              selectionMode="single"
              variant="flat"
              onSelectionChange={(keys) => {
                setSelectTarget(keys.currentKey as TQuestionMode)
              }}
            >
              <DropdownItem key="THEOREM">{LanguageTable.chat.page.target.THEOREM[language]}</DropdownItem>
              <DropdownItem key="TESTING">{LanguageTable.chat.page.target.TESTING[language]}</DropdownItem>
              <DropdownItem key="CHATTING">{LanguageTable.chat.page.target.CHATTING[language]}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </CardHeader>

        <CardBody className="flex-grow overflow-y-auto p-4 space-y-4 border-t">
          <ScrollShadow
            hideScrollBar
            className="w-full h-full items-center flex-col-reverse"
          >
            {chatInfo.map((item) => (
              <MessageBox
                key={item.questionUUID}
                chatUUID={chatroomUUID}
                questionUUID={item.questionUUID}
                question={item.question}
                answer={item.answer}
                files={item.files}
                time={item.time}
                images={item.images}
              />
            ))}

            {isLoading && (
              <div className="flex justify-center mt-4">
                <Spinner color="primary" />
              </div>
            )}

            <div ref={scrollRef} />
          </ScrollShadow>
        </CardBody>
        <div className="sticky bottom-0 pt-1 px-4 flex items-center space-x-2">
          <div className="relative flex-grow">
            <div className="gap-1">
              {base64ImageList.map((image, index) => (
                <ImageBox key={index} base64Image={image} onClose={() => handleRemoveImage(index)} />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <textarea
                className="w-full resize-none pt-2 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder={LanguageTable.chat.page.textInputPlaceholder[language]}
                rows={1}
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={isLoading}
                style={{ overflow: "hidden", minHeight: "2.5rem" }}
              />
              <button
                className="inline-flex
                items-center
                justify-center
                relative
                shrink-0
                ring-offset-2
                ring-offset-bg-300
                ring-accent-main-100
                focus-visible:outline-none
                focus-visible:ring-1
                disabled:pointer-events-none
                disabled:opacity-50
                disabled:shadow-none
                disabled:drop-shadow-none text-text-200
                border-transparent
                transition-colors
                font-styrene
                active:bg-bg-400
                hover:bg-bg-500/40
                hover:text-text-100 h-8 w-8 rounded-md active:scale-95"
                type="button"
                aria-label="Upload content"
                data-state="closed"
                onClick={handleUploadClick}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M209.66,122.34a8,8,0,0,1,0,11.32l-82.05,82a56,56,0,0,1-79.2-79.21L147.67,35.73a40,40,0,1,1,56.61,56.55L105,193A24,24,0,1,1,71,159L154.3,74.38A8,8,0,1,1,165.7,85.6L82.39,170.31a8,8,0,1,0,11.27,11.36L192.93,81A24,24,0,1,0,159,47L59.76,147.68a40,40,0,1,0,56.53,56.62l82.06-82A8,8,0,0,1,209.66,122.34Z">
                  </path>
                </svg>
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </button>
              <Button
                onPressEnd={sendMessage}
                disabled={isLoading || inputQuestion.trim() === ""}
              >
                {LanguageTable.chat.page.send[language]}
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="24" width="24" viewBox="0 0 495.003 495.003">
                  <path d="M492.431,32.443c-1.513-1.395-3.466-2.125-5.44-2.125c-1.19,0-2.377,0.264-3.5,0.816L7.905,264.422   c-4.861,2.389-7.937,7.353-7.904,12.783c0.033,5.423,3.161,10.353,8.057,12.689l125.342,59.724l250.62-205.99L164.455,364.414   l156.145,74.4c1.918,0.919,4.012,1.376,6.084,1.376c1.768,0,3.519-0.322,5.186-0.977c3.637-1.438,6.527-4.318,7.97-7.956   L494.436,41.257C495.66,38.188,494.862,34.679,492.431,32.443z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <CardFooter className="flex justify-center">
          <span className="text-xs dark:text-gray-400 italic">
            {LanguageTable.chat.page.tips[language]}
          </span>
        </CardFooter>
      </Card>
    </DefaultLayout >
  )
}
