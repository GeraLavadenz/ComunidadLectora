// src/services/auth.ts
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export type NewUserInput = {
  name: string;
  email: string;
  password: string;
  role?: "reader" | "author" | "moderator" | "admin";
};

export async function registerUser(input: NewUserInput): Promise<User> {
  const { name, email, password, role = "reader" } = input;

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });

  await setDoc(
    doc(db, "users", cred.user.uid),
    {
      uid: cred.user.uid,
      displayName: name,
      email,
      role,
      photoURL: cred.user.photoURL ?? null,
      createdAt: serverTimestamp(),
      status: "active",
    },
    { merge: true }
  );

  return cred.user;
}

/** Sign-in/up con Google: crea/actualiza perfil en Firestore. */
export async function signInWithGoogle(defaultRole: NewUserInput["role"] = "reader") {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const cred = await signInWithPopup(auth, provider);
    const u = cred.user;

    // Crea/actualiza perfil (merge para no pisar campos existentes)
    await setDoc(
      doc(db, "users", u.uid),
      {
        uid: u.uid,
        displayName: u.displayName ?? "",
        email: u.email ?? "",
        role: defaultRole,
        photoURL: u.photoURL ?? null,
        createdAt: serverTimestamp(),
        status: "active",
        provider: "google",
      },
      { merge: true }
    );
    return u;
    } catch (err: unknown) {
      const error = err as { code?: string; customData?: { email?: string } };
      // Caso común: cuenta existe con otro proveedor
      if (error?.code === "auth/account-exists-with-different-credential" && error?.customData?.email) {
        const email: string = error.customData.email;
        const methods = await fetchSignInMethodsForEmail(auth, email);
        // Sugerencia mínima: mostrar mensaje claro
        throw new Error(
          methods.includes("password")
            ? "Ese correo ya existe con contraseña. Inicia sesión con email/contraseña y luego vincula Google en tu perfil."
            : "Ese correo ya existe con otro proveedor. Inicia con el proveedor original."
        );
        // (Opcional avanzado) Podrías implementar linking con credencial pendiente:
        // const pendingCred = GoogleAuthProvider.credentialFromError(err);
        // const user = await signInWith<otro proveedor>...
        // await linkWithCredential(user, pendingCred!)
      }
      throw err;
    }
}
