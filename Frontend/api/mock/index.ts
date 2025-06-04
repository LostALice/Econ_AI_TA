// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";
import { fetcher } from "../fetcher";
import { IExamsModel } from "@/types/mock/create";

export async function getExamTypeList(
  exam_type: string
): Promise<IExamsModel[]> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/mock/exam/${exam_type}/`);
    console.log(resp)
    return resp as IExamsModel[]
  }
  catch (err) {
    console.error(err)
    return []
  }
}
