const orbs = [
  { el: document.getElementById('o1'), fx:  0.10, fy:  0.07 },
  { el: document.getElementById('o2'), fx: -0.12, fy:  0.09 },
  { el: document.getElementById('o3'), fx:  0.14, fy: -0.08 },
  { el: document.getElementById('o4'), fx: -0.08, fy: -0.11 },
  { el: document.getElementById('o5'), fx:  0.09, fy:  0.13 },
  { el: document.getElementById('o6'), fx: -0.13, fy:  0.07 },
];

let mx = 0, my = 0, cx = 0, cy = 0;

document.addEventListener('mousemove', function (e) {
  mx = (e.clientX / window.innerWidth  - 0.5) * 80;
  my = (e.clientY / window.innerHeight - 0.5) * 80;
});

function animateMesh() {
  cx += (mx - cx) * 0.08;
  cy += (my - cy) * 0.08;
  orbs.forEach(function ({ el, fx, fy }) {
    el.style.marginLeft = (cx * fx) + 'px';
    el.style.marginTop  = (cy * fy) + 'px';
  });
  requestAnimationFrame(animateMesh);
}

animateMesh();


(function () {

  var style = document.createElement('style');
  style.textContent = [
    '*, *::before, *::after { cursor: none !important; }',

    '#dog-cursor {',
    '  position: fixed;',
    '  z-index: 99999;',
    '  pointer-events: none;',
    '  width: 28px;',
    '  height: 28px;',
    '  transform: translate(-50%, -50%);',
    '}',

    '#dog-cursor svg { overflow: visible; }',

    '@keyframes legFrontWalk {',
    '  0%,100% { transform-origin: 30px 28px; transform: rotate(-22deg); }',
    '  50%      { transform-origin: 30px 28px; transform: rotate(22deg);  }',
    '}',
    '@keyframes legBackWalk {',
    '  0%,100% { transform-origin: 14px 28px; transform: rotate(22deg);  }',
    '  50%      { transform-origin: 14px 28px; transform: rotate(-22deg); }',
    '}',
    '@keyframes tailWag {',
    '  0%,100% { transform-origin: 8px 18px; transform: rotate(-18deg); }',
    '  50%      { transform-origin: 8px 18px; transform: rotate(18deg);  }',
    '}',
    '@keyframes bodyBob {',
    '  0%,100% { transform: translateY(0px);  }',
    '  50%      { transform: translateY(-1.5px); }',
    '}',
    '@keyframes earFlop {',
    '  0%,100% { transform-origin: 36px 10px; transform: rotate(0deg); }',
    '  50%      { transform-origin: 36px 10px; transform: rotate(8deg); }',
    '}',
    '@keyframes sitSettle {',
    '  0%   { transform: translateY(0px);  }',
    '  40%  { transform: translateY(-3px); }',
    '  100% { transform: translateY(0px);  }',
    '}',
    '@keyframes pawTap {',
    '  0%,100% { transform-origin: 30px 28px; transform: rotate(0deg);   }',
    '  50%      { transform-origin: 30px 28px; transform: rotate(-30deg); }',
    '}',

    '#dog-cursor.walking #dog-body      { animation: bodyBob      0.28s ease-in-out infinite; }',
    '#dog-cursor.walking #dog-leg-front { animation: legFrontWalk 0.28s ease-in-out infinite; }',
    '#dog-cursor.walking #dog-leg-back  { animation: legBackWalk  0.28s ease-in-out infinite; }',
    '#dog-cursor.walking #dog-tail      { animation: tailWag      0.28s ease-in-out infinite; }',
    '#dog-cursor.walking #dog-ear       { animation: earFlop      0.32s ease-in-out infinite; }',

    '#dog-cursor.idle #dog-tail { animation: tailWag 0.6s ease-in-out infinite; }',

    '#dog-cursor.clicking #dog-body      { animation: sitSettle 0.2s ease-out forwards; }',
    '#dog-cursor.clicking #dog-leg-front { animation: pawTap    0.18s ease-in-out 2;    }',
  ].join('');

  document.head.appendChild(style);

  var cursorEl = document.createElement('div');
  cursorEl.id = 'dog-cursor';

  cursorEl.innerHTML = [
    '<svg id=\"dog-svg\" width=\"54\" height=\"54\" viewBox=\"0 0 54 54\" xmlns=\"http://www.w3.org/2000/svg\">',

    '<ellipse cx=\"27\" cy=\"50\" rx=\"14\" ry=\"3\" fill=\"rgba(0,0,0,0.13)\" />',

    '<g id=\"dog-tail\">',
    '  <path d=\"M10 22 Q2 14 6 8 Q10 4 12 10 Q10 16 14 20Z\"',
    '    fill=\"#c8a06a\" stroke=\"#7a5530\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>',
    '</g>',

    '<g id=\"dog-body\">',

    '<g id=\"dog-leg-back\">',
    '  <rect x=\"11\" y=\"30\" width=\"6\" height=\"14\" rx=\"3\" fill=\"#b8904a\" stroke=\"#7a5530\" stroke-width=\"1\"/>',
    '  <ellipse cx=\"14\" cy=\"44\" rx=\"5\" ry=\"3\" fill=\"#a07838\" stroke=\"#7a5530\" stroke-width=\"1\"/>',
    '</g>',

    '<rect x=\"10\" y=\"16\" width=\"28\" height=\"18\" rx=\"9\" fill=\"#d4a96a\" stroke=\"#7a5530\" stroke-width=\"1.5\"/>',
    '<ellipse cx=\"24\" cy=\"28\" rx=\"9\" ry=\"5\" fill=\"#f0d090\" opacity=\"0.7\"/>',

    '<g id=\"dog-leg-front\">',
    '  <rect x=\"27\" y=\"30\" width=\"6\" height=\"14\" rx=\"3\" fill=\"#c8a06a\" stroke=\"#7a5530\" stroke-width=\"1\"/>',
    '  <ellipse cx=\"30\" cy=\"44\" rx=\"5\" ry=\"3\" fill=\"#a07838\" stroke=\"#7a5530\" stroke-width=\"1\"/>',
    '</g>',

    '<rect x=\"30\" y=\"12\" width=\"10\" height=\"12\" rx=\"5\" fill=\"#c89850\" stroke=\"#7a5530\" stroke-width=\"1.2\"/>',
    '<ellipse cx=\"38\" cy=\"10\" rx=\"10\" ry=\"9\" fill=\"#d4a96a\" stroke=\"#7a5530\" stroke-width=\"1.5\"/>',
    '<ellipse cx=\"46\" cy=\"13\" rx=\"5\" ry=\"4\" fill=\"#e8c080\" stroke=\"#7a5530\" stroke-width=\"1\"/>',
    '<ellipse cx=\"50\" cy=\"12\" rx=\"2.2\" ry=\"1.8\" fill=\"#4a2a10\"/>',
    '<circle cx=\"42\" cy=\"8\" r=\"2.2\" fill=\"#2a1a08\"/>',
    '<circle cx=\"42.8\" cy=\"7.3\" r=\"0.7\" fill=\"#fff\"/>',

    '<g id=\"dog-ear\">',
    '  <path d=\"M36 4 Q40 0 44 3 Q42 8 38 9Z\"',
    '    fill=\"#b87840\" stroke=\"#7a5530\" stroke-width=\"1\" stroke-linejoin=\"round\"/>',
    '</g>',

    '<rect x=\"31\" y=\"16\" width=\"10\" height=\"3.5\" rx=\"1.8\" fill=\"#2a7a40\" stroke=\"#1a5030\" stroke-width=\"0.8\"/>',
    '<circle cx=\"36\" cy=\"17.8\" r=\"1.2\" fill=\"#f0c830\"/>',

    '</g>',
    '</svg>',
  ].join('');

  document.body.appendChild(cursorEl);

  var mouseX = window.innerWidth  / 2;
  var mouseY = window.innerHeight / 2;
  var dogX   = mouseX;
  var dogY   = mouseY;
  var facingRight = true;
  var isClicking  = false;

  var STOP_DIST = 5;
  var SPEED     = 0.13;
  var WALK_DIST = 7;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mousedown', function () {
    isClicking = true;
    setClass('clicking');
    setTimeout(function () { isClicking = false; }, 300);
  });

  function setFacing(right) {
    if (right === facingRight) return;
    facingRight = right;
    var svg = document.getElementById('dog-svg');
    svg.style.transform = right ? 'scaleX(1)' : 'scaleX(-1)';
  }

  function setClass(cls) { cursorEl.className = cls; }

  function loop() {
    if (!isClicking) {
      var dx   = mouseX - dogX;
      var dy   = mouseY - dogY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > STOP_DIST) {
        var speed = Math.min(dist * SPEED, 18);
        dogX += (dx / dist) * speed;
        dogY += (dy / dist) * speed;
        setFacing(dx > 0);
        setClass(dist > WALK_DIST ? 'walking' : 'idle');
      } else {
        setClass('idle');
      }
    }

    cursorEl.style.left = dogX + 'px';
    cursorEl.style.top  = dogY + 'px';
    requestAnimationFrame(loop);
  }

  cursorEl.style.left = dogX + 'px';
  cursorEl.style.top  = dogY + 'px';
  setClass('idle');
  loop();

}());


let currentStep = 1;

const alertError   = document.getElementById('alertError');
const alertSuccess = document.getElementById('alertSuccess');


function goToStep(step) {
  try {
    if (step > currentStep && !validateStep(currentStep)) return;

    document.getElementById('step' + currentStep).style.display = 'none';
    document.getElementById('step' + step).style.display        = 'block';

    updateStepper(step);
    clearAlerts();
    currentStep = step;

  } catch (error) {
    console.error('goToStep error:', error);
  }
}

function updateStepper(step) {
  try {
    for (let i = 1; i <= 3; i++) {
      const circle = document.getElementById('circle-' + i);
      const label  = document.getElementById('label-' + i);
      const line   = document.getElementById('line-' + i);

      circle.classList.remove('active', 'done');
      label.classList.remove('active');

      if (i < step) {
        circle.classList.add('done');
        label.classList.add('active');
        if (line) line.classList.add('done');
      } else if (i === step) {
        circle.classList.add('active');
        label.classList.add('active');
        if (line) line.classList.remove('done');
      } else {
        if (line) line.classList.remove('done');
      }
    }
  } catch (error) {
    console.error('updateStepper error:', error);
  }
}

function validateStep(step) {
  try {
    clearFieldErrors();
    let valid = true;

    if (step === 1) {
      const firstName       = document.getElementById('firstName');
      const lastName        = document.getElementById('lastName');
      const email           = document.getElementById('email');
      const phone           = document.getElementById('phone');
      const password        = document.getElementById('password');
      const confirmPassword = document.getElementById('confirmPassword');

      if (!firstName.value.trim()) {
        setError('firstNameError', firstName, 'First name is required.');
        valid = false;
      }

      if (!lastName.value.trim()) {
        setError('lastNameError', lastName, 'Last name is required.');
        valid = false;
      }

      if (!email.value.trim()) {
        setError('emailError', email, 'Email is required.');
        valid = false;
      } else if (!/\S+@\S+\.\S+/.test(email.value.trim())) {
        setError('emailError', email, 'Enter a valid email address.');
        valid = false;
      }

      if (!phone.value.trim()) {
        setError('phoneError', phone, 'Phone number is required.');
        valid = false;
      }

      if (!password.value) {
        setError('passwordError', password, 'Password is required.');
        valid = false;
      } else if (password.value.length < 8) {
        setError('passwordError', password, 'Password must be at least 8 characters.');
        valid = false;
      }

      if (!confirmPassword.value) {
        setError('confirmPasswordError', confirmPassword, 'Please confirm your password.');
        valid = false;
      } else if (password.value !== confirmPassword.value) {
        setError('confirmPasswordError', confirmPassword, 'Passwords do not match.');
        valid = false;
      }
    }

    if (step === 2) {
      const address  = document.getElementById('address');
      const city     = document.getElementById('city');
      const province = document.getElementById('province');
      const zip      = document.getElementById('zip');

      if (!address.value.trim()) {
        setError('addressError', address, 'Street address is required.');
        valid = false;
      }

      if (!city.value.trim()) {
        setError('cityError', city, 'City is required.');
        valid = false;
      }

      if (!province.value.trim()) {
        setError('provinceError', province, 'Province is required.');
        valid = false;
      }

      if (!zip.value.trim()) {
        setError('zipError', zip, 'Zip / Postal code is required.');
        valid = false;
      }
    }

    return valid;

  } catch (error) {
    console.error('validateStep error:', error);
    return false;
  }
}


function submitForm() {
  try {
    clearFieldErrors();
    clearAlerts();

    const idFile = document.getElementById('idFile');
    const termsCheck = document.getElementById('termsCheck');

    // Client-side final checks
    if (!idFile.files || idFile.files.length === 0) {
      document.getElementById('uploadStatus').style.color = '#c03030';
      document.getElementById('uploadStatus').textContent = 'Please upload a government-issued ID.';
      return;
    }
    if (!termsCheck.checked) {
      setError('termsError', null, 'You must agree to the Terms of Service.');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    // 1. Prepare FormData (Handles both text and files)
    const formData = new FormData();
    formData.append('firstName', document.getElementById('firstName').value);
    formData.append('lastName', document.getElementById('lastName').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('password', document.getElementById('password').value);
    formData.append('address', document.getElementById('address').value);
    formData.append('city', document.getElementById('city').value);
    formData.append('province', document.getElementById('province').value);
    formData.append('zip', document.getElementById('zip').value);
    formData.append('idFile', idFile.files[0]);

    // 2. Send to PHP
    fetch('php/register.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showSuccess(data.message);
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      } else {
        showError(data.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    })
    .catch(error => {
      showError('An error occurred during registration.');
      submitBtn.disabled = false;
    });

  } catch (error) {
    console.error('submitForm error:', error);
  }
}


document.getElementById('idFile').addEventListener('change', function () {
  try {
    const status = document.getElementById('uploadStatus');
    if (this.files && this.files.length > 0) {
      status.style.color   = '#2a6010';
      status.textContent   = 'Selected: ' + this.files[0].name;
    } else {
      status.style.color   = '#5a8a30';
      status.textContent   = 'No file selected';
    }
  } catch (error) {
    console.error('File input error:', error);
  }
});

function setError(errorId, inputEl, message) {
  try {
    document.getElementById(errorId).textContent = message;
    if (inputEl) inputEl.classList.add('error');
  } catch (error) {
    console.error('setError failed:', error);
  }
}

function clearFieldErrors() {
  try {
    const errorSpans = document.querySelectorAll('.field-error');
    errorSpans.forEach(function (span) { span.textContent = ''; });

    const errorInputs = document.querySelectorAll('.field-input.error');
    errorInputs.forEach(function (input) { input.classList.remove('error'); });
  } catch (error) {
    console.error('clearFieldErrors failed:', error);
  }
}

function showError(message) {
  try {
    alertError.textContent     = message;
    alertError.style.display   = 'block';
    alertSuccess.style.display = 'none';
  } catch (error) {
    console.error('showError failed:', error);
  }
}

function showSuccess(message) {
  try {
    alertSuccess.textContent   = message;
    alertSuccess.style.display = 'block';
    alertError.style.display   = 'none';
  } catch (error) {
    console.error('showSuccess failed:', error);
  }
}

function clearAlerts() {
  try {
    alertError.style.display   = 'none';
    alertSuccess.style.display = 'none';
  } catch (error) {
    console.error('clearAlerts failed:', error);
  }
}



document.querySelectorAll('.field-input').forEach(function (input) {
  input.addEventListener('input', function () {
    try {
      this.classList.remove('error');
      clearAlerts();
    } catch (error) {
      console.error('Input clear error:', error);
    }
  });
});

(function () {
  var modal      = document.getElementById('termsModal');
  var termsLink  = document.getElementById('termsLink');
  var closeBtn   = document.getElementById('modalClose');
  var declineBtn = document.getElementById('modalDecline');
  var acceptBtn  = document.getElementById('modalAccept');
  var termsCheck = document.getElementById('termsCheck');

  function openModal(e) {
    e.preventDefault();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  termsLink.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  declineBtn.addEventListener('click', function () {
    termsCheck.checked = false;
    closeModal();
  });

  acceptBtn.addEventListener('click', function () {
    termsCheck.checked = true;
    var err = document.getElementById('termsError');
    if (err) err.textContent = '';
    closeModal();
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
  });
}());