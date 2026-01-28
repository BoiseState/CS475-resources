// app/api/likes/route.ts
import { getLikes, incrementLikes } from '@/app/db';
import { isValidSession } from '@/app/session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({likes: await getLikes()});
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const jwt: string | undefined = cookieStore.get('jwt')?.value;
        const uuid: string | undefined = isValidSession(jwt);
        if (uuid === undefined) {
            return NextResponse.json({ success: false });
        }

        const body = await request.json();
        const postId = body.postId as number;
        const likes = await incrementLikes(postId, uuid);
        return NextResponse.json({ success: true, likes: likes });
    } catch (_) {
        return NextResponse.json({ success: false });
    }
}
