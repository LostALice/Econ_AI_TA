// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";
import { IExamResult } from "@/types/mock/mock";

export async function fetchExamResults(
  submissionID: number
): Promise<IExamResult | null> {
  const resp = await fetch(
    siteConfig.api_url + "/mock/results/" + submissionID,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  
  const data = await resp.json();
  console.log(data);

  if (data == null) {
    return null
  }

  return data
}
