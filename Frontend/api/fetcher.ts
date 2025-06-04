// Code by AkinoAlice@TyrantRey

import { deleteCookie } from "cookies-next";
import { addToast } from "@heroui/react";
import Router from "next/router";

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
  const data = await response.json();

  if (response.status >= 500) {
    // deleteCookie("token");
    // deleteCookie("role");

    addToast({
      title: response.status,
      description: "Internal Server Error",
      color: "warning",
    });
    return data;
  } else if (response.status == 422) {
    addToast({
      title: response.status,
      description: response.statusText,
      color: "warning",
    });
    return data;
  } else if (response.status == 404) {
    addToast({
      title: response.status,
      description: response.statusText,
      color: "warning",
    });
    return data;
  } else if (response.status >= 400) {
    deleteCookie("token");
    deleteCookie("role");

    Router.replace("/login");
    addToast({
      title: response.status,
      description: response.statusText,
      color: "warning",
    });
    return data;
  }

  return data;
}
