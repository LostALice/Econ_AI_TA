// Code by AkinoAlice@TyrantRey

import {
  IMockExamQuestionList,
  IMockExamInformation,
  ISubmittedExam,
  IExamResult,
} from "@/types/mock/mock";
import { siteConfig } from "@/config/site";

export async function fetchMockExamQuestionList(
  mock_id: number
): Promise<[IMockExamQuestionList[], IMockExamInformation]> {
  const resp = await fetch(siteConfig.api_url + "/mock/" + mock_id + "/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return resp.json();
}

export async function submitExam(
  submitted_exam: ISubmittedExam
): Promise<number> {
  const resp = await fetch(siteConfig.api_url + "/mock/submit/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submitted_exam),
  });

  return resp.json();
}

export async function examResult(submission_id: number): Promise<IExamResult> {
  const resp = await fetch(
    siteConfig.api_url + "/mock/result/" + submission_id + "/",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return resp.json();
}
