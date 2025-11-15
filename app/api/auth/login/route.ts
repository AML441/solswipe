import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin'; // Firebase Admin SDK

export async function POST(req: NextRequest) {
    try {
        console.log("in POST /api/auth/login");
        const { token } = await req.json();

        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const name = decodedToken.name || decodedToken.email;

        // Reference to Firestore
        const db = admin.firestore();
        const userRef = db.collection('users').doc(uid);

        // Check if user already exists
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            await userRef.set({
                uid,
                email,
                name,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('User created in Firestore:', uid);
        } else {
            console.log('User already exists:', uid);
        }

        return NextResponse.json({ success: true, uid, email, name });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            { success: false, error: err.message || 'Invalid token' },
            { status: 401 }
        );
    }
}
