// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";
import { IExamResult } from "@/types/mock/mock";

export async function fetchExamResults(
  submissionID: number
): Promise<IExamResult> {
  const resp = await fetch(
    siteConfig.api_url + "/mock/results/" + submissionID,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  console.log(resp.json());

  return {
    exam_id: 1,
    submission_id: 1,
    user_id: 1,
    exam_name: "Mock Exam",
    exam_type: "Mock Exam Type",
    exam_date: "2022-01-01",
    total_correct_answers: 10,
    score_percentage: 90,
  };
}
