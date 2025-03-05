// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";

export async function fetchExamLists() {
    return await fetch(siteConfig.api_url + "/mock/exam-lists/").then((response) => {
    if (!response.ok) {
      console.error("Network response was not ok");
      return [];
    }
    return response.json();
  });
}
