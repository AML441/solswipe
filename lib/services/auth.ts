import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const signInWithGoogle = async () => {
    console.log("x");
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log("y");
    const user = result.user;

    return {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        token: await user.getIdToken(), // send this to backend
    };
};

export const signOutUser = async () => {
    await auth.signOut();
};