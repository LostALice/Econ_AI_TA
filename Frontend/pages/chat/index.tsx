// Code by AkinoAlice@TyrantRey

import { useState, useEffect, useRef, useContext } from "react";

import { askQuestion, getChatroomUUID } from "@/api/chat/index";
import { IMessageInfo, TQuestionMode } from "@/types/chat/types";
import { MessageBox } from "@/components/chat/messageBox";
import { Image } from "@heroui/image";

import DefaultLayout from "@/layouts/default";

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
} from "@heroui/react";

import { getCookie } from "cookies-next";

import { AuthContext } from "@/contexts/AuthContext";
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";

export default function ChatPage() {
  const { role, setRole } = useContext(AuthContext);
  const { language, setLang } = useContext(LangContext);

  const mode: TQuestionMode = "CHATTING"
  const [selectTarget, setSelectTarget] = useState<TQuestionMode>(mode);
  const [base64Image, setBase64Image] = useState<string>("");


  const [inputQuestion, setInputQuestion] = useState<string>("");
  const [chatInfo, setChatInfo] = useState<IMessageInfo[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [chatroomUUID, setChatroomUUID] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  async function sendMessage() {
    if (inputQuestion == "") {
      console.error("no message");
      return;
    }
    setLoading(true);
    setInputQuestion("");

    const historyQuestions: string[] = []

    if (chatInfo.length > 0) {
      for (const chat of chatInfo) {
        console.log(chat);
        historyQuestions.push(chat.question.toString())
        historyQuestions.push(chat.answer.toString())
      }
    }
    historyQuestions.push(inputQuestion);

    const message = await askQuestion(
      chatroomUUID,
      historyQuestions,
      "Anonymous",
      language,
      "default",
      selectTarget
    );

    const message_info: IMessageInfo = {
      chatUUID: chatroomUUID,
      questionUUID: message.questionUUID,
      question: inputQuestion,
      answer: message.answer,
      files: message.files,
      time: new Date().toDateString(),
    };

    setChatInfo([...chatInfo, message_info]);
    setLoading(false);
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  useEffect(() => {
    getChatroomUUID().then(data => {
      console.log("get chatroom UUID success", data)
      setChatroomUUID(data)
    })

    const userRole = getCookie("role") || "未登入";
    setRole(userRole);
  }, [setRole]);

  // window.addEventListener("paste", function (e) {
  //   if (e.clipboardData === null || e.clipboardData === undefined) {
  //     return;
  //   }

  //   const item = Array.from(e.clipboardData.items).find(x => /^image\//.test(x.type));

  //   if (item !== undefined) {

  //   }

  // });

  return (
    <DefaultLayout>
      <Card className="h-[90vh] w-full flex flex-col shadow-md rounded-lg border">
        <CardHeader className="flex justify-between p-4">
          <span className="text-sm dark:text-gray-400">{LanguageTable.chat.page.ChatroomID[language]}: {chatroomUUID}</span>
          {/* <span className="text-sm dark:text-gray-400">{LanguageTable.chat.page.role[language]}: {role}</span> */}
          <Dropdown>
            <DropdownTrigger>
              <Button className="capitalize" variant="bordered">
                {LanguageTable.chat.page.target[selectTarget][language]}
                {/* {selectTarget} */}
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
            <div className="pb-1">
\
              <Image
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAABNElEQVR4nOzRQQkAIADAQBEb+Le1fY1xD3cJBlv37BFn6oDfNQBrANYArAFYA7AGYA3AGoA1AGsA1gCsAVgDsAZgDcAagDUAawDWAKwBWAOwBmANwBqANQBrANYArAFYA7AGYA3AGoA1AGsA1gCsAVgDsAZgDcAagDUAawDWAKwBWAOwBmANwBqANQBrANYArAFYA7AGYA3AGoA1AGsA1gCsAVgDsAZgDcAagDUAawDWAKwBWAOwBmANwBqANQBrANYArAFYA7AGYA3AGoA1AGsA1gCsAVgDsAZgDcAagDUAawDWAKwBWAOwBmANwBqANQBrANYArAFYA7AGYA3AGoA1AGsA1gCsAVgDsAZgDcAagDUAawDWAKwBWAOwBmANwBqANQBrANYArAFYA7AGYC8AAP//Mn4ByWZTIHwAAAAASUVORK5CYII="
                alt="asd"
              />
            </div>
            <textarea
              className="w-full resize-none pt-2 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder={LanguageTable.chat.page.textInputPlaceholder[language]}
              rows={1}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
              style={{ overflow: "hidden", minHeight: "2.5rem" }}
            />
          </div>
          <Button
            className="resize-none mb-1"
            onPressEnd={sendMessage}
            disabled={isLoading || inputQuestion.trim() === ""}
          >
            {LanguageTable.chat.page.send[language]}
          </Button>
        </div>
        <CardFooter className="flex justify-center">
          <span className="text-xs dark:text-gray-400 italic">
            {LanguageTable.chat.page.tips[language]}
          </span>
        </CardFooter>
      </Card>
    </DefaultLayout >
  );
}
