'use server';

import { redirect } from "next/navigation";
import { createUser } from "../db";

const minPasswordLength = 15;

export async function handleRegistration(formData: FormData) {
    const registrationFailedPage = '/?error-banner-msg=registration-failed';
    const registrationSuccessPage = '/?success-banner-msg=registration-succeeded';

    const email = formData.get('email');
    const password = formData.get('password');
    if (typeof email !== 'string' || typeof password !== 'string' ||
        email === null || password === null) {
        redirect(registrationFailedPage);
    } else if (!validatePassword(password)) {
        redirect(registrationFailedPage);
    }

    const creationSucceeded = await createUser({email, password});
    if (creationSucceeded) {
        redirect(registrationSuccessPage);
    } else {
        redirect(registrationFailedPage);
    }
};

function validatePassword(password: string): boolean {
    return password.length >= minPasswordLength;
}
