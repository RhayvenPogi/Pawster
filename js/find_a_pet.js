/* =============================================
   PAWSTER — FIND A PET
   find_a_pet.js
   ============================================= */

function openAdopt(id, name) {
  document.getElementById('adopt-animal-id').value = id;
  document.getElementById('adopt-title').textContent = 'Adopt ' + name;
  document.getElementById('adopt-modal').style.display = 'flex';
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function submitAdopt(e) {
  e.preventDefault();
  const fd = new FormData();
  fd.append('action','add_adoption');
  fd.append('animal_id', document.getElementById('adopt-animal-id').value);
  fd.append('name',    document.getElementById('af-name').value);
  fd.append('phone',   document.getElementById('af-phone').value);
  fd.append('email',   document.getElementById('af-email').value);
  fd.append('address', document.getElementById('af-address').value);
  fd.append('housing', document.getElementById('af-housing').value);
  fd.append('exp',     document.getElementById('af-exp').value);
  fd.append('reason',  document.getElementById('af-reason').value);
  try {
    const r = await fetch('adoption_api.php', { method:'POST', body:fd });
    const d = await r.json();
    if (d.success) { closeModal('adopt-modal'); document.getElementById('adopt-form').reset(); toast('Request submitted! We\'ll be in touch soon 🐾'); }
    else toast(d.message || 'Error submitting', 'err');
  } catch(e) { toast('Server error', 'err'); }
}

function toast(msg, type='ok') {
  const c = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas fa-${type==='err'?'exclamation-circle':'circle-check'}"></i><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(18px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(),300); },3500);
}

// Scroll reveal
new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); } });
}, {threshold:0.08}).observe ? document.querySelectorAll('.reveal').forEach(el =>
  new IntersectionObserver(([e]) => { if(e.isIntersecting) e.target.classList.add('visible'); },{threshold:0.08}).observe(el)
) : null;

// Nav dropdown
const btn=document.getElementById('avatarBtn'),drop=document.getElementById('profileDrop');
if(btn&&drop){btn.addEventListener('click',e=>{e.stopPropagation();drop.classList.toggle('open');btn.classList.toggle('open');});document.addEventListener('click',()=>{drop.classList.remove('open');btn.classList.remove('open');});}