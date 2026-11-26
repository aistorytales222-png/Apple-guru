/* Reviews with Google sign-in (Firebase): one review per Google account,
   replies under each review, and delete by the person who wrote it. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, deleteDoc, getDocs, query, orderBy, limit, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ====== PASTE YOUR FIREBASE CONFIG HERE (Firebase console > Project settings > Your apps) ====== */
const firebaseConfig = {
  apiKey: "AIzaSyDe36ZvyUvhOzDl5E8xZchCbbbDoQvqfNQ",
  authDomain: "apple-guru.firebaseapp.com",
  projectId: "apple-guru",
  storageBucket: "apple-guru.firebasestorage.app",
  messagingSenderId: "636176448561",
  appId: "1:636176448561:web:950b09012845fb1a6fa910"
};
/* Shop owner's Gmail: this account can delete any review or reply (must match the email in the Firestore rules). */
const OWNER_EMAIL = '';
/* ================================================================================================ */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
window.__reviewsReady = true;

const $ = id => document.getElementById(id);
const list = $('reviewList'), summary = $('revSummary'), starBox = $('starPick'), starErr = $('starErr');
const authBox = $('authBox'), fields = $('formFields'), form = $('reviewForm');
const starBtns = [...starBox.querySelectorAll('button')];
let rating = 0, user = null;

/* ---------- stars in the form ---------- */
const paintStars = n => starBtns.forEach(b => b.classList.toggle('on', +b.dataset.v <= n));
function setRating(n) {
  rating = n; paintStars(n); starErr.hidden = true;
  starBtns.forEach(b => b.setAttribute('aria-checked', String(+b.dataset.v === n)));
}
starBtns.forEach(b => {
  b.addEventListener('click', () => setRating(+b.dataset.v));
  b.addEventListener('mouseenter', () => paintStars(+b.dataset.v));
  b.addEventListener('focus', () => paintStars(+b.dataset.v));
});
starBox.addEventListener('mouseleave', () => paintStars(rating));
starBox.addEventListener('focusout', () => paintStars(rating));

/* ---------- data (live: everyone sees the same reviews and replies) ---------- */
let reviewsData = [];
const repliesData = {};   // reviewId -> [reply, ...]
const replyUnsubs = {};   // reviewId -> unsubscribe function
const openReplies = new Set();
const drafts = {};

const isOwner = () => !!(user && OWNER_EMAIL && user.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
/* shows the customer's full Google name */
const shortName = n => String(n || 'Customer').trim();
const mk = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

onSnapshot(
  query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50)),
  snap => {
    reviewsData = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.stars >= 1 && r.stars <= 5);
    const ids = new Set(reviewsData.map(r => r.id));
    Object.keys(replyUnsubs).forEach(id => {            // stop listening to deleted reviews
      if (!ids.has(id)) { replyUnsubs[id](); delete replyUnsubs[id]; delete repliesData[id]; }
    });
    reviewsData.forEach(r => {                           // listen to replies of each review
      if (replyUnsubs[r.id]) return;
      replyUnsubs[r.id] = onSnapshot(
        query(collection(db, 'reviews', r.id, 'replies'), orderBy('createdAt', 'asc'), limit(50)),
        s => { repliesData[r.id] = s.docs.map(d => ({ id: d.id, ...d.data() })); renderAll(); },
        err => console.error('Could not load replies', err)
      );
    });
    renderAll();
  },
  err => console.error('Could not load reviews', err)
);

/* ---------- draw reviews + replies ---------- */
function renderAll() {
  const reviews = reviewsData;
  if (reviews.length) {
    const avg = reviews.reduce((a, r) => a + r.stars, 0) / reviews.length;
    const full = Math.round(avg);
    summary.hidden = false; summary.innerHTML = '';
    summary.append(
      mk('span', 'big', avg.toFixed(1)),
      mk('span', 'st', '★'.repeat(full) + '☆'.repeat(5 - full)),
      mk('span', '', reviews.length + ' review' + (reviews.length > 1 ? 's' : ''))
    );
  } else summary.hidden = true;

  list.innerHTML = '';
  reviews.forEach(r => {
    const card = mk('div', 'rev');
    const head = mk('div', 'rev-head');
    head.append(mk('span', 'st', '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars)), mk('b', '', shortName(r.name)));
    if (user && (user.uid === r.id || isOwner())) {
      const del = mk('button', 'mini-btn del', 'Delete');
      del.type = 'button';
      del.addEventListener('click', () => deleteReview(r.id));
      head.appendChild(del);
    }
    card.append(head, mk('p', '', r.text));

    const reps = repliesData[r.id] || [];
    if (reps.length) {
      const box = mk('div', 'replies');
      reps.forEach(p => {
        const row = mk('div', 'reply');
        const top = mk('div', 'rev-head');
        top.appendChild(mk('b', '', shortName(p.name)));
        if (user && (user.uid === p.uid || user.uid === r.id || isOwner())) {
          const d = mk('button', 'mini-btn del', 'Delete');
          d.type = 'button';
          d.addEventListener('click', () => deleteReply(r.id, p.id));
          top.appendChild(d);
        }
        row.append(top, mk('p', '', p.text));
        box.appendChild(row);
      });
      card.appendChild(box);
    }

    if (openReplies.has(r.id)) {
      const f = mk('div', 'reply-form');
      const ta = document.createElement('textarea');
      ta.rows = 2; ta.maxLength = 300; ta.placeholder = 'Write a reply…'; ta.value = drafts[r.id] || '';
      ta.addEventListener('input', () => { drafts[r.id] = ta.value; });
      const row = mk('div', 'row');
      const send = mk('button', 'btn gold', 'Reply'); send.type = 'button';
      send.addEventListener('click', () => sendReply(r.id, ta, send));
      const cancel = mk('button', 'btn line', 'Cancel'); cancel.type = 'button';
      cancel.addEventListener('click', () => { openReplies.delete(r.id); renderAll(); });
      row.append(send, cancel);
      f.append(ta, row);
      card.appendChild(f);
    } else {
      const rb = mk('button', 'mini-btn', 'Reply'); rb.type = 'button';
      rb.addEventListener('click', async () => {
        if (!user) await signIn();
        if (!user) return;
        openReplies.add(r.id); renderAll();
        const t = list.querySelector('.reply-form textarea'); if (t) t.focus();
      });
      card.appendChild(rb);
    }
    list.appendChild(card);
  });
}

/* ---------- reply / delete actions ---------- */
async function sendReply(reviewId, ta, btn) {
  if (!user) return;
  const text = ta.value.trim();
  if (!text) return;
  btn.disabled = true;
  try {
    await addDoc(collection(db, 'reviews', reviewId, 'replies'), {
      uid: user.uid,
      name: user.displayName || 'Customer',
      text,
      createdAt: serverTimestamp()
    });
    drafts[reviewId] = ''; openReplies.delete(reviewId); renderAll();
  } catch (e) {
    console.error(e); alert('Could not post your reply. Please try again.'); btn.disabled = false;
  }
}
async function deleteReply(reviewId, replyId) {
  if (!confirm('Delete this reply?')) return;
  try { await deleteDoc(doc(db, 'reviews', reviewId, 'replies', replyId)); }
  catch (e) { console.error(e); alert('Could not delete the reply.'); }
}
async function deleteReview(reviewId) {
  if (!confirm('Delete this review and its replies?')) return;
  try {
    const reps = await getDocs(collection(db, 'reviews', reviewId, 'replies'));
    await Promise.all(reps.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (e) { console.error(e); alert('Could not delete the review.'); }
}

/* ---------- sign in / out ---------- */
async function signIn() {
  const provider = new GoogleAuthProvider();
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      signInWithRedirect(auth, provider);
    } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      console.error('Sign-in error', e);
      alert('Sign-in failed (' + (e.code || e.message) + '). Please try again.');
    }
  }
}
function drawAuth() {
  authBox.innerHTML = '';
  if (!user) {
    fields.hidden = true;
    const p = mk('p', 'auth-note', 'Sign in to write a review or reply.');
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn g-btn';
    btn.innerHTML = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg><span>Sign in with Google</span>';
    btn.addEventListener('click', signIn);
    authBox.append(p, btn);
  } else {
    fields.hidden = false;
    const p = mk('p', 'auth-note');
    p.append('Signed in as ');
    p.appendChild(mk('b', '', user.displayName || user.email));
    p.append(' · ');
    const out = mk('button', 'link-btn', 'Sign out'); out.type = 'button';
    out.addEventListener('click', () => signOut(auth));
    p.appendChild(out);
    authBox.append(p, mk('p', 'auth-note small', 'One review per Google account. Posting again updates your earlier review.'));
  }
}
onAuthStateChanged(auth, u => { user = u; drawAuth(); renderAll(); });

/* ---------- post review ---------- */
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!user) return;
  const text = $('rText').value.trim();
  if (!text) return;
  if (!rating) { starErr.hidden = false; starBtns[0].focus(); return; }
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; const old = btn.textContent; btn.textContent = 'Posting…';
  try {
    await setDoc(doc(db, 'reviews', user.uid), {
      name: user.displayName || 'Customer',
      stars: rating,
      text,
      createdAt: serverTimestamp()
    });
    form.reset(); setRating(0);
    btn.textContent = 'Thank you!';
  } catch (err) {
    console.error(err);
    alert('Could not post your review. Please try again.');
    btn.textContent = old;
  }
  setTimeout(() => { btn.disabled = false; btn.textContent = old; }, 1800);
});