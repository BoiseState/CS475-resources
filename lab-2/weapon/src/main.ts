import { exit } from 'node:process';
import { parseArgs } from 'node:util';

/*
 * Represents an attack to perform.
 * @property postId - The ID of the post to like.
 * @property numLikes - The number of likes to submit.
 */
interface AttackOptions {
    postId: string;
    numLikes: number;
}


// TODO: Change this URL to the one you identified in your answer to Question 1.
// The URL to target in the attack.
const targetURL: string = '';

/*
 * Processes the command line arguments.
 * Invalid arguments cause an error message to be displayed to stderr,
 * and the process exits with a non-zero error code.
 */
function processCLIArgs(): AttackOptions {
    // TODO
}

/*
 * Performs an attack by submitting multiple like requests in parallel.
 * @param opts - The attack configuration.
 */
async function performAttack(opts: AttackOptions): Promise<void> {
    // TODO
}

function main() {
    const attackOpts = processCLIArgs();
    performAttack(attackOpts);
}

main();
