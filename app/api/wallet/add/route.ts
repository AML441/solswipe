import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { uid, walletAddress } = await req.json();
    console.log("UID", uid);

    if (!uid || !walletAddress) {
      return NextResponse.json(
        { success: false, error: "Missing uid or walletAddress" },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);

    // Add wallet to array (avoid duplicates)
    await userRef.set(
      {
        wallets: admin.firestore.FieldValue.arrayUnion(walletAddress),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}