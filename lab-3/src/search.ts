export interface Executable {
    exec(command: string): Promise<string>;
}

export async function searchLogs(
    pattern: string,
    logFile: string,
    executor: Executable,
): Promise<string> {
    const result = await executor.exec(
        `grep '${pattern}' ${logFile}`,
    );
    return result;
}
