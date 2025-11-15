"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { SigninMessage } from "@/lib/SigninMessage";
import { SparklesCore } from "@/components/sparkles";

export default function HomePage() {
  const { publicKey, signMessage, connected, wallet } = useWallet();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  // Load Firebase UID from localStorage
  useEffect(() => {
    const storedUid = localStorage.getItem("firebaseUid");
    if (storedUid) setUid(storedUid);
  }, []);

  // Check if wallet is ready
  useEffect(() => {
    if (wallet && !wallet.readyState) {
      console.log("Wallet not ready:", wallet.readyState);
    }
  }, [wallet]);

  const handleSignInWithWallet = async () => {
    if (!publicKey || !signMessage) {
      alert("Connect your wallet first!");
      return;
    }

    if (!uid) {
      alert("User not logged in! Sign in with Firebase first.");
      return;
    }

    try {
      setIsSigningIn(true);
      const walletAddress = publicKey.toBase58();

      // Prepare message to sign
      const csrf = crypto.randomUUID(); // simple nonce if you don't have CSRF token
      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: walletAddress,
        statement: "Sign in with your Solana wallet",
        nonce: csrf,
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await signMessage(data);
      const signatureBase58 = bs58.encode(signature);

      // Optional: send signature to backend if you want
      // await fetch("/api/verify-wallet-signature", { ... })

      // Save wallet to Firestore under existing user document
      const res = await fetch("/api/wallet/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, walletAddress }),
      });

      const json = await res.json();
      if (!json.success) {
        alert("Failed to save wallet: " + json.error);
        return;
      }

      alert("✅ Wallet added to your account: " + walletAddress);
    } catch (err) {
      console.error(err);
      alert("Failed to sign in with wallet.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-linear-to-b from-indigo-900 to-slate-900">
     <h1 className="text-2xl text-white font-bold">Connect Your Wallet</h1>

      {/* Wallet installation prompt */}
      {!window.solana && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
         <p className="text-yellow-800">
            ⚠️ Phantom wallet not detected. Install from{" "}
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              phantom.app
            </a>
          </p>
        </div>
      )}

      <WalletMultiButton />

      {connected && publicKey && (
        <div className="flex flex-col items-center gap-4">
         <div className="p-4 bg-blue-50 border border-blue-200 rounded">
           <p className="text-sm font-mono text-blue-800">
              Connected: {publicKey.toBase58()}
            </p>
          </div>

          <button
            onClick={handleSignInWithWallet}
            disabled={isSigningIn}
            className="px-6 py-3 cyan-200 text-slate-900 rounded hover:bg-teal-600 disabled:bg-gray-400 font-semibold"
          >
            {isSigningIn ? "Signing In..." : "Sign In with This Wallet"}
          </button>
        </div>
      )}
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
    </div>
  );
}
