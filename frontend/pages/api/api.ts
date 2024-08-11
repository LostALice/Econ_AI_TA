// Code by AkinoAlice@TyrantRey

import { TAskQuestionResponseFormat, IDocsFormat } from "@/types/api";

import { siteConfig } from "@/config/site";

export async function askQuestion(
  chatUUID: string,
  question: string,
  userID: string,
  collection: string | "default" = "default"
): Promise<TAskQuestionResponseFormat> {
  const resp = await fetch(siteConfig.api_url + "/chat/" + chatUUID, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatUUID,
      question: question,
      user_id: userID,
      collection: collection,
    }),
  });
  const data = await resp.json();
  return {
    questionUUID: data.question_uuid,
    answer: data.answer,
    files: data.files,
  };
}

export async function fetchDocsList(
  department: string
): Promise<IDocsFormat[]> {
  const resp = await fetch(
    siteConfig.api_url + "/department/" + department + "/",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await resp.json();

  let docsList = [];
  for (let file of data.docs_list) {
    const docsInfo: IDocsFormat = {
      fileID: file.file_id,
      fileName: file.file_name,
      lastUpdate: file.last_update.toString().replace("T", " "),
    };
    docsList.push(docsInfo);
  }
  return docsList;
}

export async function fetchDocs(docsID: string): Promise<Blob> {
  const resp = await fetch(
    siteConfig.api_url + "/documentation/" + docsID + "/",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/pdf",
      },
    }
  );
  const data = await resp.blob();

  return data;
}
