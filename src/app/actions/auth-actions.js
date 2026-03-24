'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

const DEFAULT_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Ropa',
  'Educación',
  'Gastos Varios',
];

export async function registerUser(prevState, formData) {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();
  const name = formData.get('name')?.toString().trim();

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos.' };
  }
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Ya existe una cuenta con ese email.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user + default categories + initial period in one transaction
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name: name || null, passwordHash },
    });

    // Seed default categories
    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((catName) => ({
        name: catName,
        userId: user.id,
      })),
    });

    // Create an initial active period
    await tx.period.create({
      data: { userId: user.id, isActive: true, startDate: new Date() },
    });
  });

  // Auto sign-in after registration
  await signIn('credentials', { email, password, redirectTo: '/' });
}

export async function loginUser(prevState, formData) {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email o contraseña incorrectos.' };
        default:
          return { error: 'Ocurrió un error. Intenta de nuevo.' };
      }
    }
    throw error; // NEXT_REDIRECT must bubble up
  }
}
