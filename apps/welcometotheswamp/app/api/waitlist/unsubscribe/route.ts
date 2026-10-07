import { NextResponse } from "next/server";
import { unsubscribeByToken } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token || token.trim().length < 10) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>Invalid Link</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; color: #1c1917;">
          <h2>Invalid or Missing Unsubscribe Token</h2>
          <p>Please check the link provided in your enrollment confirmation.</p>
        </body>
      </html>`,
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  const result = await unsubscribeByToken(token.trim());

  if (!result.success) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>Subscription Not Found</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; color: #1c1917;">
          <h2>Subscription Not Found</h2>
          <p>This request may have already been removed or expired.</p>
        </body>
      </html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Unsubscribed • Welcome to the Swamp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0a09; color: #f5f5f4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #1c1917; border: 1px solid #292524; border-radius: 16px; padding: 36px; max-width: 480px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; }
          h1 { color: #fbbf24; font-size: 24px; margin-top: 0; }
          p { color: #d6d3d1; font-size: 15px; line-height: 1.6; }
          .btn { display: inline-block; margin-top: 24px; background: #fbbf24; color: #0c0a09; padding: 12px 24px; font-weight: bold; border-radius: 8px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>You're Unsubscribed</h1>
          <p>Your enrollment for <strong>${result.submission?.travelDate}</strong> has been cancelled. You will not receive any notifications regarding this request.</p>
          <a href="/" class="btn">Return to Welcome to the Swamp</a>
        </div>
      </body>
    </html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
