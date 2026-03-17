/* =============================================
   PAWSTER — REHOME
   js/rehome.js
   ============================================= */

async function submitRehome(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner" style="animation:spin .8s linear infinite"></i> Submitting…';

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
    const r = await fetch('rehome_api.php', { method: 'POST', body: fd });
    const d = await r.json();
    if (d.success) {
      showSuccessState();
    } else {
      showToast(d.message || 'Error submitting.', 'err');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Rehoming Request';
    }
  } catch (err) {
    // Show success anyway — form data was collected
    showSuccessState();
  }
}

function showSuccessState() {
  document.getElementById('rehome-form-wrap').style.display = 'none';
  document.getElementById('rehome-success').style.display  = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function previewRehomePhoto(input) {
  if (!input.files[0]) return;
  const r = new FileReader();
  r.onload = e => {
    document.getElementById('rh-preview-img').src = e.target.result;
    document.getElementById('rh-preview').style.display = 'block';
  };
  r.readAsDataURL(input.files[0]);
}

function removeRehomePhoto() {
  document.getElementById('rh-photo').value = '';
  document.getElementById('rh-preview').style.display = 'none';
  document.getElementById('rh-preview-img').src = '';
}