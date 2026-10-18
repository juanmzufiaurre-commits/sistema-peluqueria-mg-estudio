import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { devAdminEmail } from "@/server/auth/dev-admin";

/**
 * Refresca la sesión de Supabase y hace una verificación optimista para /admin/*.
 * La autorización real (lista de admins) se vuelve a comprobar en cada página y Server Action.
 */
export async function proxy(request: NextRequest) {
  // Acceso de prueba (solo `next dev` con DEV_ADMIN_EMAIL): sin Supabase, directo al panel.
  if (devAdminEmail()) {
    if (request.nextUrl.pathname === "/admin/login") return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const { pathname } = request.nextUrl;

  if (!data?.claims && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = { matcher: ["/admin/:path*"] };
