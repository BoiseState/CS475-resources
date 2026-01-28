import { Suspense } from "react";
import { handleLogIn } from "../authenticate";
import { ErrorBanner } from '../error-banners';

export default function Login() {
    return (
        <div id="login-form">
            <center>
            <Suspense>
              <ErrorBanner />
            </Suspense>
            <form action={handleLogIn}>
              <input type="email" placeholder="email address" name="email" />
              <br />
              <input type="password" placeholder="password" name="password" />
              <br />
              <input type="submit" defaultValue="Log In"/>
            </form>
            </center>
        </div>
    );
}
