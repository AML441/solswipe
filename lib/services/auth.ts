import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "../firebase"; 
import { doc, setDoc } from "firebase/firestore";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
      }, { merge: true });
    }
    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};
export const logoutUser = async () => {
  return await signOut(auth);
};

