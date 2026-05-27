import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, setDoc, doc, serverTimestamp, orderBy, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const SUPER_ADMIN = "abdurasul1406z@gmail.com";

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }

  // Foydalanuvchini saqlash
  await setDoc(doc(db, 'users', user.uid), {
    name: user.displayName || '',
    email: user.email,
    photo: user.photoURL || '',
    loginAt: serverTimestamp()
  }, { merge: true });

  const name = user.displayName || user.email.split('@')[0];
  const un = document.getElementById('userName');
  if (un) un.textContent = name;

  // Firestore dan avatar olish
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
    if (!userDoc.empty) {
      const data = userDoc.docs[0].data();
      if (data.photoBase64 && typeof window._setProfileUser === 'function') {
        window._setProfileUser({ ...user, photoURL: data.photoBase64 });
      } else if (typeof window._setProfileUser === 'function') {
        window._setProfileUser(user);
      }
    } else if (typeof window._setProfileUser === 'function') {
      window._setProfileUser(user);
    }
  } catch {
    if (typeof window._setProfileUser === 'function') window._setProfileUser(user);
  }

  // Super admin yoki oddiy admin tekshirish
  let isAdmin = false;
  if (user.email === SUPER_ADMIN) {
    isAdmin = true;
  } else {
    const snap = await getDocs(query(collection(db, 'admins'), where('email', '==', user.email)));
    if (!snap.empty) isAdmin = true;
  }
  if (isAdmin) {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) adminBtn.style.display = 'inline-block';
    const pdAdminBtn = document.getElementById('pdAdminBtn');
    if (pdAdminBtn) pdAdminBtn.style.display = 'flex';
  }

  loadFromFirestore();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

document.getElementById('adminBtn').addEventListener('click', () => {
  window.location.href = 'admin.html';
});

// Bloklardan HTML yasash
function blocksToHtml(blocks) {
  if (!blocks || blocks.length === 0) {
    return '<div class="info-box blue">Ma\'lumot kiritilmagan</div>';
  }
  let stepNum = 1;
  return blocks.map(b => {
    if (b.type === 'step') {
      const html = `
        <div class="step">
          <div class="step-num">${stepNum}</div>
          <div class="step-body">
            <strong>${b.title}</strong>
            ${b.desc ? `<p>${b.desc}</p>` : ''}
          </div>
        </div>`;
      stepNum++;
      return html;
    } else if (b.type === 'drug') {
      return `
        <div class="drug-card">
          <div class="drug-header">
            <div class="drug-name">${b.name}</div>
            <div class="drug-route">${b.route || ''}</div>
          </div>
          ${b.dose ? `<div class="drug-dose">💊 ${b.dose}</div>` : ''}
          ${b.mech ? `<div class="drug-mech">${b.mech}</div>` : ''}
        </div>`;
    } else {
      return `
        <div class="info-box ${b.color || 'blue'}">
          ${b.title ? '<strong>' + b.title + ':</strong> ' : ''}${b.text}
        </div>`;
    }
  }).join('');
}

async function loadFromFirestore() {
  try {
    const dSnap = await getDocs(query(collection(db, 'diseases'), orderBy('createdAt', 'desc')));
    const drugSnap = await getDocs(query(collection(db, 'drugs'), orderBy('createdAt', 'desc')));

    window._firestoreDiseases = [];
    window._firestoreDrugs = [];

    dSnap.forEach(d => window._firestoreDiseases.push({ id: d.id, ...d.data() }));
    drugSnap.forEach(d => window._firestoreDrugs.push({ id: d.id, ...d.data() }));

    addFirestoreDiseasesToGrid();
    addFirestoreDrugsToList();
  } catch (e) {
    console.log('Firestore xatolik:', e);
  }
}

function addFirestoreDiseasesToGrid() {
  const diseases = window._firestoreDiseases || [];
  if (diseases.length === 0) return;
  const grid = document.getElementById('diseaseGrid');
  diseases.forEach(d => {
    if (document.getElementById('card-fs-' + d.id)) return;
    const div = document.createElement('div');
    div.className = 'disease-card';
    div.id = 'card-fs-' + d.id;
    div.onclick = () => {
      if (typeof openFSDisease === 'function') { openFSDisease(d); }
      else { selectFirestoreDisease(d.id); }
    };
    const iconHtml = d.icon && d.icon.startsWith('http')
      ? `<img src="${d.icon}" style="width:28px;height:28px;display:block;margin:0 auto 6px;filter:invert(27%) sepia(89%) saturate(1000%) hue-rotate(330deg) brightness(90%)" alt="icon">`
      : `<span style="font-size:26px;display:block;margin-bottom:6px">${d.icon || '🦠'}</span>`;
    div.innerHTML = `
      ${iconHtml}
      <div class="dc-name">${d.name}</div>
      <div class="dc-tag">${d.category || 'Boshqa'}</div>
    `;
    grid.appendChild(div);
  });
}

window.selectFirestoreDisease = function(id) {
  const d = window._firestoreDiseases.find(x => x.id === id);
  if (!d) return;
  if (typeof openFSDisease === 'function') { openFSDisease(d); return; }
  // fallback
  document.querySelectorAll('.disease-card').forEach(c => c.classList.remove('active'));
  document.getElementById('card-fs-' + id).classList.add('active');
  window._currentFSDisease = d;
  window._currentFSMode = true;
  switchTab(typeof ct !== 'undefined' ? ct : 'info');
};

window.renderFSTab = function(tab) {
  const d = window._currentFSDisease;
  if (!d) return;
  let blocks = [];
  if (tab === 'info') blocks = d.infoBlocks;
  else if (tab === 'symptoms') blocks = d.symptomsBlocks;
  else if (tab === 'aid') blocks = d.aidBlocks;
  else if (tab === 'drugs') blocks = d.drugsBlocks;
  document.getElementById('tabContent').innerHTML = blocksToHtml(blocks);
};

function addFirestoreDrugsToList() {
  const drugs = window._firestoreDrugs || [];
  if (drugs.length === 0) return;
  const grid = document.getElementById('drugListGrid');
  drugs.forEach(d => {
    if (document.getElementById('dcard-fs-' + d.id)) return;
    const div = document.createElement('div');
    div.className = 'drug-list-card';
    div.id = 'dcard-fs-' + d.id;
    div.onclick = () => {
      if (typeof openFSDrug === 'function') { openFSDrug(d); }
      else { selectFirestoreDrug(d.id); }
    };
    div.innerHTML = `
      <i class="ti ti-pill"></i>
      <div class="dl-name">${d.name}</div>
      <div class="dl-tag">${(d.group || 'Dori').split('/')[0]}</div>
    `;
    grid.appendChild(div);
  });
}

window.selectFirestoreDrug = function(id) {
  const d = window._firestoreDrugs.find(x => x.id === id);
  if (!d) return;
  document.querySelectorAll('.drug-list-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById('dcard-fs-' + id);
  if (card) card.classList.add('active');
  window._currentFSDrug = d;
  window._currentFSDrugMode = true;
  switchDrugTab('umumiy');
};

window.renderFSDrugTab = function(tab) {
  const d = window._currentFSDrug;
  if (!d) return;
  let html = '';
  if (tab === 'umumiy') {
    html = `<h3>${d.name}</h3><span class="drug-group-badge">${d.group || '—'}</span><div class="di-box blue"><strong>Doza:</strong> ${d.dose || '—'} | <strong>Yo'li:</strong> ${d.route || '—'}</div>`;
  } else if (tab === 'mexanizm') {
    html = d.mech ? `<div class="di-box blue">${d.mech}</div>` : `<div class="di-box blue">Kiritilmagan</div>`;
  } else if (tab === 'doza') {
    html = `<div class="di-box green"><strong>Doza:</strong> ${d.dose || '—'}<br><strong>Yo'li:</strong> ${d.route || '—'}</div>`;
  } else if (tab === 'korsatma') {
    html = d.korsatma ? `<ul class="di-list">${d.korsatma.split('\n').filter(l=>l.trim()).map(l=>`<li>${l}</li>`).join('')}</ul>` : `<div class="di-box green">Kiritilmagan</div>`;
  } else if (tab === 'qarshi') {
    html = d.qarshi ? `<ul class="di-list warn">${d.qarshi.split('\n').filter(l=>l.trim()).map(l=>`<li>${l}</li>`).join('')}</ul>` : `<div class="di-box red">Kiritilmagan</div>`;
  } else if (tab === 'yontar') {
    html = d.yon ? `<ul class="di-list">${d.yon.split('\n').filter(l=>l.trim()).map(l=>`<li>${l}</li>`).join('')}</ul>` : `<div class="di-box amber">Kiritilmagan</div>`;
  }
  document.getElementById('drugDetailContent').innerHTML = html;
};