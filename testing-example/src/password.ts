export type Password = string & { __brand: 'Password' };

const minPasswordSize = 15;

function containedInBreach(passwordCandidate: string): boolean {
    const breachedPasswords = new Set([
        'qwerty123456789',
    ]);
    return breachedPasswords.has(passwordCandidate);
}

export function createPassword(passwordCandidate: string): undefined | Password {
    // NIST: All passwords must be normalized.
    const normalizedString = passwordCandidate.normalize('NFC');

    // NIST: Minimum length requirements.
    if (normalizedString.length < minPasswordSize) {
        return;
    }

    // NIST: reject passwords contained in breach.
    if (containedInBreach(normalizedString)) {
        return;
    }

    return normalizedString as Password;
}
