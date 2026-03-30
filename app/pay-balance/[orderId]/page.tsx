import PayBalanceClient from "./PayBalanceClient";

export default async function PayBalancePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <PayBalanceClient orderId={orderId} />;
}
