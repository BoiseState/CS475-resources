import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUidFromSessionToken, getUserByUid, getPrescriptions, cancelPrescription, reactivatePrescription } from '@/app/db';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ patientId: string }> },
) {
    const { patientId } = await params;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('sessionToken')?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const uid = await getUidFromSessionToken(sessionToken);
    if (!uid) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await getUserByUid(uid);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Doctors can access any patient's prescriptions.
    // Patients can only access their own.
    if (user.role === 'patient' && user.userDataReference !== patientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prescriptions = await getPrescriptions(patientId);
    if (!prescriptions) {
        return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
    }

    return NextResponse.json(prescriptions);
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ patientId: string }> },
) {
    const { patientId } = await params;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('sessionToken')?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const uid = await getUidFromSessionToken(sessionToken);
    if (!uid) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await getUserByUid(uid);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Only doctors can modify prescriptions.
    if (user.role !== 'doctor') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { prescriptionId, action } = body;

    if (!prescriptionId || !action) {
        return NextResponse.json({ error: 'Missing prescriptionId or action' }, { status: 400 });
    }

    const doctorId = user.userDataReference;
    let success: boolean;

    if (action === 'cancel') {
        success = await cancelPrescription(prescriptionId, doctorId);
    } else if (action === 'reactivate') {
        success = await reactivatePrescription(prescriptionId, doctorId);
    } else {
        return NextResponse.json({ error: 'Invalid action. Use "cancel" or "reactivate"' }, { status: 400 });
    }

    if (!success) {
        return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
