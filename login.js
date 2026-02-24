/* ════════════════════════════════════
   MESH GRADIENT — mouse parallax
════════════════════════════════════ */
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

/* ════════════════════════════════════
   LOGIN FORM
════════════════════════════════════ */
const loginForm     = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberInput = document.getElementById('remember');
const usernameError = document.getElementById('usernameError');
const emailError    = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const alertError    = document.getElementById('alertError');
const alertSuccess  = document.getElementById('alertSuccess');
const submitBtn     = document.getElementById('submitBtn');
const forgotBtn     = document.getElementById('forgotBtn');

forgotBtn.addEventListener('click', function () {
  try {
    showSuccess('A password reset link has been sent to your email!');
  } catch (error) {
    console.error('Forgot password failed:', error);
  }
});

function validate() {
  try {
    let valid = true;

    usernameError.textContent = '';
    emailError.textContent    = '';
    passwordError.textContent = '';
    usernameInput.classList.remove('error');
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');

    if (!usernameInput.value.trim()) {
      usernameError.textContent = 'Username is required.';
      usernameInput.classList.add('error');
      valid = false;
    }

    if (!emailInput.value.trim()) {
      emailError.textContent = 'Email is required.';
      emailInput.classList.add('error');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(emailInput.value.trim())) {
      emailError.textContent = 'Please enter a valid email address.';
      emailInput.classList.add('error');
      valid = false;
    }

    if (!passwordInput.value) {
      passwordError.textContent = 'Password is required.';
      passwordInput.classList.add('error');
      valid = false;
    } else if (passwordInput.value.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters.';
      passwordInput.classList.add('error');
      valid = false;
    }

    return valid;

  } catch (error) {
    console.error('Validation error:', error);
    return false;
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

usernameInput.addEventListener('input', function () {
  try {
    usernameError.textContent = '';
    usernameInput.classList.remove('error');
    clearAlerts();
  } catch (error) {
    console.error('Username input error:', error);
  }
});

emailInput.addEventListener('input', function () {
  try {
    emailError.textContent = '';
    emailInput.classList.remove('error');
    clearAlerts();
  } catch (error) {
    console.error('Email input error:', error);
  }
});

passwordInput.addEventListener('input', function () {
  try {
    passwordError.textContent = '';
    passwordInput.classList.remove('error');
    clearAlerts();
  } catch (error) {
    console.error('Password input error:', error);
  }
});

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  clearAlerts();

  if (!validate()) return;

  try {
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Signing in...';

    setTimeout(function () {
      try {
        const username = usernameInput.value.trim();
        const email    = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberInput.checked;

        const demoUsername = 'pawster';
        const demoEmail    = 'user@pawster.com';
        const demoPassword = 'password123';

        if (username === demoUsername && email === demoEmail && password === demoPassword) {
          showSuccess('Login successful! Redirecting...');

          if (remember) {
            localStorage.setItem('pawster_username', username);
            localStorage.setItem('pawster_email', email);
          }

          setTimeout(function () {
            window.location.href = 'dashboard.html';
          }, 1500);

        } else {
          showError('Invalid username, email, or password.');
          submitBtn.disabled    = false;
          submitBtn.textContent = 'Sign in';
        }

      } catch (error) {
        showError('Something went wrong. Please try again.');
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Sign in';
        console.error('Login check error:', error);
      }
    }, 1000);

  } catch (error) {
    showError('An unexpected error occurred. Please try again.');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Sign in';
    console.error('Submit error:', error);
  }
});

window.addEventListener('load', function () {
  try {
    const savedUsername = localStorage.getItem('pawster_username');
    const savedEmail    = localStorage.getItem('pawster_email');
    if (savedUsername && savedEmail) {
      usernameInput.value   = savedUsername;
      emailInput.value      = savedEmail;
      rememberInput.checked = true;
    }
  } catch (error) {
    console.error('Auto-fill error:', error);
  }
});