// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";
import { IMockResult } from "@/types/mock/create";
import { fetcher } from "@/api/fetcher";

export async function fetchExamResults(
  submissionID: number
): Promise<IMockResult | null> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/result/mock/${submissionID}/`, {
      method: "GET",
    });
    console.log(resp);
    return resp as IMockResult;
  }
  catch (error) {
    console.error(error);
    return null;
  }
}
