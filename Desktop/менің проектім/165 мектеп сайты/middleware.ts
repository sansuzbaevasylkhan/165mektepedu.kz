import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Initialize Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Public Routes - Allow everyone
  const publicRoutes = ['/', '/about', '/news', '/privacy', '/login', '/register', '/timetable'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Authentication Guard
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Role-Based Authorization
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  // Admin Protection
  if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'director') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Director Protection
  if (pathname.startsWith('/director-admin') && role !== 'director') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Teacher Protection
  if (pathname.startsWith('/teacher') && role !== 'teacher') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Student Protection
  if (pathname.startsWith('/student') && role !== 'student') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Parent Protection
  if (pathname.startsWith('/parent') && role !== 'parent') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
