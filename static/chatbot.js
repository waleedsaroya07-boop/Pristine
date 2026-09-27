(() => {
  const script = document.currentScript;
  const apiBase = (script && script.dataset.apiBase) || window.PRISTINE_CHATBOT_API || '';
  let sessionId = localStorage.getItem('pristine_chat_session') || '';
  let latestState = null;

  const root = document.createElement('div');
  root.className = 'pa-chat-root';
  root.innerHTML = `
    <button class="pa-chat-launch" type="button" aria-expanded="false">Trade Enquiry</button>
    <section class="pa-chat-panel" hidden aria-label="Pristine Apparel wholesale assistant">
      <header class="pa-chat-header"><div><strong>Pristine Apparel</strong><span>Wholesale Assistant</span></div><button class="pa-chat-close" type="button" aria-label="Close chat">×</button></header>
      <div class="pa-chat-messages" aria-live="polite"></div>
      <div class="pa-chat-quick"><button data-msg="Astra">Astra</button><button data-msg="Medium">Medium</button><button data-msg="Workwear">Workwear</button><button class="pa-chat-voice" aria-label="Speak message">🎙</button></div>
      <div class="pa-chat-cta" hidden><button type="button">Continue to quote form</button></div>
      <form class="pa-chat-form"><input class="pa-chat-input" aria-label="Message" autocomplete="off" placeholder="Tell us what you need…" required><button type="submit">Send</button></form>
      <small>Quote-first wholesale assistance. Prices, lead times and certifications are confirmed per order.</small>
    </section>`;
  document.body.appendChild(root);

  const launch=root.querySelector('.pa-chat-launch'),panel=root.querySelector('.pa-chat-panel'),close=root.querySelector('.pa-chat-close'),messages=root.querySelector('.pa-chat-messages'),form=root.querySelector('.pa-chat-form'),input=root.querySelector('.pa-chat-input'),voice=root.querySelector('.pa-chat-voice'),cta=root.querySelector('.pa-chat-cta');

  const add=(text,role)=>{const el=document.createElement('div');el.className=`pa-chat-message ${role}`;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight};
  const setValue=(id,value)=>{const el=document.getElementById(id);if(el&&value!=null){el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}));}};
  const selectText=(id,value)=>{const el=document.getElementById(id);if(!el||!value)return;const wanted=String(value).toLowerCase();const opt=[...el.options].find(o=>o.value.toLowerCase()===wanted||o.text.toLowerCase()===wanted||o.text.toLowerCase().includes(wanted.split(' / ')[0].toLowerCase()));if(opt){el.value=opt.value;el.dispatchEvent(new Event('change',{bubbles:true}));}};

  function prefillQuote(state){
    if(!state)return false;
    const quote=document.getElementById('quote');
    if(!quote)return false;
    selectText('PaBuyer',state.buyer_type); selectText('PaRange',state.range);
    setValue('PaStyle',state.product); setValue('PaColour',state.colour); setValue('PaFabric',state.fabric_preference);
    setValue('PaBranding',state.branding_method); setValue('PaSizes',state.size_ratio); setValue('PaCerts',state.required_certifications);
    setValue('PaTimeline',state.delivery_timeline); setValue('PaQty',state.quantity);
    const summary=[`Chatbot-qualified wholesale enquiry`,`Range: ${state.range||''}`,`Buyer: ${state.buyer_type||''}`,`Product/style: ${state.product||''}`,`Quantity: ${state.quantity||''} per style/colour`,`Colour: ${state.colour||''}`,`Fabric preference: ${state.fabric_preference||''}`,`Size ratio: ${state.size_ratio||''}`,`Branding: ${state.branding_method||''}`,`Required certifications/standards: ${state.required_certifications||''}`,`Target timeline: ${state.delivery_timeline||''}`].join('\n');
    setValue('PaMessage',summary);
    quote.scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }

  function showQuoteCTA(state){
    latestState=state; localStorage.setItem('pristine_quote_prefill',JSON.stringify(state)); cta.hidden=false;
  }

  async function send(text){
    const message=String(text||'').trim(); if(!message)return; add(message,'user'); input.value='';
    try{
      const res=await fetch(`${apiBase}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId||null,message})});
      if(!res.ok)throw new Error(); const data=await res.json(); sessionId=data.session_id; latestState=data.state; localStorage.setItem('pristine_chat_session',sessionId); add(data.reply,'bot');
      if(data.state&&data.state.ready_for_quote)showQuoteCTA(data.state);
    }catch(e){add('The wholesale assistant is temporarily unavailable. Please use the website enquiry form.','bot')}
  }

  launch.onclick=()=>{panel.hidden=!panel.hidden;launch.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden&&!messages.children.length){add('Welcome to Pristine Apparel wholesale. Which range are you looking at – Astra (premium), Medium, or Workwear?','bot');input.focus()}};
  close.onclick=()=>{panel.hidden=true;launch.setAttribute('aria-expanded','false')};
  form.onsubmit=e=>{e.preventDefault();send(input.value)};
  root.querySelectorAll('[data-msg]').forEach(b=>b.onclick=()=>send(b.dataset.msg));
  cta.querySelector('button').onclick=()=>{panel.hidden=true;launch.setAttribute('aria-expanded','false');if(!prefillQuote(latestState)){location.href='/#quote';}};

  const saved=localStorage.getItem('pristine_quote_prefill');
  if(saved){try{const state=JSON.parse(saved);if(prefillQuote(state))localStorage.removeItem('pristine_quote_prefill')}catch(e){localStorage.removeItem('pristine_quote_prefill')}}

  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(Recognition){const r=new Recognition();r.lang='en-GB';r.interimResults=false;r.maxAlternatives=1;voice.onclick=()=>r.start();r.onresult=e=>send(e.results[0][0].transcript);r.onerror=()=>add('Voice input was not available. Please type your message.','bot')}else voice.hidden=true;
})();
