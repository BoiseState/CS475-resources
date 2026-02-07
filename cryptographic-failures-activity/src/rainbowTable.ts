import { initDb, readPasswords, sha256 } from './common.js';

const migrations: Array<string> = [
    // TODO: Write a migration to build a table called `rainbow` with the
    // schema shown in the lab document.
];

async function main() {
    const passwords = await readPasswords('./password-data');
    const db = initDb('./data/users.db', migrations);
    let insertedPasswords: Set<string> = new Set();

    // TODO: Populate the database.

    db.close();
}

main();
