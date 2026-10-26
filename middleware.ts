import { NextResponse, type NextRequest } from "next/server";

// Gerbang awal (edge): tanpa cookie sesi -> login. Validasi sesi sebenarnya (DB, role, idle timeout)
// dilakukan di server pada layout dan setiap server action. Middleware BUKAN satu-satunya pertahanan.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const open = pathname === "/dashboard-admin/login" || pathname === "/dashboard-admin/signup";
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (!open && !req.cookies.get("apex_admin_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard-admin/login";
    url.search = "?reason=expired";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ["/dashboard-admin/:path*"] };
