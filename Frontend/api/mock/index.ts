// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";
import { IExamsInfoForStudent } from "@/types/mock/index";

export async function getTargetedExamTypeList(
  exam_type: string
): Promise<IExamsInfoForStudent[]> {
  const resp = await fetch(
    siteConfig.api_url + "/mock/exam/" + exam_type + "/",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return resp.json();
}
