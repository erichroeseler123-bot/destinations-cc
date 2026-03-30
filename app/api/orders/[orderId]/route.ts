import { readStoredOrder } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const order = await readStoredOrder(orderId);

  if (!order) {
    return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  return Response.json({ ok: true, order });
}
