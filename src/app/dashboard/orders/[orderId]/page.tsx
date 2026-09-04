import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order detail" };

type Props = { params: Promise<{ orderId: string }> };

export default async function DashboardOrderDetailPage({ params }: Props) {
  await params;
  return null;
}
