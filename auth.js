import { auth, db, storage } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// Registration function
async function register(phone, password, file) {
  try {
    const email = phone + "@zowi.com";
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // Upload proof of payment
    let fileUrl = "";
    if (file) {
      const storageRef = sRef(storage, `payments/${uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(storageRef);
    }

    // Save user profile to Realtime DB
    await set(ref(db, "users/" + uid), {
      phone: phone,
      approved: false,
      paymentProof: fileUrl,
      registeredAt: Date.now()
    });

    alert("Registration successful! Please wait for admin approval.");
  } catch (err) {
    console.error(err);
    alert("Registration failed: " + err.message);
  }
}

export { register };
