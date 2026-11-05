(() => {
 const root=document.documentElement;
 const apply=dark=>{root.dataset.theme=dark?'dark':'light';const button=document.querySelector('#theme-toggle');if(button){button.innerHTML=dark?'<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg> Modo claro':'<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/></svg> Modo oscuro';button.setAttribute('aria-pressed',String(dark));}};
 let dark=false;try{dark=localStorage.getItem('procrastinator-theme')==='dark';}catch{}
 apply(dark);
 document.addEventListener('DOMContentLoaded',()=>{apply(dark);document.querySelector('#theme-toggle').addEventListener('click',()=>{dark=root.dataset.theme!=='dark';apply(dark);try{localStorage.setItem('procrastinator-theme',dark?'dark':'light');}catch{}});});
})();
