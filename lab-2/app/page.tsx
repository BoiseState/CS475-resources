import { redirect } from "next/navigation";
import { createPost, getPosts, Post } from "./db";
import { ErrorBanner } from './error-banners';
import { cookies } from "next/headers";
import { isValidSession } from "./session";
import Button from "./likeButton";

export const dynamic = 'force-dynamic';

interface PostProps {
    posts: Post[];
}

export default async function Home() {
    const cookieStore = await cookies();
    const jwt = cookieStore.get('jwt')?.value;
    const uid = isValidSession(jwt);
    const posts = await getPosts(uid);
    return (
        <center>
            <ErrorBanner/>
            <PostOrLogInHeader />
            <PostTable posts={posts}/>
        </center>
    );
}

async function PostTable({posts}: PostProps) {
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
                       <td><Button likes={post.likes} postId={post.id} canLike={post.canLike} /></td>
                       <td>{post.date.toLocaleString()}</td>
                     </tr>
                   )
                 }
               </tbody>
            </table>
        </div>
    );
}

async function PostOrLogInHeader() {
    const cookieStore = await cookies();
    const jwt: string | undefined = cookieStore.get('jwt')?.value;

    if (jwt === undefined) {
        return <LogInOrRegisterHeader/>;
    } else {
        return (
          <div>
                <PostForm/>
                <a href="/logout">Log Out</a>
          </div>
        );
    }
}

function LogInOrRegisterHeader() {
    return (
        <div id='login-or-register-banner'>
            <a href='/login'>Login</a> or <a href='/register'>register</a> to post and like.
        </div>
    );
}

function PostForm() {
    async function submitForm(formData: FormData) {
        'use server';
        const cookieStore = await cookies();
        const jwt = cookieStore.get('jwt')?.value;

        if (jwt === undefined || !isValidSession(jwt)) {
            redirect('/?error-banner-msg=post-failed');
        }

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
