import { redirect } from "next/navigation";
import { authenticateCredentials } from "../db";
import { cookies } from "next/headers";

export default async function LoginForm({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    const doLogin = async (formData: FormData) => {
        'use server';
        const email = formData.get('email')?.valueOf();
        const password = formData.get('password')?.valueOf();

        if (typeof email !== 'string' || typeof password !== 'string') {
            redirect('/login?error=Please+provide+both+email+and+password');
        }

        if (email.trim() === '' || password.trim() === '') {
            redirect('/login?error=Email+and+password+cannot+be+empty');
        }

        let sessionToken: string | undefined;
        try {
            sessionToken = await authenticateCredentials({ email, password });
        } catch {
            redirect('/login?error=An+unexpected+error+occurred.+Please+try+again+later');
        }

        if (!sessionToken) {
            redirect('/login?error=Invalid+email+or+password');
        }

        const cookieStore = await cookies();
        cookieStore.set('sessionToken', sessionToken, {
            sameSite: 'none',
            secure: false,
        });

        redirect('/');
    };

    return (
        <div className="card form-card">
            <div className="card-body">
                <h2>Log In</h2>

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                <form action={doLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Password"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Log In
                    </button>
                </form>
            </div>
        </div>
    );
}
