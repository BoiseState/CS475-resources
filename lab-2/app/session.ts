import {verify, sign, SignOptions} from 'jsonwebtoken';

const makeJWTOpts = () : SignOptions => ({
    algorithm: 'HS256',
    expiresIn: '1 day',
});

export const createSession = (uuid: string): string => {
    const signingSecret = process.env.JWT_KEY;
    if (signingSecret === undefined) {
        throw Error('JWT_KEY environment variable is not set');
    }

    const tok = {uuid};

    const jwt = sign(
        tok,
        signingSecret,
        makeJWTOpts(),
    );

    return jwt;
};

export const isValidSession = (jwt?: string): string | undefined => {
    if (jwt === undefined) {
        return undefined;
    }

    const signingSecret = process.env.JWT_KEY;
    if (signingSecret === undefined) {
        throw Error('JWT_KEY environment variable is not set');
    }

    try {
        return (verify(jwt, signingSecret) as {uuid: string}).uuid;
    } catch (err) {
        return;
    }
};
