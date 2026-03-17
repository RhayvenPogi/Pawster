/* =============================================
   PAWSTER — HOW IT WORKS
   how_it_works.js
   ============================================= */

new IntersectionObserver ? document.querySelectorAll('.reveal').forEach(el=>new IntersectionObserver(([e])=>{if(e.isIntersecting)e.target.classList.add('visible');},{threshold:0.08}).observe(el)) : null;
const btn=document.getElementById('avatarBtn'),drop=document.getElementById('profileDrop');
if(btn&&drop){btn.addEventListener('click',e=>{e.stopPropagation();drop.classList.toggle('open');btn.classList.toggle('open');});document.addEventListener('click',()=>{drop.classList.remove('open');btn.classList.remove('open');});}