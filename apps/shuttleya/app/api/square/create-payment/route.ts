export async function POST() {
  return Response.json(
    {
      ok: false,
      error: "ShuttleYa no longer operates or sells the Denver to Mighty Argo scheduled shuttle. No transportation payment is accepted here.",
    },
    { status: 410 },
  );
}
