"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { SigninMessage } from "@/lib/SigninMessage";
import Navbar from "@/components/navbar";

export default function HomePage() {
  const { publicKey, signMessage, connected, wallet, disconnect } = useWallet();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [hasPhantom, setHasPhantom] = useState<boolean | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false); // Track sign-in state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Check for Phantom wallet
  useEffect(() => {
    setHasPhantom(typeof window !== "undefined" && !!window.solana);
  }, []);

  // Load Firebase UID from localStorage
  useEffect(() => {
    const storedUid = localStorage.getItem("firebaseUid");
    if (storedUid) setUid(storedUid);
  }, []);

  // Check for sign-in status from localStorage
  useEffect(() => {
    const storedSignedInStatus = localStorage.getItem("isSignedIn");
    if (storedSignedInStatus === "true") {
      setIsSignedIn(true); // User is signed in
      const storedWalletAddress = localStorage.getItem("walletAddress");
      setWalletAddress(storedWalletAddress); // Retrieve wallet address if signed in
    }
  }, []);

  // Watch for changes in wallet connection status
  useEffect(() => {
    if (!connected) {
      setIsSignedIn(false); // Reset sign-in state
      setWalletAddress(null); // Reset wallet address
      localStorage.removeItem("isSignedIn"); // Clear localStorage
      localStorage.removeItem("walletAddress"); // Clear wallet address in localStorage
    }
  }, [connected]); // This runs whenever `connected` state changes

  // Handle sign-in with wallet
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
      const address = publicKey.toBase58();
      setWalletAddress(address); // Store the wallet address

      // Prepare message to sign
      const csrf = crypto.randomUUID(); // simple nonce if you don't have CSRF token
      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: address,
        statement: "Sign in with your Solana wallet",
        nonce: csrf,
      });

      const data = new TextEncoder().encode(message.prepare());
      const signature = await signMessage(data);
      const signatureBase58 = bs58.encode(signature);

      // Optional: send signature to backend if needed
      // await fetch("/api/verify-wallet-signature", { ... });

      // Save wallet to Firestore under existing user document
      const res = await fetch("/api/wallet/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, walletAddress: address }),
      });

      const json = await res.json();
      if (!json.success) {
        alert("Failed to save wallet: " + json.error);
        return;
      }

      alert("✅ Wallet added to your account: " + address);
      setIsSignedIn(true); // Set the user as signed in

      // Store sign-in state and wallet address in localStorage
      localStorage.setItem("isSignedIn", "true");
      localStorage.setItem("walletAddress", address);

    } catch (err) {
      console.error(err);
      alert("Failed to sign in with wallet.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen items-center justify-center gap-6 bg-linear-to-b from-indigo-900 to-slate-900 flex flex-row">
      <div>
        <Navbar />
      </div>
      <h1 className="text-2xl text-white font-bold">Connect Your Wallet</h1>

      {/* Wallet installation prompt */}
      {hasPhantom === false && (
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

      {/* Wallet multi-button to select a wallet */}
      <WalletMultiButton /> {/* Always show the Solana wallet button */}

      {/* Show Sign In button only if wallet is connected but not signed in */}
      {connected && publicKey && !isSignedIn && (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-mono text-blue-800">
              Connected: {publicKey.toBase58()}
            </p>
          </div>

          <button
            onClick={handleSignInWithWallet}
            disabled={isSigningIn}
            className="px-6 py-3 bg-cyan-200 text-slate-900 rounded hover:bg-teal-600 disabled:bg-gray-400 font-semibold"
          >
            {isSigningIn ? "Signing In..." : "Sign In with This Wallet"}
          </button>
        </div>
      )}

      {/* If connected and wallet is signed in, show the wallet address */}
      {isSignedIn && walletAddress && (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-mono text-green-800">
              Signed in to: {walletAddress}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}