// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";
import { fetcher } from "../fetcher";

export default async function rating_answer(
  questionUUID: string,
  rating: boolean
): Promise<boolean> {
  const response = await fetcher(siteConfig.api_url + "/chatroom/rating/", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      question_uuid: questionUUID,
      rating: rating,
    }),
  });

  return await response;
}
