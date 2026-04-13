import argon2 from 'argon2';
import { Pool } from 'pg';

export type UserRole = | 'patient' | 'doctor';

export interface Doctor {
    doctorId: string;
    time: Date;
    firstName: string;
    middleName: string;
    lastName: string;
}

export interface Patient {
    patientId: string;
    time: Date;
    firstName: string;
    middleName: string;
    lastName: string;
}

export interface Prescription {
    prescriptionId: string;
    patientId: string;
    time: Date;
    medication: string;
    active: boolean;
}

export interface UserMetaData {
    uid: string;
    email: string;
    password: string;
    role: UserRole;
    userData: Doctor | Patient;
}

export interface Credentials {
    email: string;
    password: string;
}

export type SessionToken = string;

type Migration = string | (() => Promise<void>);

/*
 * Statements to execute to initialize the database.
 * They are executed in order.
 */
const migrations: Array<Migration> = [
    `CREATE TABLE IF NOT EXISTS Patients (patientId UUID PRIMARY KEY, time TIMESTAMP WITH TIME ZONE, firstName TEXT, middleName TEXT, lastName TEXT)`,
    `CREATE TABLE IF NOT EXISTS Doctors (doctorId UUID PRIMARY KEY, time TIMESTAMP WITH TIME ZONE, firstName TEXT, middleName TEXT, lastName TEXT)`,
    `CREATE TABLE IF NOT EXISTS Users (uid UUID PRIMARY KEY, email TEXT UNIQUE, passwordHash TEXT, role TEXT CHECK (role IN ('patient', 'doctor')), userDataReference UUID)`,
    `CREATE TABLE IF NOT EXISTS PatientMedicalHistory (historyId UUID PRIMARY KEY, time TIMESTAMP WITH TIME ZONE, patientId UUID REFERENCES Patients (patientId), description TEXT)`,
    `CREATE TABLE IF NOT EXISTS Prescriptions (prescriptionId UUID PRIMARY KEY, patientId UUID REFERENCES Patients(patientId), time TIMESTAMP WITH TIME ZONE, medication TEXT)`,
    `CREATE TABLE IF NOT EXISTS PrescriptionHistory (historyId UUID PRIMARY KEY, prescriptionId UUID REFERENCES Prescriptions(prescriptionId), event TEXT CHECK (event IN ('prescribed', 'canceled')), doctorId UUID REFERENCES Doctors(doctorId))`,
    `CREATE TABLE IF NOT EXISTS Sessions (sessionId VARCHAR(256) PRIMARY KEY, uid UUID REFERENCES Users(uid), createdTime TIMESTAMP WITH TIME ZONE)`,
    `ALTER TABLE PrescriptionHistory ADD COLUMN IF NOT EXISTS time TIMESTAMP WITH TIME ZONE`,

    async () => {
        const empty = await isTableEmpty('Doctors');
        if (empty)
            await createUser({
                uid: crypto.randomUUID(),
                email: 'foo@bar.com',
                password: 'my-password-is-long',
                role: 'doctor',
                userData: {
                    doctorId: crypto.randomUUID(),
                    time: new Date(),
                    firstName: 'Hannibal',
                    middleName: '',
                    lastName: 'Lecter',
                },
            });
    },

    async () => {
        const empty = await isTableEmpty('Patients');
        if (empty)
            await createUser({
                uid: crypto.randomUUID(),
                email: 'bobsmith@example.com',
                password: 'my-password-is-long',
                role: 'patient',
                userData: {
                    patientId: crypto.randomUUID(),
                    time: new Date(),
                    firstName: 'Bob',
                    middleName: 'Gerald',
                    lastName: 'Smith',
                },
            });
    },

    async () => {
        const empty = await isTableEmpty('Prescriptions');
        if (empty) {
            const prescriptionId = crypto.randomUUID();
            const doctorId = await lookupIdByRole('Hannibal', 'Lecter', 'doctor');
            await createPrescription(
                {
                    prescriptionId: prescriptionId,
                    patientId: (await lookupIdByRole('Bob', 'Smith', 'patient'))!,
                    time: new Date(),
                    medication: 'Ibuprofen',
                    active: true,
                },
                doctorId!,
            );
            await cancelPrescription(prescriptionId, doctorId!);
        }
    }
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
    for (const migration of migrations) {
        if (typeof migration === 'string') {
            await client.query(migration);
        } else {
            console.log('Running migration function!');
            await migration();
        }
    }
    client.release();
}

// Returns the connection pool for the database, initializing the pool if necessary.
export async function getPool(): Promise<Pool> {
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

async function isTableEmpty(tableName: string): Promise<boolean> {
    const pool = await getPool();
    const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0].count) === 0;
}

export async function createDoctorData(doctor: Doctor): Promise<boolean> {
    const pool = await getPool();
    try {
        await pool.query(
            `INSERT INTO Doctors (doctorId, time, firstName, middleName, lastName) VALUES ($1, $2, $3, $4, $5)`,
            [doctor.doctorId, doctor.time, doctor.firstName, doctor.middleName, doctor.lastName],
        );
        return true;
    } catch (_) {
        return false;
    }
}

export async function createPatientData(patient: Patient): Promise<boolean> {
    const pool = await getPool();
    try {
        await pool.query(
            `INSERT INTO Patients (patientId, time, firstName, middleName, lastName) VALUES ($1, $2, $3, $4, $5)`,
            [patient.patientId, patient.time, patient.firstName, patient.middleName, patient.lastName],
        );
        return true;
    } catch (_) {
        return false;
    }
}

export async function createUser(user: UserMetaData): Promise<boolean> {
    let userDataReference: string;
    if (user.role === 'doctor') {
        userDataReference = (user.userData as Doctor).doctorId;
        let result = await createDoctorData(user.userData as Doctor);
        if (!result) {
            return false;
        }
    } else if (user.role === 'patient') {
        console.log('creating a patient.');
        userDataReference = (user.userData as Patient).patientId;
        let result = await createPatientData(user.userData as Patient);
        if (!result) {
            return false;
        }        
    } else {
        return false;
    }

    const pool = await getPool();
    try {
        const passwordHash = await argon2.hash(user.password);
        await pool.query(
            `INSERT INTO Users (uid, email, passwordHash, role, userDataReference) VALUES ($1, $2, $3, $4, $5)`,
            [user.uid, user.email, passwordHash, user.role, userDataReference],
        )
    } catch (_) {
        return false;
    }
    
    return true;
}

export function createSessionToken(): SessionToken {
    return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
}

export async function authenticateCredentials(credentials: Credentials): Promise<SessionToken | undefined> {
    // Get the user credentials.
    const pool = await getPool();
    try {
        const result = await pool.query(`SELECT uid, passwordHash FROM users WHERE email = $1`, [credentials.email]);
        if (result.rowCount !== 1) {
            return;
        }

        if (await argon2.verify(result.rows[0].passwordhash, credentials.password)) {
            const sessionToken = createSessionToken();
            await pool.query(`INSERT INTO Sessions VALUES ($1, $2, $3)`, [sessionToken, result.rows[0].uid, new Date()]);
            return sessionToken;
        }
    } catch (_) {
        return;
    }
}

export async function getUidFromSessionToken(tok: SessionToken): Promise<string | undefined> {
    const pool = await getPool();
    try {
        const result = await pool.query(`SELECT uid FROM Sessions WHERE sessionId = $1`, [tok]);
        if (result.rowCount !== 1) {
            return;
        }

        return result.rows[0].uid;
    } catch (_) {
        return;
    }
}

export async function destroySession(tok: SessionToken): Promise<void> {
    const pool = await getPool();
    try {
        await pool.query(`DELETE FROM Sessions WHERE sessionId = $1`, [tok]);
    } catch (_) {
        return;
    }
}

export async function lookupIdByRole(firstName: string, lastName: string, role: UserRole): Promise<string | undefined> {
    const pool = await getPool();
    try {
        const column = role === 'patient' ? 'patientid' : 'doctorid';
        const table = role === 'patient' ? 'Patients' : 'Doctors';
        const results = await pool.query(
            `SELECT ${column} from ${table} WHERE firstName = $1 AND lastName = $2`,
            [firstName, lastName],
        );
        if (results.rows.length < 1) {
            return;
        }
        return results.rows[0][column];
    } catch (_) {
        return;
    }
}

export async function createPrescription(prescription: Prescription, doctorId: string): Promise<boolean> {
    const pool = await (await getPool()).connect();
    try {
        await pool.query('BEGIN');
        await pool.query(
            `INSERT INTO Prescriptions (prescriptionId, patientId, time, medication) VALUES ($1, $2, $3, $4)`,
            [prescription.prescriptionId, prescription.patientId, prescription.time, prescription.medication]
        );
        await pool.query(
            `INSERT INTO PrescriptionHistory (historyId, prescriptionId, event, doctorId, time) VALUES ($1, $2, $3, $4, $5)`,
            [crypto.randomUUID(), prescription.prescriptionId, 'prescribed', doctorId, prescription.time],
        );
        await pool.query('COMMIT');
        return true;
    } catch (_) {
        await pool.query('ROLLBACK');
        return false;
    }
}

export async function cancelPrescription(prescriptionId: string, doctorId: string): Promise<boolean> {
    const pool = await getPool();
    try {
        await pool.query(
            `INSERT INTO PrescriptionHistory (historyId, prescriptionId, event, doctorId, time) VALUES ($1, $2, $3, $4, $5)`,
            [crypto.randomUUID(), prescriptionId, 'canceled', doctorId, new Date()],
        );
        return true;
    } catch (_) {
        return false;
    }
}

export async function getAllPatients(): Promise<Patient[]> {
    const pool = await getPool();
    try {
        const result = await pool.query(`SELECT patientId, time, firstName, middleName, lastName FROM Patients ORDER BY lastName, firstName`);
        return result.rows.map(row => ({
            patientId: row.patientid,
            time: row.time,
            firstName: row.firstname,
            middleName: row.middlename,
            lastName: row.lastname,
        }));
    } catch (_) {
        return [];
    }
}

export async function reactivatePrescription(prescriptionId: string, doctorId: string): Promise<boolean> {
    const pool = await getPool();
    try {
        await pool.query(
            `INSERT INTO PrescriptionHistory (historyId, prescriptionId, event, doctorId, time) VALUES ($1, $2, $3, $4, $5)`,
            [crypto.randomUUID(), prescriptionId, 'prescribed', doctorId, new Date()],
        );
        return true;
    } catch (_) {
        return false;
    }
}

export async function getUserByUid(uid: string): Promise<{ role: UserRole; userDataReference: string } | undefined> {
    const pool = await getPool();
    try {
        const result = await pool.query(`SELECT role, userDataReference FROM Users WHERE uid = $1`, [uid]);
        if (result.rowCount !== 1) {
            return;
        }
        return { role: result.rows[0].role, userDataReference: result.rows[0].userdatareference };
    } catch (_) {
        return;
    }
}

export async function getPrescriptions(patientId: string): Promise<Array<Prescription> | undefined> {
    const pool = await getPool();
    try {
        return (await pool.query(
                `SELECT DISTINCT ON (Prescriptions.prescriptionId) * FROM Prescriptions JOIN PrescriptionHistory ON PrescriptionHistory.prescriptionId = Prescriptions.prescriptionId WHERE patientId = $1 ORDER BY Prescriptions.prescriptionId, PrescriptionHistory.time DESC`,
                [patientId],
        )).rows.map(
            row => ({
                prescriptionId: row.prescriptionid,
                patientId: row.patientid,
                time: row.time,
                medication: row.medication,
                active: row.event !== 'canceled',
            })
        );
    } catch (_) {
        return;
    }
}
