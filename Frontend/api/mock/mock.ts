// Code by AkinoAlice@TyrantRey

import {
  IMockExamQuestionList,
  IMockExamInformation,
  ISubmittedExam,
  IExamResult,
} from "@/types/mock/mock";

import { IExamsModel } from "@/types/mock/create";
import { siteConfig } from "@/config/site";
import { fetcher } from "../fetcher";

export async function fetchExamQuestionList(
  mock_id: number
): Promise<[IExamsModel]> {
  const resp = await fetcher(siteConfig.api_url + "/mock/" + mock_id + "/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return resp;
}

export async function submitExam(
  submitted_exam: ISubmittedExam
): Promise<number> {
  const resp = await fetcher(siteConfig.api_url + "/mock/submit/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(submitted_exam),
  });

  return resp;
}

// export async function fetchExamResult(
//   submission_id: number
// ): Promise<IExamResult> {
//   const resp = await fetcher(
//     siteConfig.api_url + "/mock/result/" + submission_id + "/",
//     {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   ).catch((error) => {
//     console.error("Error:", error);
//   });

//   return resp;
// }
