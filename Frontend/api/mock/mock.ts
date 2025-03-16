// Code by AkinoAlice@TyrantRey

import { MockExamQuestionList, MockExamInformation } from "@/types/mock/mock";
import { siteConfig } from "@/config/site";

export async function fetchMockExamQuestionList(
  mock_id: number
): Promise<[MockExamQuestionList[], MockExamInformation]> {
  const resp = await fetch(siteConfig.api_url + "/mock/" + mock_id + "/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return resp.json();
}
