import { Pool } from 'pg';

export interface Post {
    id: number;
    body: string;
    likes: number;
    date: Date;
}

/*
 * Statements to execute to initialize the database.
 * They are executed in order.
 */
const migrations = [
    `CREATE TABLE IF NOT EXISTS posts (id SERIAL PRIMARY KEY, body TEXT, likes INTEGER)`,
    `INSERT INTO posts (id, body, likes) SELECT 0, 'hello world', 0 WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = 0)`,
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_date timestamp`,
    `UPDATE posts SET post_date = CURRENT_TIMESTAMP WHERE post_date IS NULL`,
];

// How long to wait to connect to the database.
const dbResponseTimeLimitSeconds = 180;

// Time to wait between connection attempts.
const dbBackoffSeconds = 5;

// This is the global connection pool for the database.
let pool: Pool | null = null;

// initDb leaves the database in a state ready for application use.
async function initDb(pool: Pool) {
    const client = await pool.connect();
    await Promise.all(migrations.map(migration => pool.query(migration)));
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
            } catch (_) {
                console.log('Waiting for database to come online...');
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
    return (await pool.query('SELECT likes FROM posts WHERE id = 0')).rows[0].likes;
}

// Increments the number of likes of the default post, returning the new number of likes.
export async function incrementLikes(postId: number): Promise<number> {
    const pool = await getPool();
    const result = (await pool.query('UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING likes', [postId]));
    return result.rows[0].likes;
}

// Returns all of the posts.
export async function getPosts(): Promise<Post[]> {
    const pool = await getPool();
    const result = await pool.query(`SELECT id, body, likes, post_date FROM posts ORDER BY id DESC`);
    return result.rows.map(row => ({
        id: row.id as number,
        body: row.body as string,
        likes: row.likes as number,
        date: new Date(row.post_date),
    }));
}

// Creates a new post.
export async function createPost(postBody: string): Promise<void> {
    const pool = await getPool();
    await pool.query(`INSERT INTO posts (body, likes, post_date) VALUES ($1, 0, CURRENT_TIMESTAMP)`, [postBody]);
}
