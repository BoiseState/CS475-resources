import type { Password } from "./password.js";

export interface Queryable {
    query(query: string, params?: any[]): Promise<any>;
}

export interface User {
    username: string,
    password: Password,
}

export async function registerUser(user: User, db: Queryable): Promise<boolean> {
    // Broken:
    const result = await db.query(`insert into users values ('${user.username}', '${user.password}')`);

    // Fixed:
    // const result = await db.query(
    //     `insert into users values ($1, $2);`,
    //     [user.username, user.password],
    // );

    if (typeof result == 'boolean') {
        return result;
    }
    return false;
}
