import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BLOCK = [
  /^\/\.env/i,
  /^\/env/i,
  /^\/config\.(js|json)/i,
  /^\/__env\.js/i,
  /^\/@vite/i,
  /^\/wp-admin/i,
  /^\/wp-login/i,
  /^\/phpmyadmin/i,
  /^\/\.git/i,
];

export function proxy(req: NextRequest) {
  const p = req.nextUrl.pathname;

  if (BLOCK.some((re) => re.test(p))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

// Run everywhere (simple + effective)
export const config = {
  matcher: "/:path*",
};
