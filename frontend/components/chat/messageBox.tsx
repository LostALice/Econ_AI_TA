import { FC } from "react";
import { siteConfig } from "@/config/site";

import { Divider, Tooltip, Link, Button, ButtonGroup, Image } from "@heroui/react"
import { IMessageInfo } from "@/types/chat/types";
import { useState, useContext } from "react";

import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";

import ReactMarkdown from 'react-markdown';

export const MessageBox: FC<IMessageInfo> = ({
  questionUUID,
  question,
  answer,
  files,
  time,
  images
}) => {
  const { language, setLang } = useContext(LangContext)
  const [isButtonGroupDisabled, setIsButtonGroupDisabled] =
    useState<Boolean>(false);

  function rating_answer(questionUUID: string, rating: boolean) {
    fetch(siteConfig.api_url + "/chatroom/rating/", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question_uuid: questionUUID,
        rating: rating,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success == true) {
          setIsButtonGroupDisabled(true);
        }
      });
  }
  
  // 格式化圖片來源，自動檢測是否為Base64格式
  const formatImageSrc = (imgData: string) => {
    // 檢查是否已經是完整的data URL格式
    if (imgData.startsWith('data:image/')) {
      return imgData;
    }
    // 如果是純Base64，添加適當的前綴
    return `data:image/png;base64,${imgData}`;
  };
  
  return (
    <div className="border rounded-lg border-emerald-600 m-3">
      <div className="justify-around p-4">
        <span className="italic">{question}</span>
        
        {/* 顯示用戶上傳的圖片 */}
        {images && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {images.map((base64Image, index) => (
              <div key={index} className="flex justify-center">
                <Image
                  src={formatImageSrc(base64Image)}
                  alt={`用戶圖片 ${index + 1}`}
                  width={128}
                  height={128}
                  className="rounded shadow-md object-contain"
                />
              </div>
            ))}
          </div>
        )}
        
        <Divider className="my-2" />
        <ReactMarkdown>{answer}</ReactMarkdown>
        {/* <span className="">{answer}</span> */}
        <Divider className="my-2" />
        <div className="flex justify-between">
          <div className="flex flex-wrap text-left gap-3">
            {files?.map((file) => (
              <Tooltip
                content={<span className="text-left">{file.file_name}</span>}
                placement="bottom"
                key={file.file_uuid}
              >
                <Button
                  isExternal
                  href={
                    siteConfig.api_url?.toString() + "/documentation/" + file.file_uuid
                  }
                  key={file.file_uuid}
                  as={Link}
                  showAnchorIcon
                  className="text-small w-[7rem] "
                >
                  <span className="text-left truncate italic">
                    {file.file_name}
                  </span>
                </Button>
              </Tooltip>
            ))}
          </div>
          <div>
            <ButtonGroup isDisabled={isButtonGroupDisabled ? true : false}>
              {isButtonGroupDisabled ? (
                <Button isDisabled={true}>{LanguageTable.chat.component.messageBox.thankForResponse[language]}</Button>
              ) : (
                <div>
                  <Tooltip content={<span>{LanguageTable.chat.component.messageBox.helpful[language]}</span>}>
                    <Button
                      onPressEnd={() => {
                        rating_answer(questionUUID, true);
                      }}
                    >
                      👍
                    </Button>
                  </Tooltip>
                  <Tooltip content={<span>{LanguageTable.chat.component.messageBox.unhelpful[language]}</span>}>
                    <Button
                      onPressEnd={() => {
                        rating_answer(questionUUID, false);
                      }}
                    >
                      👎
                    </Button>
                  </Tooltip>
                </div>
              )}
            </ButtonGroup>
          </div>
        </div>
      </div>
    </div>
  );
};
