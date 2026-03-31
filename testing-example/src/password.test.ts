import { test, expect } from '@jest/globals';
import { createPassword } from './password.js';


test.each([
    ['',              undefined, 'empty string'],
    ['a'.repeat(14),         undefined, 'below minimum length'],
    ['a'.repeat(15),  'aaaaaaaaaaaaaaa',  'exactly 15 characters'],
    ['a'.repeat(64),  'a'.repeat(64),  'exactly 64 characters'],
    ['correct horse battery staple',  'correct horse battery staple',  'passphrase'],
    ['alllowercasecharacters',  'alllowercasecharacters',  'all lowercase characters'],
    ['prz',  undefined,  'below minimum length'],
    ['☺'.repeat(63), '☺'.repeat(63), 'length is counted by codepoints'],
    ['qwerty123456789', undefined, 'password used in breach'],
])("createPassword: %s → %s (%s)", (input, expected, label) => {
    expect(createPassword(input)).toBe(expected);
});
