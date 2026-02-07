import Database, {type Database as DatabaseType} from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function readPasswords(dir: string): Promise<Array<string>> {
    const files = await readdir(dir);
    const contents = await Promise.all(
        files.map(f => readFile(join(dir, f), 'utf-8'))
    );
    return contents.flatMap(text => text.split('\n').filter(line => line.trim() !== ''));
}

export function initDb(path: string, migrations: Array<string>): DatabaseType {
    const db = new Database(path);
    for (const migration of migrations) {
        db.exec(migration);
    }
    return db;
}

export function sha256(data: string): string {
    const hash = createHash('sha256');
    hash.update(data);
    return hash.digest('base64');
}
