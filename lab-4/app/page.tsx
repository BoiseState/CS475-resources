import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
    getUidFromSessionToken,
    getUserByUid,
    getPrescriptions,
    getAllPatients,
    cancelPrescription,
    reactivatePrescription,
    Prescription,
    Patient,
} from "./db";

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ patient?: string }>;
}) {
    const { patient: selectedPatientId } = await searchParams;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('sessionToken')?.value;
    let uid: string | undefined;
    if (sessionToken) {
        uid = await getUidFromSessionToken(sessionToken);
    }

    if (!uid) {
        return (
            <div className="card hero-card">
                <div className="hero-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <h1>Medical Portal</h1>
                <p>Securely access your medical records, appointments, and prescriptions. Log in to get started.</p>
                <Link href="/login" className="btn btn-primary">
                    Log In
                </Link>
            </div>
        );
    }

    const user = await getUserByUid(uid);

    // ── Patient view ──
    if (user?.role === 'patient') {
        const prescriptions = await getPrescriptions(user.userDataReference);

        return (
            <div>
                <div className="card hero-card">
                    <div className="hero-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <h1>Welcome Back</h1>
                    <p>You are logged in to the Medical Portal.</p>
                </div>

                <div className="card prescriptions-section">
                    <div className="section-header">
                        <h2>Your Prescriptions</h2>
                    </div>
                    {prescriptions && prescriptions.length > 0 ? (
                        <PrescriptionsTable prescriptions={prescriptions} />
                    ) : (
                        <div className="empty-state">
                            <p>No prescriptions found.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Doctor view ──
    if (user?.role === 'doctor') {
        const patients = await getAllPatients();
        const selectedPatient = selectedPatientId
            ? patients.find(p => p.patientId === selectedPatientId)
            : undefined;
        const prescriptions = selectedPatient
            ? await getPrescriptions(selectedPatient.patientId)
            : undefined;

        const doctorId = user.userDataReference;

        const togglePrescription = async (formData: FormData) => {
            'use server';
            const prescriptionId = formData.get('prescriptionId') as string;
            const action = formData.get('action') as string;
            const patientId = formData.get('patientId') as string;

            if (action === 'cancel') {
                await cancelPrescription(prescriptionId, doctorId);
            } else {
                await reactivatePrescription(prescriptionId, doctorId);
            }

            redirect(`/?patient=${patientId}`);
        };

        return (
            <div>
                <div className="card hero-card">
                    <div className="hero-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <h1>Doctor Dashboard</h1>
                    <p>Select a patient to view and manage their prescriptions.</p>
                </div>

                <div className="card prescriptions-section">
                    <div className="section-header">
                        <h2>Patients</h2>
                    </div>
                    {patients.length > 0 ? (
                        <div className="patient-list">
                            {patients.map((p) => (
                                <a
                                    key={p.patientId}
                                    href={`/?patient=${p.patientId}`}
                                    className={`patient-item ${selectedPatientId === p.patientId ? 'patient-item-active' : ''}`}
                                >
                                    <div className="patient-avatar">
                                        {p.firstName[0]}{p.lastName[0]}
                                    </div>
                                    <div>
                                        <div className="patient-name">{p.firstName} {p.middleName ? `${p.middleName} ` : ''}{p.lastName}</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No patients found.</p>
                        </div>
                    )}
                </div>

                {selectedPatient && (
                    <div className="card prescriptions-section">
                        <div className="section-header">
                            <h2>Prescriptions for {selectedPatient.firstName} {selectedPatient.lastName}</h2>
                        </div>
                        {prescriptions && prescriptions.length > 0 ? (
                            <table className="prescriptions-table">
                                <thead>
                                    <tr>
                                        <th>Prescription ID</th>
                                        <th>Medication</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescriptions.map((rx) => (
                                        <tr key={rx.prescriptionId}>
                                            <td className="rx-id">{rx.prescriptionId}</td>
                                            <td className="rx-medication">{rx.medication}</td>
                                            <td className="rx-date">{new Date(rx.time).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${rx.active ? 'status-active' : 'status-inactive'}`}>
                                                    {rx.active ? 'Active' : 'Canceled'}
                                                </span>
                                            </td>
                                            <td>
                                                <form action={togglePrescription}>
                                                    <input type="hidden" name="prescriptionId" value={rx.prescriptionId} />
                                                    <input type="hidden" name="patientId" value={selectedPatient.patientId} />
                                                    <input type="hidden" name="action" value={rx.active ? 'cancel' : 'reactivate'} />
                                                    <button type="submit" className={`btn btn-sm ${rx.active ? 'btn-danger-outline' : 'btn-outline'}`}>
                                                        {rx.active ? 'Cancel' : 'Reactivate'}
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <p>No prescriptions for this patient.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Fallback
    return (
        <div className="card hero-card">
            <h1>Welcome Back</h1>
            <p>You are logged in to the Medical Portal.</p>
        </div>
    );
}

function PrescriptionsTable({ prescriptions }: { prescriptions: Prescription[] }) {
    return (
        <table className="prescriptions-table">
            <thead>
                <tr>
                    <th>Medication</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {prescriptions.map((rx) => (
                    <tr key={rx.prescriptionId}>
                        <td className="rx-medication">{rx.medication}</td>
                        <td className="rx-date">{new Date(rx.time).toLocaleDateString()}</td>
                        <td>
                            <span className={`status-badge ${rx.active ? 'status-active' : 'status-inactive'}`}>
                                {rx.active ? 'Active' : 'Canceled'}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
