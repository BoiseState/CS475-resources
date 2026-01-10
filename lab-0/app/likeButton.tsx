'use client';

import { useState } from "react";

export interface ButtonProps {
    likes: number;
    postId: number;
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

export default function Button({likes, postId}: ButtonProps) {
    const [numLikes, setNumLikes] = useState(likes);

    const updateLikes = () => {
        incrementLikes(postId).then(likes => setNumLikes(likes || numLikes));
    };

    return <button type="button" onClick={updateLikes}>
        {numLikes} Likes
    </button>
}
