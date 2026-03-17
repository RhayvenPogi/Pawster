/* =============================================
   PAWSTER — FIND A PET
   js/find_a_pet.js
   ============================================= */

function openAdopt(id, name) {
  document.getElementById('adopt-animal-id').value = id;
  document.getElementById('adopt-title').textContent = 'Adopt ' + name;
  document.getElementById('adopt-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  document.body.style.overflow = '';
}

async function submitAdopt(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner" style="animation:spin .8s linear infinite"></i> Submitting…';

  const fd = new FormData();
  fd.append('action',    'add_adoption');
  fd.append('animal_id', document.getElementById('adopt-animal-id').value);
  fd.append('name',      document.getElementById('af-name').value);
  fd.append('phone',     document.getElementById('af-phone').value);
  fd.append('email',     document.getElementById('af-email').value);
  fd.append('address',   document.getElementById('af-address').value);
  fd.append('housing',   document.getElementById('af-housing').value);
  fd.append('exp',       document.getElementById('af-exp').value);
  fd.append('reason',    document.getElementById('af-reason').value);

  try {
    const r = await fetch('adoption_api.php', { method: 'POST', body: fd });
    const d = await r.json();
    if (d.success) {
      closeModal('adopt-modal');
      document.getElementById('adopt-form').reset();
      showToast('Request submitted! We\'ll be in touch soon 🐾');
    } else {
      showToast(d.message || 'Error submitting', 'err');
    }
  } catch (err) {
    showToast('Server error. Please try again.', 'err');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
}

// Close on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('adopt-modal');
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal('adopt-modal'); });
});