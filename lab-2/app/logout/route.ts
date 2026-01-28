import { cookies } from "next/headers"
import { redirect } from "next/navigation";

export async function GET(_request: Request) {
    const cookieJar = await cookies();
    cookieJar.delete('jwt');
    redirect('/');
}
