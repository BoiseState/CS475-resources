'use client';

import { ChangeEvent, useState } from "react";
import { handleRegistration } from "./registration";

export default function RegistrationPage() {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handlePasswordConfirmationChange =
        (e: ChangeEvent<HTMLInputElement>) => {
            setPasswordConfirmation(e.target.value);
        };

    return (
        <center>
          <form action={handleRegistration}>
            <input type='email' placeholder='email address' name='email'/>
            <br/>
            <input type='password' placeholder='password' name='password' minLength={15} value={password} onChange={handlePasswordChange} />
            <br/>
            <input type='password'
                   placeholder='confirm password'
                   name='password-confirmation'
                   minLength={15}
                   pattern={password}
                   onInvalid={(e) => {
                     (e.target as HTMLInputElement).setCustomValidity("Passwords must match.");
            }}
                   onChange={handlePasswordConfirmationChange}
                   value={passwordConfirmation}
            />
            <br/>
            <input type='submit' defaultValue='Register'/>
          </form>
        </center>
    );
}
