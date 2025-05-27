import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";

// Types for Clerk webhook payloads
type EventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "organization.created"
  | "organization.updated"
  | "organization.deleted"
  | "organizationInvitation.created"
  | "organizationMembership.created"
  | "organizationMembership.deleted";

type Event = {
  data: Record<string, unknown>;
  object: "event";
  type: EventType;
};

// This is the function that will handle the webhook request
export async function POST(req: Request) {
  // Get the headers
  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create an object of the headers
  const svixHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  } as WebhookRequiredHeaders;

  // Get the webhook secret from environment variables
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Error: CLERK_WEBHOOK_SECRET is not set");
    return new Response("Error: Missing webhook secret", { status: 500 });
  }

  // Create a new Webhook instance with the secret
  const wh = new Webhook(secret);

  let evt: Event;

  try {
    // Verify the webhook payload
    evt = wh.verify(body, svixHeaders) as Event;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  // Handle the different event types
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    if (!email_addresses || (email_addresses as { email_address: string }[]).length === 0) {
      return new Response("Error: No email addresses found", { status: 400 });
    }

    const primaryEmail = (email_addresses as { email_address: string }[])[0].email_address;

    // Upsert the user in the database
    await prisma.user.upsert({
      where: { clerkId: id as string },
      update: {
        email: primaryEmail,
        name: `${first_name || ""} ${last_name || ""}`.trim() || null,
        imageUrl: image_url as string | null,
      },
      create: {
        clerkId: id as string,
        email: primaryEmail,
        name: `${first_name || ""} ${last_name || ""}`.trim() || null,
        imageUrl: image_url as string | null,
      },
    });

    console.log(`User ${id} has been ${eventType === "user.created" ? "created" : "updated"}`);
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    // Delete the user from the database
    await prisma.user.delete({
      where: { clerkId: id as string },
    });

    console.log(`User ${id} has been deleted`);
  }

  return NextResponse.json({ success: true });
}