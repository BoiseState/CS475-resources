export async function register() {
    console.log('Next.js server is starting up! Running initial code...');

    // You can differentiate between runtimes (Node.js vs Edge) if needed
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Code specific to Node.js runtime
        const { getLikes } = await import('./app/db');
        console.log('Running on Node.js runtime');
        console.log(`There are ${await getLikes()} likes!`)
    }
}
