import { redirect } from "next/navigation";
import { createPost, getLikes, getPosts, Post } from "./db";
import Button from './likeButton';

export const dynamic = 'force-dynamic';

interface PostProps {
    posts: Post[];
}

export default async function Home() {
    const posts = await getPosts();
    return (
        <center>
            <PostForm />
            <PostTable posts={posts}/>
        </center>
    );
}

function PostTable({posts}: PostProps) {
    return (
        <div id="postTable">
            <table>
              <thead>
                <tr>
                <th>Post</th>
                <th>Likes</th>
                <th>Date</th>
                </tr>
               </thead>

               <tbody>
                 {
                   posts.map(post => 
                     <tr key={post.id}>
                       <td>{post.body}</td>
                       <td><Button likes={post.likes} postId={post.id}/></td>
                       <td>{post.date.toLocaleString()}</td>
                     </tr>
                   )
                 }
               </tbody>
            </table>
        </div>
    );
}

function PostForm() {
    async function submitForm(formData: FormData) {
        'use server';
        const postBody = formData.get('post') as string;
        await createPost(postBody);
        redirect('/');
    }

    return (
        <form action={submitForm}>
            <input type="text" placeholder="Type your post..." name="post" />
            <input type="submit" defaultValue="Post" />
        </form>
    );
}
