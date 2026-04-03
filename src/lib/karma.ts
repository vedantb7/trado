import prisma from "./prisma";

export async function updateKarma(userId: string, action: "TRADE_COMPLETED" | "POSITIVE_REVIEW" | "FAST_RESPONSE") {
  let increment = 0;

  switch (action) {
    case "TRADE_COMPLETED":
      increment = 10;
      break;
    case "POSITIVE_REVIEW":
      increment = 5;
      break;
    case "FAST_RESPONSE":
      increment = 2;
      break;
    default:
      increment = 0;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      karmaScore: {
        increment: increment
      }
    }
  });
}
