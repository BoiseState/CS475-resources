'use client';

import { useSearchParams } from "next/navigation";

const messageNameToTitle = new Map([
    ['registration-failed', 'Registration Failed'],
    ['registration-succeeded', 'Registration Successful'],
    ['post-failed', 'Failed to Make Post'],
    ['login-failed', 'Login Failed'],
]);

export function ErrorBanner() {
    const searchParams = useSearchParams();

    const errorBannerMessageName = searchParams.get('error-banner-msg');
    if (errorBannerMessageName) {
        return (
            <div id="error-message-banner">
                {messageNameToTitle.get(errorBannerMessageName)}
            </div>
        );
    }

    const successBannerMessageName = searchParams.get('success-banner-msg');
    if (successBannerMessageName) {
        return (
            <div id="success-message-banner">
                {messageNameToTitle.get(successBannerMessageName)}
            </div>            
        );
    }

    return <></>;
}
