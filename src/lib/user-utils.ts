import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function ensureUserInDatabase(clerkUserId: string) {
  // Check if user already exists in our database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (user) {
    return user;
  }

  // If user doesn't exist, get their details from Clerk and create them
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    throw new Error("Unable to fetch user from Clerk");
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    email => email.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;
  
  if (!primaryEmail) {
    throw new Error("No primary email address found");
  }

  // Create the user in our database
  user = await prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email: primaryEmail,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
      imageUrl: clerkUser.imageUrl || null,
    },
  });

  console.log(`Created new user in database: ${user.id} (Clerk ID: ${clerkUserId})`);
  
  return user;
} 