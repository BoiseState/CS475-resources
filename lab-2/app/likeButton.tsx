'use client';

import { useState } from "react";

export interface ButtonProps {
    likes: number;
    postId: number;
    canLike: boolean;
}

async function incrementLikes(postId: number): Promise<number | undefined> {
    const response = await fetch(
        '/api/likes',
        {
            method: 'POST',
            body: JSON.stringify({postId}),
        },
    );
    const result = await response.json();
    if (result.success) {
        return result.likes;
    }
}

export default function Button({likes, postId, canLike}: ButtonProps) {
    const [numLikes, setNumLikes] = useState(likes);
    const [likeEnabled, setLikeEnabled] = useState(canLike);

    const handleLike = () => {
        setLikeEnabled(false);
        incrementLikes(postId).then(likes => setNumLikes(likes || numLikes));
    };

    const likeMessage = numLikes === 1 ? 'Like' : 'Likes';

    return <button type="button" onClick={handleLike} disabled={!likeEnabled}>
        {numLikes} {likeMessage}
    </button>
}
