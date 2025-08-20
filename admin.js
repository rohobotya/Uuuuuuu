import { auth, db, ADMIN_PHONES } from './firebase.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { ref, get, child, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const statusEl = document.getElementById('adminStatus');
const usersCard = document.getElementById('usersCard');
const usersTableContainer = document.getElementById('usersTableContainer');

function fakeCredsFromPhone(phone){
  const sanitized = (phone||'').replace(/\s+/g,'');
  return { email: `${sanitized}@zowi.com`, password: `${sanitized}123` };
}

async function isAdminPhone(phone){
  const normalized = (phone||'').replace(/\s+/g,'');
  return ADMIN_PHONES.includes(normalized);
}

document.getElementById('adminLoginBtn').addEventListener('click', async ()=>{
  const phone = document.getElementById('adminPhone').value.trim();
  if(!phone){
    statusEl.textContent = "Enter admin phone.";
    statusEl.style.color = "red";
    return;
  }
  if(!(await isAdminPhone(phone))){
    statusEl.textContent = "This phone is not allowed for admin access.";
    statusEl.style.color = "red";
    return;
  }
  const {email, password} = fakeCredsFromPhone(phone);
  try{
    await signInWithEmailAndPassword(auth, email, password);
    statusEl.textContent = "✅ Admin logged in.";
    statusEl.style.color = "green";
    usersCard.style.display = "block";
    await loadUsers();
  }catch(err){
    statusEl.textContent = "Login error: " + err.message + " (Tip: if first time, register this phone in the user form once.)";
    statusEl.style.color = "red";
  }
});

document.getElementById('adminLogoutBtn').addEventListener('click', async ()=>{
  await signOut(auth);
  usersCard.style.display = "none";
  statusEl.textContent = "Logged out.";
  statusEl.style.color = "";
});

document.getElementById('refreshBtn').addEventListener('click', loadUsers);

async function loadUsers(){
  usersTableContainer.innerHTML = "Loading users...";
  try{
    const snapshot = await get(child(ref(db), 'users'));
    if(!snapshot.exists()){
      usersTableContainer.innerHTML = "<p>No users found.</p>";
      return;
    }
    const users = snapshot.val();
    const rows = Object.entries(users).map(([uid, u])=>{
      const approved = !!u.approved;
      const pay = u.prepayment_status || "pending";
      return `<tr>
        <td>${u.name||""}</td>
        <td>${u.phone||""}</td>
        <td>${u.city||""}</td>
        <td>${u.paymentChannel||""}</td>
        <td>${pay}</td>
        <td>${approved ? "✅" : "⛔"}</td>
        <td>
          <select class="inline" data-uid="${uid}" data-type="pay">
            <option value="pending" ${pay==="pending"?"selected":""}>pending</option>
            <option value="approved" ${pay==="approved"?"selected":""}>approved</option>
            <option value="rejected" ${pay==="rejected"?"selected":""}>rejected</option>
          </select>
          <select class="inline" data-uid="${uid}" data-type="approved">
            <option value="false" ${!approved?"selected":""}>not approved</option>
            <option value="true" ${approved?"selected":""}>approved</option>
          </select>
          <button class="inline" data-uid="${uid}" data-action="save">Save</button>
        </td>
      </tr>`;
    }).join("");
    usersTableContainer.innerHTML = `<table>
      <thead><tr><th>Name</th><th>Phone</th><th>City</th><th>Channel</th><th>Payment</th><th>Approved</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

    // Attach save handlers
    usersTableContainer.querySelectorAll('button[data-action="save"]').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        const uid = e.target.getAttribute('data-uid');
        const paySel = usersTableContainer.querySelector(`select[data-uid="${uid}"][data-type="pay"]`);
        const apprSel = usersTableContainer.querySelector(`select[data-uid="${uid}"][data-type="approved"]`);
        const updates = {
          prepayment_status: paySel.value,
          approved: apprSel.value === "true"
        };
        try{
          await update(child(ref(db), 'users/' + uid), updates);
          statusEl.textContent = "✅ Saved.";
          statusEl.style.color = "green";
          await loadUsers();
        }catch(err){
          statusEl.textContent = "Save error: " + err.message;
          statusEl.style.color = "red";
        }
      });
    });

  }catch(err){
    usersTableContainer.innerHTML = "<p>Error loading users.</p>";
    statusEl.textContent = "Load error: " + err.message;
    statusEl.style.color = "red";
  }
}
