import { Pool, PoolClient } from 'pg';
import argon2 from 'argon2';
import { User } from './user';
import { randomUUID } from 'node:crypto';

export interface Post {
    id: number;
    body: string;
    likes: number;
    date: Date;
    canLike: boolean;
}

type Migration =
    | string
    | ((_: PoolClient) => Promise<void>);

/*
 * Statements to execute to initialize the database.
 * They are executed in order.
 */
const migrations: Array<Migration> = [
    `CREATE TABLE IF NOT EXISTS posts (id SERIAL PRIMARY KEY, body TEXT, likes INTEGER)`,
    `INSERT INTO posts (id, body, likes) SELECT 0, 'We will meet at 0500 to plot our next moves against EvilCorp.', 0 WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = 0)`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_date timestamp`,
    `UPDATE posts SET post_date = CURRENT_TIMESTAMP WHERE post_date IS NULL`,
    `CREATE EXTENSION IF NOT EXISTS pgcrypto`,
    `CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY UNIQUE, email TEXT UNIQUE NOT NULL,
password bytea NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
    async (client: PoolClient) => {
        await createUser({email: 'fake@fake', password: randomUUID()}, client);
    },
    `CREATE TABLE IF NOT EXISTS likes (
    user_id uuid REFERENCES users(id),
    post_id INTEGER REFERENCES posts(id),
    CONSTRAINT like_restriction UNIQUE (user_id, post_id)
)`,
];

// How long to wait to connect to the database.
const dbResponseTimeLimitSeconds = 180;

// Time to wait between connection attempts.
const dbBackoffSeconds = 5;

// This is the global connection pool for the database.
let pool: Pool | null = null;

// The hashing requirements.
const argon2HashRequirements = {
    // TODO
};

// initDb leaves the database in a state ready for application use.
async function initDb(pool: Pool) {
    const client = await pool.connect();
    for (const migration of migrations) {
        if (typeof migration === 'string') {
            await client.query(migration);   
        } else {
            await migration(client);
        }
    }
    client.release();
}

// Returns the connection pool for the database, initializing the pool if necessary.
async function getPool(): Promise<Pool> {
    if (pool == null) {
        pool = new Pool({
            user: 'postgres',
            host: process.env.POSTGRES_HOST,
            password: process.env.POSTGRES_PASSWORD,
            database: 'postgres',
            port: 5432,
        });

        const startTime = Date.now();
        let initialized = false;
        while (!initialized && (Date.now() - startTime) / 1000 < dbResponseTimeLimitSeconds) {
            try {
                await initDb(pool);
                initialized = true;
            } catch (err) {
                console.log('Waiting for database to come online...');
                console.error(err);
                await new Promise(resolve => setTimeout(resolve, dbBackoffSeconds * 1000));
            }
        }

        if (!initialized) {
            pool = null;
            throw new Error('Could not connect to database.');
        }
    }

    return pool;
}

// Returns the number of likes the default post has.
export async function getLikes(): Promise<number> {
    const pool = await getPool();
    return (await pool.query('SELECT count(post_id) FROM likes WHERE post_id = 0')).rows[0].count;
}

// Increments the number of likes of the default post, returning the new number of likes.
export async function incrementLikes(postId: number, uid: string): Promise<number> {
    const pool = await getPool();
    await pool.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING',
        [uid, postId],
    );
    const result = await pool.query('SELECT count(post_id) AS likes FROM likes WHERE post_id = $1', [postId]);
    return parseInt(result.rows[0].likes);
}

// Returns all of the posts.
export async function getPosts(uid?: string): Promise<Post[]> {
    const pool = await getPool();
    let result;
    if (uid === undefined) {
        result = await pool.query(
            `SELECT id, body, COALESCE(count, 0) AS likes, post_date, FALSE AS can_like 
FROM posts 
LEFT JOIN (SELECT count(post_id), post_id FROM likes GROUP BY post_id) ON id = post_id 
ORDER BY id ASC`,
        );  
    } else {
        result = await pool.query(
            `SELECT id, body, COALESCE(count, 0) AS likes, post_date, COALESCE(can_like, TRUE) AS can_like 
FROM posts 
LEFT JOIN (SELECT count(post_id), post_id FROM likes GROUP BY post_id) ON id = post_id 
LEFT JOIN (SELECT post_id as liked_post, FALSE as can_like FROM likes WHERE user_id = $1) ON id = liked_post 
ORDER BY id ASC`,
            [uid],
        );
    }

    return result.rows.map(row => ({
        id: row.id as number,
        body: row.body as string,
        likes: parseInt(row.likes),
        date: new Date(row.post_date),
        canLike: row.can_like as boolean,
    }));
}

// Creates a new post.
export async function createPost(postBody: string): Promise<void> {
    const pool = await getPool();
    await pool.query(`INSERT INTO posts (body, likes, post_date) VALUES ('${postBody}', 0, CURRENT_TIMESTAMP)`, []);
}

/*
 * Returns the key for the password column.
 * Throws an error if it is unable to obtain the key from the environment.
 */
function getPasswordColumnKey(): string {
    const key = process.env.PG_PASSWORD_KEY;
    if (key === undefined) {
        throw Error('Environment variable PG_PASSWORD_KEY not set.');
    }
    return key;
}

// Creates a new user.
// Returns false if creating the user fails for any reason.
export async function createUser(user: User, thePool?: PoolClient): Promise<boolean> {
    const pool = thePool === undefined ? await getPool() : thePool;

    const uuid = crypto.randomUUID();
    try {
        await pool.query(
            `INSERT INTO users (id, email, password) VALUES ($1, $2, pgp_sym_encrypt($3, $4))`,
            [uuid, user.email, user.password, getPasswordColumnKey()],
        );
    } catch (_) {
        return false;
    }

    return true;
}

// Authenticates a user.
// Returns the uuid of the user if authentication succeeds.
export async function authenticateUser(user: User): Promise<string | undefined> {
    const pool = await getPool();
    const trustedStoredPasswordHash =
        await pool.query(
            `SELECT id, pgp_sym_decrypt(password::bytea, $1) AS password FROM users WHERE email = $2`,
            [getPasswordColumnKey(), user.email],
        );
    if (trustedStoredPasswordHash.rowCount !== 1) {
        return;
    }

    if (trustedStoredPasswordHash.rows[0].password === user.password) {
        return trustedStoredPasswordHash.rows[0].id;
    }
}
