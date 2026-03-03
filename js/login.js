// --- 1. Background Orb Animation ---
const orbs = [
    { el: document.getElementById('o1'), fx: 0.10, fy: 0.07 },
    { el: document.getElementById('o2'), fx: -0.12, fy: 0.09 },
    { el: document.getElementById('o3'), fx: 0.14, fy: -0.08 },
    { el: document.getElementById('o4'), fx: -0.08, fy: -0.11 },
    { el: document.getElementById('o5'), fx: 0.09, fy: 0.13 },
    { el: document.getElementById('o6'), fx: -0.13, fy: 0.07 },
];

let mx = 0, my = 0, cx = 0, cy = 0;
document.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 80;
    my = (e.clientY / window.innerHeight - 0.5) * 80;
});

function animateMesh() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    orbs.forEach(({ el, fx, fy }) => {
        if (el) {
            el.style.marginLeft = (cx * fx) + 'px';
            el.style.marginTop = (cy * fy) + 'px';
        }
    });
    requestAnimationFrame(animateMesh);
}
animateMesh();

// --- 2. Dog Cursor Logic ---
(function () {
    var style = document.createElement('style');
    style.textContent = `
    *, *::before, *::after { cursor: none !important; }
    #dog-cursor { position: fixed; z-index: 99999; pointer-events: none; width: 28px; height: 28px; transform: translate(-50%, -50%); }
    #dog-cursor svg { overflow: visible; }
    @keyframes legFrontWalk { 0%,100% { transform-origin: 30px 28px; transform: rotate(-22deg); } 50% { transform-origin: 30px 28px; transform: rotate(22deg); } }
    @keyframes legBackWalk { 0%,100% { transform-origin: 14px 28px; transform: rotate(22deg); } 50% { transform-origin: 14px 28px; transform: rotate(-22deg); } }
    @keyframes tailWag { 0%,100% { transform-origin: 8px 18px; transform: rotate(-18deg); } 50% { transform-origin: 8px 18px; transform: rotate(18deg); } }
    @keyframes bodyBob { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-1.5px); } }
    @keyframes earFlop { 0%,100% { transform-origin: 36px 10px; transform: rotate(0deg); } 50% { transform-origin: 36px 10px; transform: rotate(8deg); } }
    @keyframes sitSettle { 0% { transform: translateY(0px); } 40% { transform: translateY(-3px); } 100% { transform: translateY(0px); } }
    @keyframes pawTap { 0%,100% { transform-origin: 30px 28px; transform: rotate(0deg); } 50% { transform-origin: 30px 28px; transform: rotate(-30deg); } }
    #dog-cursor.walking #dog-body { animation: bodyBob 0.28s ease-in-out infinite; }
    #dog-cursor.walking #dog-leg-front { animation: legFrontWalk 0.28s ease-in-out infinite; }
    #dog-cursor.walking #dog-leg-back { animation: legBackWalk 0.28s ease-in-out infinite; }
    #dog-cursor.walking #dog-tail { animation: tailWag 0.28s ease-in-out infinite; }
    #dog-cursor.walking #dog-ear { animation: earFlop 0.32s ease-in-out infinite; }
    #dog-cursor.idle #dog-tail { animation: tailWag 0.6s ease-in-out infinite; }
    #dog-cursor.clicking #dog-body { animation: sitSettle 0.2s ease-out forwards; }
    #dog-cursor.clicking #dog-leg-front { animation: pawTap 0.18s ease-in-out 2; }
  `;
    document.head.appendChild(style);

    var cursorEl = document.createElement('div');
    cursorEl.id = 'dog-cursor';
    cursorEl.innerHTML = `<svg id="dog-svg" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="27" cy="50" rx="14" ry="3" fill="rgba(0,0,0,0.13)" />
    <g id="dog-tail"><path d="M10 22 Q2 14 6 8 Q10 4 12 10 Q10 16 14 20Z" fill="#c8a06a" stroke="#7a5530" stroke-width="1.2" stroke-linejoin="round"/></g>
    <g id="dog-body">
      <g id="dog-leg-back"><rect x="11" y="30" width="6" height="14" rx="3" fill="#b8904a" stroke="#7a5530" stroke-width="1"/><ellipse cx="14" cy="44" rx="5" ry="3" fill="#a07838" stroke="#7a5530" stroke-width="1"/></g>
      <rect x="10" y="16" width="28" height="18" rx="9" fill="#d4a96a" stroke="#7a5530" stroke-width="1.5"/>
      <g id="dog-leg-front"><rect x="27" y="30" width="6" height="14" rx="3" fill="#c8a06a" stroke="#7a5530" stroke-width="1"/><ellipse cx="30" cy="44" rx="5" ry="3" fill="#a07838" stroke="#7a5530" stroke-width="1"/></g>
      <ellipse cx="38" cy="10" rx="10" ry="9" fill="#d4a96a" stroke="#7a5530" stroke-width="1.5"/>
      <circle cx="42" cy="8" r="2.2" fill="#2a1a08"/>
      <g id="dog-ear"><path d="M36 4 Q40 0 44 3 Q42 8 38 9Z" fill="#b87840" stroke="#7a5530" stroke-width="1" stroke-linejoin="round"/></g>
    </g></svg>`;

    document.body.appendChild(cursorEl);

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let dogX = mouseX, dogY = mouseY, facingRight = true, isClicking = false;

    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    document.addEventListener('mousedown', () => {
        isClicking = true; cursorEl.className = 'clicking';
        setTimeout(() => { isClicking = false; }, 300);
    });

    function loop() {
        if (!isClicking) {
            let dx = mouseX - dogX, dy = mouseY - dogY, dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                dogX += (dx / dist) * Math.min(dist * 0.13, 18);
                dogY += (dy / dist) * Math.min(dist * 0.13, 18);
                document.getElementById('dog-svg').style.transform = dx > 0 ? 'scaleX(1)' : 'scaleX(-1)';
                cursorEl.className = dist > 7 ? 'walking' : 'idle';
            } else { cursorEl.className = 'idle'; }
        }
        cursorEl.style.left = dogX + 'px'; cursorEl.style.top = dogY + 'px';
        requestAnimationFrame(loop);
    }
    loop();
}());

// --- 3. Login Logic (Email/Password Only) ---
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberInput = document.getElementById('remember');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const alertError = document.getElementById('alertError');
const alertSuccess = document.getElementById('alertSuccess');
const submitBtn = document.getElementById('submitBtn');

function validate() {
    let valid = true;
    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';
    if (emailInput) emailInput.classList.remove('error');
    if (passwordInput) passwordInput.classList.remove('error');

    if (emailInput && !emailInput.value.trim()) {
        emailError.textContent = 'Email is required.';
        emailInput.classList.add('error');
        valid = false;
    } else if (emailInput && !/\S+@\S+\.\S+/.test(emailInput.value.trim())) {
        emailError.textContent = 'Enter a valid email.';
        emailInput.classList.add('error');
        valid = false;
    }

    if (passwordInput && !passwordInput.value) {
        passwordError.textContent = 'Password is required.';
        passwordInput.classList.add('error');
        valid = false;
    }
    return valid;
}

function clearAlerts() {
    if (alertError) alertError.style.display = 'none';
    if (alertSuccess) alertSuccess.style.display = 'none';
}

function showSuccess(msg) {
    if (alertSuccess) {
        alertSuccess.textContent = msg;
        alertSuccess.style.display = 'block';
    }
    if (alertError) alertError.style.display = 'none';
}

function showError(msg) {
    if (alertError) {
        alertError.textContent = msg;
        alertError.style.display = 'block';
    }
    if (alertSuccess) alertSuccess.style.display = 'none';
}

// Attach listeners only if elements exist (Dashboard safety)
if (emailInput) {
    emailInput.addEventListener('input', () => {
        emailError.textContent = '';
        emailInput.classList.remove('error');
        clearAlerts();
    });
}

if (passwordInput) {
    passwordInput.addEventListener('input', () => {
        passwordError.textContent = '';
        passwordInput.classList.remove('error');
        clearAlerts();
    });
}

// Form Submission
if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        const formData = new FormData();
        formData.append('email', emailInput.value.trim());
        formData.append('password', passwordInput.value);

        fetch('php/login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess(data.message);
                if (rememberInput.checked) {
                    localStorage.setItem('pawster_email', emailInput.value.trim());
                } else {
                    localStorage.removeItem('pawster_email');
                }
                setTimeout(() => {
                    // Redirecting to dashboard in the root or php folder depending on your setup
                    window.location.href = 'php/dashboard.php';
                }, 1500);
            } else {
                showError(data.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign in';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showError('Server connection failed.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
        });
    });
}

// Auto-fill Remembered Email
window.addEventListener('load', () => {
    const savedEmail = localStorage.getItem('pawster_email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberInput) rememberInput.checked = true;
    }
});


