import {
  ADMIN_SESSION_COOKIE,
  isAdminAccessConfigured,
  isValidAdminSession,
} from "@/lib/adminAccess";

export { ADMIN_SESSION_COOKIE };

export function canViewTourAdminDebugDiagnostics(input: {
  adminSessionCookie?: string | null;
  debugParam?: string | string[] | null;
}): boolean {
  if (!isAdminAccessConfigured()) {
    return false;
  }
  if (!isValidAdminSession(input.adminSessionCookie)) {
    return false;
  }
  const rawDebug = Array.isArray(input.debugParam)
    ? input.debugParam[0]
    : input.debugParam;
  if (rawDebug === "0" || rawDebug === "false") {
    return false;
  }
  return true;
}
