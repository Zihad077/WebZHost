const fs=require('fs');const {JSDOM}=require('jsdom');
let html=fs.readFileSync('/home/user/telegram-bot-hosting/index.html','utf8');
const script=fs.readFileSync('/home/user/telegram-bot-hosting/script.js','utf8');
html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','').replace('<script src="script.js"></script>','');
const errs=[];const vc=new (require('jsdom').VirtualConsole)();vc.on('jsdomError',e=>errs.push(e.message));
const dom=new JSDOM(html,{url:'http://localhost:8080/#home',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
 beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.fetch=()=>Promise.reject(new Error('net'));}});
const win=dom.window,doc=win.document;const s=doc.createElement('script');s.textContent=script;doc.body.appendChild(s);
const tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await tick(250);
 console.log('initial content len:', doc.querySelector('#content').innerHTML.length);
 // register
 win.location.hash='#register'; await tick(100);
 doc.querySelector('#name').value='Rafi';doc.querySelector('#email').value='rafi@test.com';
 doc.querySelector('#password').value='secret123';doc.querySelector('#pwConfirm').value='secret123';
 doc.querySelector('#authForm').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true})); await tick(1200);
 console.log('after register hash:', win.location.hash);
 console.log('appShell hidden?', doc.querySelector('#appShell').hidden);
 // nav to create-bot
 win.location.hash='#create-bot'; await tick(300);
 console.log('after nav hash:', win.location.hash);
 console.log('content len:', doc.querySelector('#content').innerHTML.length);
 console.log('has #createBotForm:', !!doc.querySelector('#createBotForm'));
 console.log('has #botName:', !!doc.querySelector('#botName'));
 console.log('jsdomErrors:', errs.slice(0,5));
 process.exit(0);
})();
