// ===============================
// 1. Background Orb Animation
// ===============================
document.addEventListener("DOMContentLoaded", function () {

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
});


// ===============================
// 2. Dog Cursor
// ===============================
(function () {

    const style = document.createElement('style');
    style.textContent = `
    *, *::before, *::after { cursor: none !important; }
    #dog-cursor {
        position: fixed;
        z-index: 99999;
        pointer-events: none;
        width: 28px;
        height: 28px;
        transform: translate(-50%, -50%);
    }
    #dog-cursor svg { overflow: visible; }
    `;
    document.head.appendChild(style);

    const cursorEl = document.createElement('div');
    cursorEl.id = 'dog-cursor';

    cursorEl.innerHTML = `
    <svg id="dog-svg" width="54" height="54" viewBox="0 0 54 54">
        <ellipse cx="27" cy="50" rx="14" ry="3" fill="rgba(0,0,0,0.13)" />
        <ellipse cx="38" cy="10" rx="10" ry="9" fill="#d4a96a" stroke="#7a5530" stroke-width="1.5"/>
        <circle cx="42" cy="8" r="2.2" fill="#2a1a08"/>
        <rect x="10" y="16" width="28" height="18" rx="9" fill="#d4a96a" stroke="#7a5530" stroke-width="1.5"/>
    </svg>
    `;

    document.body.appendChild(cursorEl);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dogX = mouseX;
    let dogY = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function loop() {
        let dx = mouseX - dogX;
        let dy = mouseY - dogY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
            dogX += dx * 0.1;
            dogY += dy * 0.1;
        }

        cursorEl.style.left = dogX + 'px';
        cursorEl.style.top = dogY + 'px';

        requestAnimationFrame(loop);
    }

    loop();
})();