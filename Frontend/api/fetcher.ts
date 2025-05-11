// Code by AkinoAlice@TyrantRey
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

  if (response.status != 200) {
    window.location.replace("/login");
  }

  return response;
}
