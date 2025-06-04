// // Code by AkinoAlice@TyrantRey

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Custom-Header", "test");

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: "/:path*",
};
