// Code by AkinoAlice@TyrantRey

import { TAskQuestionResponseFormat, IDocsFormat } from "@/types/chat/types";
import { siteConfig } from "@/config/site";

export async function askQuestion(
  chatUUID: string,
  question: string[],
  userID: string,
  language: string,
  collection: string | "default" = "default",
  images: string[],
  question_type: "CHATTING" | "TESTING" | "THEOREM" = "CHATTING"
): Promise<TAskQuestionResponseFormat> {
  if (language === "en") {
    language = "ENGLISH";
  } else if (language === "zh") {
    language = "CHINESE";
  } else {
    language = "CHINESE";
  }

  const postBody = JSON.stringify({
    chat_id: chatUUID,
    question: question,
    sent_by_username: userID,
    language: language,
    question_type: question_type,
    collection: collection,
    images: images,
  });

  console.log(postBody);
  const resp = await fetch(`${siteConfig.api_url}/chatroom/${chatUUID}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: postBody,
  });
  const data = await resp.json();

  console.log(data);

  return {
    questionUUID: data.question_uuid,
    answer: data.answer,
    files: data.files,
  };
}

export async function getChatroomUUID(): Promise<string> {
  const response = await fetch(siteConfig.api_url + "/chatroom/uuid/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}
