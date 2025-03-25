// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";
import {
  IExamsInfo,
  IExamOption,
  IExamQuestion,
  ICreateNewExamPrams,
  ICreateNewQuestionOptionsPrams,
  ICreateNewQuestionPrams,
} from "@/types/mock/create";

export async function fetchExamLists(): Promise<IExamsInfo[]> {
  return await fetch(siteConfig.api_url + "/mock/exam-lists/").then(
    (response) => {
      if (!response.ok) {
        console.error("Network response was not ok");
        return [];
      }
      return response.json();
    }
  );
}

export async function createNewExam(
  exam: ICreateNewExamPrams
): Promise<IExamsInfo> {
  const resp = await fetch(siteConfig.api_url + "/mock/new/exam/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(exam),
  });

  return resp.json();
}

export async function updateExam(exam: IExamsInfo) {
  const resp = await fetch(siteConfig.api_url + "/mock/modify/exam/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(exam),
  });

  return resp.json();
}

export async function deleteExam(examId: number) {
  const resp = await fetch(siteConfig.api_url + "/mock/delete/exam/", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ exam_id: examId }),
  });

  return resp.json();
}

export async function createNewQuestion(question: ICreateNewQuestionPrams) {
  const resp = await fetch(siteConfig.api_url + "/mock/new/question/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(question),
  });

  return resp.json();
}

export async function createNewOptions(
  options: ICreateNewQuestionOptionsPrams[]
): Promise<IExamOption[]> {
  console.log(options);
  const resp = await fetch(siteConfig.api_url + "/mock/new/options/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  return resp.json();
}

export async function modifyQuestion(
  question: IExamQuestion
): Promise<boolean> {
  const resp = await fetch(siteConfig.api_url + "/mock/modify/question/", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(question),
  });

  return resp.json();
}

export async function deleteQuestion(questionId: number) {
  const resp = await fetch(
    siteConfig.api_url + "/mock/delete/question/" + questionId,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return resp.json();
}
