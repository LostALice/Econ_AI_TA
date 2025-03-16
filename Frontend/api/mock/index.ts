// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";
import { IExamsInfoForStudent } from "@/types/mock/index";

export async function getTargetedExamList(exam_id: number) {
  const resp = await fetch(siteConfig.api_url + "/mock/exam/cse/").then(
    (response) => {
      if (!response.ok) {
        console.error("Network response was not ok");
        return [];
      }
      return response.json();
    }
  );
  return resp.json();
}

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
