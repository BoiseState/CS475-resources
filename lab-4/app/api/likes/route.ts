// app/api/likes/route.ts
import { getLikes, incrementLikes } from '@/app/db';
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({likes: await getLikes()});
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const postId = body.postId as number;
        const likes = await incrementLikes(postId);
        return NextResponse.json({ success: true, likes: likes });
    } catch (_) {
        return NextResponse.json({ success: false });
    }
}
