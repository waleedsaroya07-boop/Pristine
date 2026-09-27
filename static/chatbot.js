(() => {
  const script=document.currentScript;
  const apiBase=(script&&script.dataset.apiBase)||window.PRISTINE_CHATBOT_API||'';
  let sessionId=localStorage.getItem('pristine_chat_session')||'';
  const root=document.createElement('div'); root.className='pa-chat-root';
  root.innerHTML=`
    <button class="pa-chat-launch" type="button" aria-expanded="false">Trade Enquiry</button>
    <section class="pa-chat-panel" hidden aria-label="Pristine Apparel wholesale assistant">
      <header class="pa-chat-header"><div><strong>Pristine Apparel</strong><span>Wholesale Assistant</span></div><button class="pa-chat-close" type="button" aria-label="Close chat">×</button></header>
      <div class="pa-chat-messages" aria-live="polite"></div>
      <div class="pa-chat-quick"><button data-msg="Astra">Astra</button><button data-msg="Medium">Medium</button><button data-msg="Workwear">Workwear</button><button class="pa-chat-voice" aria-label="Speak message">🎙</button></div>
      <form class="pa-chat-form"><input class="pa-chat-input" aria-label="Message" autocomplete="off" placeholder="Tell us what you need…" required><button type="submit">Send</button></form>
      <small>Quote-first wholesale assistance. Prices, lead times and certifications are confirmed per order.</small>
    </section>`;
  document.body.appendChild(root);
  const launch=root.querySelector('.pa-chat-launch'),panel=root.querySelector('.pa-chat-panel'),close=root.querySelector('.pa-chat-close'),messages=root.querySelector('.pa-chat-messages'),form=root.querySelector('.pa-chat-form'),input=root.querySelector('.pa-chat-input'),voice=root.querySelector('.pa-chat-voice');
  const add=(text,role)=>{const el=document.createElement('div');el.className=`pa-chat-message ${role}`;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight};
  async function send(text){
    const message=String(text||'').trim(); if(!message)return; add(message,'user'); input.value='';
    try{
      const res=await fetch(`${apiBase}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId||null,message})});
      if(!res.ok)throw new Error(); const data=await res.json(); sessionId=data.session_id; localStorage.setItem('pristine_chat_session',sessionId); add(data.reply,'bot');
    }catch(e){add('The wholesale assistant is temporarily unavailable. Please use the website enquiry form.','bot')}
  }
  launch.onclick=()=>{panel.hidden=!panel.hidden;launch.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden&&!messages.children.length){add('Welcome to Pristine Apparel wholesale. Which range are you looking at – Astra (premium), Medium, or Workwear?','bot');input.focus()}};
  close.onclick=()=>{panel.hidden=true;launch.setAttribute('aria-expanded','false')}; form.onsubmit=e=>{e.preventDefault();send(input.value)}; root.querySelectorAll('[data-msg]').forEach(b=>b.onclick=()=>send(b.dataset.msg));
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(Recognition){const r=new Recognition();r.lang='en-GB';r.interimResults=false;r.maxAlternatives=1;voice.onclick=()=>r.start();r.onresult=e=>send(e.results[0][0].transcript);r.onerror=()=>add('Voice input was not available. Please type your message.','bot')}else voice.hidden=true;
})();
