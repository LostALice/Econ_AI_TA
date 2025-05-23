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
import { fetcher } from "../fetcher";

export async function fetchExamLists(): Promise<IExamsInfo[]> {
  return await fetcher(siteConfig.api_url + "/mock/exam-lists/");
}

export async function createNewExam(
  exam: ICreateNewExamPrams
): Promise<IExamsInfo> {
  const resp = await fetcher(siteConfig.api_url + "/mock/new/exam/", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(exam),
  });

  return resp;
}

export async function updateExam(exam: IExamsInfo) {
  const resp = await fetcher(siteConfig.api_url + "/mock/modify/exam/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(exam),
  });

  return resp;
}

export async function deleteExam(examId: number) {
  const resp = await fetcher(siteConfig.api_url + "/mock/delete/exam/", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ exam_id: examId }),
  });

  return resp;
}

export async function createNewQuestion(question: ICreateNewQuestionPrams) {
  const resp = await fetcher(siteConfig.api_url + "/mock/new/question/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(question),
  });

  return resp;
}

export async function createNewOptions(
  options: ICreateNewQuestionOptionsPrams[]
): Promise<IExamOption[]> {
  console.log(options);
  const resp = await fetcher(siteConfig.api_url + "/mock/new/options/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(options),
  });

  return resp;
}

export async function modifyQuestion(
  question: IExamQuestion
): Promise<boolean> {
  const resp = await fetcher(siteConfig.api_url + "/mock/modify/question/", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(question),
  });

  return resp;
}

export async function deleteQuestion(questionId: number) {
  const resp = await fetcher(
    siteConfig.api_url + "/mock/delete/question/" + questionId,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  return resp;
}
