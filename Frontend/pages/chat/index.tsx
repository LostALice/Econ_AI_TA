// Code by AkinoAlice@TyrantRey

import { useState, useEffect, useRef, useContext } from "react";

import { askQuestion, getChatroomUUID } from "@/api/chat/index";
import { MessageBox } from "@/components/chat/messageBox";
import { IMessageInfo } from "@/types/chat/type";

import DefaultLayout from "@/layouts/default";

import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@nextui-org/button";

import { getCookie } from "cookies-next";

import { AuthContext } from "@/contexts/AuthContext";
import { siteConfig } from "@/config/site";

export default function ChatPage() {
  const { role, setRole } = useContext(AuthContext);

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
      siteConfig.language,
      "default"
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

  return (
    <DefaultLayout>
      <Card className="h-[90vh] w-full flex flex-col shadow-md rounded-lg border">
        <CardHeader className="flex justify-between p-4">
          <span className="text-sm dark:text-gray-400">聊天室 ID: {chatroomUUID}</span>
          <span className="text-sm dark:text-gray-400">身份: {role}</span>
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
            <textarea
              className="w-full resize-none pt-2 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="傳送訊息給TA"
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
            傳送
          </Button>
        </div>
        <CardFooter className="flex justify-center">
          <span className="text-xs dark:text-gray-400 italic">
            機械人可能會出錯。請參考文檔核對重要資訊。
          </span>
        </CardFooter>
      </Card>
    </DefaultLayout>
  );
}
