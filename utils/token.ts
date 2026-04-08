import { prisma } from "@/lib/prisma";

export async function refreshAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { refreshToken: true },
  });

  if (!user?.refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: user.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: data.access_token,
      tokenExpiry: expiresAt,
    },
  });

  return data.access_token;
}

export async function getValidToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessToken: true, tokenExpiry: true },
  });

  if (!user?.accessToken) {
    throw new Error("No access token found");
  }

  // Refresh if expired or expiring within 5 minutes
  const expiresAt = user.tokenExpiry ? new Date(user.tokenExpiry) : null;
  const isExpired =
    !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (isExpired) {
    return refreshAccessToken(userId);
  }

  return user.accessToken;
}
