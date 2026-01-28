'use server';

import { redirect } from "next/navigation";
import { createSession } from "./session";
import { cookies } from "next/headers";
import { authenticateUser } from "./db";

export const handleLogIn = async (formData: FormData) => {
    const email = formData.get('email');
    const password = formData.get('password');

    if (typeof email !== 'string' || typeof password !== 'string' ||
        email === null || password === null) {
        redirect('/login?error-banner-msg=login-failed');
    }

    const user = {email, password};
    const uuid = await authenticateUser(user);
    if (uuid !== undefined) {
        const sessionJWT = createSession(uuid);
        const cookieStore = await cookies();
        cookieStore.set('jwt', sessionJWT);
        redirect('/');
    } else {
        redirect('/login?error-banner-msg=login-failed');
    }
};
