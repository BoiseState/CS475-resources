import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { destroySession } from "../db";

export default async function LogoutPage() {
    const doLogout = async () => {
        'use server';
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('sessionToken')?.value;

        if (sessionToken) {
            await destroySession(sessionToken);
            cookieStore.delete('sessionToken');
        }

        redirect('/');
    };

    // Immediately log out by auto-submitting the form
    return (
        <form action={doLogout}>
            <noscript>
                <button type="submit" className="btn btn-primary">Click to Log Out</button>
            </noscript>
            <input type="hidden" name="logout" value="1" />
            <script dangerouslySetInnerHTML={{ __html: `document.forms[0].requestSubmit()` }} />
        </form>
    );
}
