import { NextResponse } from "next/server";
import { execFile } from "node:child_process";

interface RunProcessRequest {
    processName: string;
    processArgs: Array<string>;
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const req = await request.json();
        if (typeof req !== 'object' || req.processName === undefined ||
            typeof req.processName !== 'string' ||
            !(req.processArgs instanceof Array)) {
            throw Error('Invalid process request');
        }

        const validatedReq = req as RunProcessRequest;
        console.log(validatedReq);
        const executionResult =
            new Promise((resolve, reject) => execFile(
                validatedReq.processName,
                validatedReq.processArgs,
                (err, stdout, stderr) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve({stdout, stderr});
                }));

        return NextResponse.json(await executionResult);
    } catch (err) {
        return NextResponse.json({error: err});
    }
}
