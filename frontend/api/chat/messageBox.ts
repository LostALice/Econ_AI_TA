// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";

export default async function rating_answer(
  questionUUID: string,
  rating: boolean
): Promise<boolean> {
  const response = await fetch(siteConfig.api_url + "/chatroom/rating/", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question_uuid: questionUUID,
      rating: rating,
    }),
  });

  return await response.json();
}
