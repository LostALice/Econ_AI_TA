import { useState, useEffect, useRef, useContext } from "react";

import { MessageBox } from "@/components/messageBox";
import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";

import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { Spinner } from "@nextui-org/spinner";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";

import { askQuestion } from "@/pages/api/api";
import { getCookie } from "cookies-next";
import { IMessageInfo } from "@/types";

import { AuthContext } from "@/contexts/AuthContext";

export default function ChatPage() {
  const { role, setRole } = useContext(AuthContext);

  const [inputQuestion, setInputQuestion] = useState<string>("");
  const [chatInfo, setChatInfo] = useState<IMessageInfo[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [chatUUID, setChatUUID] = useState<string>("");
  const scrollShadow = useRef<HTMLInputElement>(null);

  async function sendMessage() {
    setLoading(true);
    if (inputQuestion == "") {
      console.error("no message");
      return;
    }
    setInputQuestion("");

    const message = await askQuestion(
      chatUUID,
      inputQuestion,
      "Anonymous",
      "default"
    );

    const message_info: IMessageInfo = {
      chatUUID: chatUUID,
      questionUUID: message.questionUUID,
      question: inputQuestion,
      answer: message.answer,
      files: message.files,
      time: new Date().toDateString(),
    };

    setChatInfo([...chatInfo, message_info]);
    setLoading(false);
    scrollShadow.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  useEffect(() => {
    fetch(siteConfig.api_url + "/uuid/")
      .then((res) => res.json())
      .then((data) => {
        setChatUUID(data);
      });

    const userRole = getCookie("role") || "未登入";
    setRole(userRole);
  }, []);

  return (
    <DefaultLayout>
      <Card className="flex flex-col items-center justify-center h-[50rem] w-full border-1">
        <CardHeader className="grid grid-cols-1 border-b-1 h-[3em] overflow-hidden lg:grid-cols-3">
          <span className="text-start hidden lg:block">{chatUUID}</span>
          <span className="text-center text-small">
            機械人可能會出錯。請參考文檔核對重要資訊。
          </span>
          <span className="text-end hidden lg:block">使用者: {role}</span>
        </CardHeader>

        <CardBody className="justify-between">
          <ScrollShadow
            hideScrollBar
            className="w-full h-full items-center flex-col-reverse"
            ref={scrollShadow}
          >
            {chatInfo.map((item) => (
              <MessageBox
                key={item.questionUUID}
                chatUUID={chatUUID}
                questionUUID={item.questionUUID}
                question={item.question}
                answer={item.answer}
                files={item.files}
                time={item.time}
              />
            ))}
            {isLoading && (
              <div className="flex border rounded-lg border-emerald-600 m-3 justify-center">
                {" "}
                <Spinner className="p-3" color="success" size="lg" />{" "}
              </div>
            )}
          </ScrollShadow>
        </CardBody>
        <div className="flex justify-between w-[90%] h-[3rem] mb-2">
          <Textarea
            name="question"
            radius="sm"
            minRows={1}
            className="h-[2rem] w-full"
            placeholder="開始提問"
            value={inputQuestion}
            onValueChange={setInputQuestion}
            disabled={isLoading ? true : false}
            onKeyDown={(event) => {
              event.code === "Enter" && !event.shiftKey ? sendMessage() : false;
            }}
          />
          <Button
            radius="none"
            className="rounded-r-lg -ml-3"
            onClick={sendMessage}
          >
            送出
          </Button>
        </div>
      </Card>
    </DefaultLayout>
  );
}
