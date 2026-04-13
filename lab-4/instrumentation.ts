export async function register() {
    console.log('Next.js server is starting up! Running initial code...');

    // You can differentiate between runtimes (Node.js vs Edge) if needed
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Code specific to Node.js runtime
        const { getPool } = await import('./app/db');
        await getPool();
        console.log('Running on Node.js runtime');
    }
}
