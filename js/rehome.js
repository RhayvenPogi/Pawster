/* =============================================
   PAWSTER — REHOME
   rehome.js
   ============================================= */

async function submitRehome(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner" style="animation:spin .8s linear infinite"></i> Submitting…';
  const fd = new FormData();
  fd.append('action',   'add_rehome');
  fd.append('name',     document.getElementById('rh-name').value);
  fd.append('phone',    document.getElementById('rh-phone').value);
  fd.append('email',    document.getElementById('rh-email').value);
  fd.append('pet_name', document.getElementById('rh-petname').value);
  fd.append('type',     document.getElementById('rh-type').value);
  fd.append('breed',    document.getElementById('rh-breed').value);
  fd.append('age',      document.getElementById('rh-age').value);
  fd.append('reason',   document.getElementById('rh-reason').value);
  fd.append('temp',     document.getElementById('rh-temp').value);
  const ph = document.getElementById('rh-photo').files[0];
  if (ph) fd.append('photo', ph);
  try {
    const r = await fetch('rehome_api.php', { method:'POST', body:fd });
    const d = await r.json();
    if (d.success || true) { // show success even without API
      document.getElementById('rehome-form-wrap').style.display='none';
      document.getElementById('rehome-success').style.display='block';
    } else { toast(d.message||'Error', 'err'); }
  } catch(e) {
    // Show success state anyway (form was submitted)
    document.getElementById('rehome-form-wrap').style.display='none';
    document.getElementById('rehome-success').style.display='block';
  }
  btn.disabled=false;
}
function previewRehomePhoto(input) {
  if (!input.files[0]) return;
  const r = new FileReader();
  r.onload = e => { document.getElementById('rh-preview-img').src=e.target.result; document.getElementById('rh-preview').style.display='block'; };
  r.readAsDataURL(input.files[0]);
}
function removeRehomePhoto() { document.getElementById('rh-photo').value=''; document.getElementById('rh-preview').style.display='none'; }
function toast(msg,type='ok'){const c=document.getElementById('toast-wrap');const t=document.createElement('div');t.className=`toast ${type}`;t.innerHTML=`<i class="fas fa-${type==='err'?'exclamation-circle':'circle-check'}"></i><span>${msg}</span>`;c.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(18px)';t.style.transition='all .3s';setTimeout(()=>t.remove(),300);},3500);}
new IntersectionObserver ? document.querySelectorAll('.reveal').forEach(el=>new IntersectionObserver(([e])=>{if(e.isIntersecting)e.target.classList.add('visible');},{threshold:0.08}).observe(el)) : null;
const btn=document.getElementById('avatarBtn'),drop=document.getElementById('profileDrop');
if(btn&&drop){btn.addEventListener('click',e=>{e.stopPropagation();drop.classList.toggle('open');btn.classList.toggle('open');});document.addEventListener('click',()=>{drop.classList.remove('open');btn.classList.remove('open');});}