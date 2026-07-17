"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  verifyCredentials,
  createSession,
  destroySession,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }
  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Those credentials don't match an account." };
  }
  await createSession(user.id);
  redirect("/slots");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
