// Code by AkinoAlice@TyrantRey

import { TAskQuestionResponseFormat, IDocsFormat } from "@/types/chat/type";
import { siteConfig } from "@/config/site";

export async function askQuestion(
  chatUUID: string,
  question: string[],
  userID: string,
  language: string,
  collection: string | "default" = "default",
  question_type: "CHATTING" | "TESTING" | "THEOREM" = "CHATTING"
): Promise<TAskQuestionResponseFormat> {
  if (language === "en") {
    language = "ENGLISH";
  } else if (language === "zh") {
    language = "CHINESE";
  } else {
    language = "CHINESE";
  }

  console.log(
    JSON.stringify({
      chat_id: chatUUID,
      question: question,
      user_id: userID,
      language: language, 
      collection: collection,
      question_type: question_type
    })
  );
  const resp = await fetch(`${siteConfig.api_url}/chatroom/${chatUUID}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatUUID,
      question: question,
      user_id: userID,
      language: language,
      collection: collection,
      question_type: question_type,
    }),
  });
  const data = await resp.json();
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
