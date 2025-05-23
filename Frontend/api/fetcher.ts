// Code by AkinoAlice@TyrantRey

import { useContext } from "react";
import { deleteCookie } from "cookies-next";
import { addToast } from "@heroui/react";
import Router from "next/router";
import { LangContext } from "@/contexts/LangContext";
import { LanguageTable } from "@/i18n";

export interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

export async function fetcher(
  url: string,
  options: FetchOptions = {}
): Promise<any> {
  const defaultOptions: FetchOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = response.json();

  if (response.status >= 400) {
    deleteCookie("jwt");
    deleteCookie("role");

    Router.replace("/login");
    addToast({
      title: response.status,
      description: "Session Timeout, Please re-login",
      color: "warning",
    });
    return data;
  }

  return data;
}
