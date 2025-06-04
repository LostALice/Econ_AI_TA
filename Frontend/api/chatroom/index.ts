// Code by AkinoAlice@TyrantRey

import { TAskQuestionResponseFormat, IDocsFormat } from "@/types/chat/types";
import { siteConfig } from "@/config/site";
import { fetcher } from "../fetcher";

export async function askQuestion(
  chatUUID: string,
  question: string[],
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
    language: language,
    question_type: question_type,
    collection: collection,
    images: images,
  });

  console.log(postBody);
  const resp = await fetcher(`${siteConfig.api_url}/chatroom/${chatUUID}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: postBody,
  });
  const data = await resp;

  console.log(data);

  return {
    questionUUID: data.question_uuid,
    answer: data.answer,
    files: data.files,
  };
}

export async function getChatroomUUID(): Promise<string> {
  const response = await fetcher(siteConfig.api_url + "/chatroom/uuid/", {
    method: "GET",
  });
  return await response;
}

export async function fetchDocsList(
  documentationType: string
): Promise<IDocsFormat[]> {
  const resp = await fetcher(
    siteConfig.api_url + "/documentation/" + documentationType + "/",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );
  const data = await resp;

  if (!data.docs_list) {
    console.error("No documentation found.");
    return [];
  }

  let docsList = [];
  for (let file of data.docs_list) {
    const docsInfo: IDocsFormat = {
      fileID: file.file_id,
      fileName: file.file_name,
      lastUpdate: file.last_update.toString().replace("T", " "),
    };
    docsList.push(docsInfo);
  }
  console.debug(docsList);
  return docsList;
}
