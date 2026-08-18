import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    locations: await prisma.location.count(),
    inventory: await prisma.locationInventory.count(),
    events: await prisma.event.count(),
    reviews: await prisma.review.count(),
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    activityLogs: await prisma.activityLog.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
