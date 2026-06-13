"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword, generateToken, getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["TEACHER", "STUDENT"]),
});

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validated = loginSchema.safeParse({ email, password });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password" };
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  } catch (error) {
    console.error("Login action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function registerAction(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "TEACHER" | "STUDENT";

    const validated = registerSchema.safeParse({ name, email, password, role });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "Email is already registered" };
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    const token = generateToken({
      userId: user.id,
      role: user.role,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  } catch (error) {
    console.error("Register action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  return { success: true };
}

export async function checkAuthAction() {
  const user = await getCurrentUser();
  if (!user) return { authenticated: false };
  return { authenticated: true, user };
}
