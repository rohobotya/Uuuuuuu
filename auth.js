import { auth, db, storage } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { ref as sRef, uploadBytes } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

const statusEl = document.getElementById('status');

function fakeCredsFromPhone(phone){
  const sanitized = (phone||'').replace(/\s+/g,'');
  return { email: `${sanitized}@zowi.com`, password: `${sanitized}123` };
}

// ========== REGISTER (Order Submit) ==========
const submitBtn = document.getElementById('submitOrderBtn');
if(submitBtn){
  submitBtn.addEventListener('click', async () => {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const city = document.getElementById("city").value.trim();
    const address = document.getElementById("address").value.trim();
    const paymentChannel = document.getElementById("paymentChannel").value;
    const paymentFile = document.getElementById("paymentProof").files[0];

    if (!name || !phone || !city || !address || !paymentChannel || !paymentFile) {
        statusEl.textContent = "⚠ Please fill all fields and upload payment proof.";
        statusEl.style.color = "red";
        return;
    }

    try {
        const {email, password} = fakeCredsFromPhone(phone);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        const storageRef = sRef(storage, `paymentProofs/${uid}_${paymentFile.name}`);
        await uploadBytes(storageRef, paymentFile);

        await set(ref(db, 'users/' + uid), {
            name, phone, city, address, paymentChannel,
            paymentFileName: paymentFile.name,
            approved: false,
            prepayment_status: "pending",
            createdAt: Date.now()
        });

        statusEl.textContent = "✅ Registration successful! Waiting for admin approval.";
        statusEl.style.color = "green";
    } catch (error) {
        statusEl.textContent = "❌ Registration error: " + error.message;
        statusEl.style.color = "red";
    }
  });
}

// ========== LOGIN ==========
const loginBtn = document.getElementById('loginBtn');
if(loginBtn){
  loginBtn.addEventListener('click', async () => {
    const phone = document.getElementById('phone').value.trim();

    if (!phone) {
        statusEl.textContent = "⚠ Please enter your phone number to login.";
        statusEl.style.color = "red";
        return;
    }

    const {email, password} = fakeCredsFromPhone(phone);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        const snapshot = await get(child(ref(db), 'users/' + uid));
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.approved && userData.prepayment_status === "approved") {
                window.location.href = "https://rohobotya.github.io/www.zowipromotion.com/";
            } else {
                statusEl.textContent = "⛔ Account not approved or payment pending.";
                statusEl.style.color = "red";
            }
        } else {
            statusEl.textContent = "❌ No user data found.";
            statusEl.style.color = "red";
        }
    } catch (error) {
        statusEl.textContent = "❌ Login error: " + error.message;
        statusEl.style.color = "red";
    }
  });
}
