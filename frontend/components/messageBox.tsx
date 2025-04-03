import { FC } from "react";
import { siteConfig } from "@/config/site";

import { Divider } from "@heroui/divider";
import { Tooltip } from "@heroui/tooltip";
import { Link } from "@heroui/link";
import { Button, ButtonGroup } from "@heroui/button";

import { IMessageInfo } from "@/types";
import { useState } from "react";

export const MessageBox: FC<IMessageInfo> = ({
  questionUUID,
  question,
  answer,
  files,
  time,
}) => {
  const [isButtonGroupDisabled, setIsButtonGroupDisabled] =
    useState<Boolean>(false);

  function rating_answer(questionUUID: string, rating: boolean) {
    fetch(siteConfig.api_url + "/rating/", {
      method: "POST",
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
  return (
    <Tooltip
      content={
        <span>
          {time} {questionUUID}
        </span>
      }
      placement="top-end"
      delay={5}
      crossOffset={-5}
    >
      <div className="border rounded-lg border-emerald-600 m-3">
        <div className="justify-around p-4">
          <span className="italic">{question}</span>
          <Divider className="my-2" />
          <span className="">{answer}</span>
          <Divider className="my-2" />
          <div className="flex justify-between">
            <div className="flex text-left gap-3">
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
                  <Button isDisabled={true}>感謝你的回饋</Button>
                ) : (
                  <div>
                    <Tooltip content={<span>有幫助</span>}>
                      <Button
                        onClick={() => {
                          rating_answer(questionUUID, true);
                        }}
                      >
                        👍
                      </Button>
                    </Tooltip>
                    <Tooltip content={<span>沒有幫助</span>}>
                      <Button
                        onClick={() => {
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
    </Tooltip>
  );
};
