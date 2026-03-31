// db.test.ts
import { test, expect } from '@jest/globals';
import pkg from 'node-sql-parser';
import fc from 'fast-check';
import { registerUser } from './db.js';
import type { Queryable } from './db.js';

const { Parser } = pkg;

export interface MockQueryable extends Queryable {
    queryHistory: Array<string>;
    parseResults: Array<boolean>;
}

function createMockQueryable(): Queryable {
    const sqlParser = new Parser();
    const mock = {
        queryHistory: [],
        parseResults: [],
        query: (query: string, params?: any[]): Promise<any> => {
            mock.queryHistory.push(query);
            try {
                sqlParser.astify(query);
                mock.parseResults.push(true);
                return new Promise(resolve => resolve(true));
            } catch (err) {
                mock.parseResults.push(false);
                return new Promise(resolve => resolve(false));
            }
        },
    } as MockQueryable;
    return mock;
}

test('registerUser always produces valid SQL', async () => {
    await fc.assert(
        fc.asyncProperty(
            fc.string(),
            fc.string(),
            async (username, password) => {
                const mock = createMockQueryable() as MockQueryable;
                await registerUser(
                    { username, password: password as any },
                    mock,
                );
                expect(mock.parseResults.length).toBe(1);
                expect(mock.parseResults[0]).toBe(true);
            }
        )
    );
});
