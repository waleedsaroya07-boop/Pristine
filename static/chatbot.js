(() => {
  const host = document.querySelector('[data-pristine-chatbot-host]');
  if (!host || host.dataset.ready === '1') return;
  host.dataset.ready = '1';
  const copy = {
    greeting: 'Welcome to Pristine Apparel wholesale. Which range are you looking at – Astra (premium), Medium, or Workwear?',
    buyer: 'What type of buyer are you – club/academy, school/education, retailer/reseller, private-label brand, or business/workwear buyer?',
    product: 'Which product or style do you need – for example football kits, training wear, tracksuits/jackets, custom apparel, or workwear/uniform?',
    colour: 'What colour or colourway do you require?',
    fabric: 'What fabric do you prefer, or what is the intended use? Exact composition and fabric weight are confirmed per order.',
    size: 'What size ratio or size breakdown do you need?',
    branding: 'What branding method do you want – embroidery, print, sublimation, woven labels, or another method?',
    certs: "Does the order require any specific certification, safety standard or compliance requirement? If none, say 'none specified'.",
    timeline: 'What is your target delivery date or required timeline?',
    complete: 'Your core specification is complete. Please use the enquiry form below so the wholesale team can review it and prepare a quotation.',
    price: "Wholesale pricing is quotation-based. I won't invent a price. Pricing is confirmed after the product, range, quantity, fabric, branding, required standards and destination are reviewed.",
    lead: "Lead time is confirmed against the actual product, quantity, material, branding, approvals and delivery requirement. I won't give an unverified production or delivery time.",
    certification: 'No certification is assumed to apply automatically. Tell us the exact standard required so it can be verified for the specific order before quotation or production commitment.',
    moq: 'Current minimums are Astra 50, Medium 150, and Workwear / Workmon 200 pieces per style/colour. These are minimums only; larger quantities can be quoted.',
    made: 'Pristine Apparel is UK-facing, with production facilities in Pakistan, using a specification-first wholesale process.'
  };
  const state = {stage:'range',range:null,buyer:null,product:null,quantity:null,colour:null,fabric:null,size:null,branding:null,certifications:null,timeline:null};
  const moq = {astra:50,medium:150,workwear:200};
  const labels = {astra:'Astra',medium:'Medium',workwear:'Workwear / Workmon'};
  const transcript = [];
  const root = document.createElement('div');
  root.className = 'pa-chat-root';
  root.innerHTML = '<button class="pa-chat-launch" type="button" aria-expanded="false">Trade Enquiry</button><section class="pa-chat-panel" hidden aria-label="Pristine Apparel wholesale assistant"><header class="pa-chat-header"><div><strong>Pristine Apparel</strong><span>Wholesale Assistant</span></div><button class="pa-chat-close" type="button" aria-label="Close chat">×</button></header><div class="pa-chat-messages" aria-live="polite"></div><div class="pa-chat-quick"><button type="button" data-range="astra">Astra</button><button type="button" data-range="medium">Medium</button><button type="button" data-range="workwear">Workwear</button><button type="button" class="pa-chat-voice" aria-label="Speak message">🎙</button></div><form class="pa-chat-form"><input class="pa-chat-input" aria-label="Message" autocomplete="off" placeholder="Tell us what you need…" required><button type="submit">Send</button></form><small>Quote-first wholesale assistance. Prices, lead times, fabric weights and certifications are confirmed per order.</small></section>';
  document.body.appendChild(root);
  const launch=root.querySelector('.pa-chat-launch'),panel=root.querySelector('.pa-chat-panel'),close=root.querySelector('.pa-chat-close'),messages=root.querySelector('.pa-chat-messages'),form=root.querySelector('.pa-chat-form'),input=root.querySelector('.pa-chat-input'),voice=root.querySelector('.pa-chat-voice');
  const lead=host.querySelector('.pa-chat-lead');
  if (lead) panel.insertBefore(lead, panel.querySelector('small'));
  function add(text,role){const el=document.createElement('div');el.className='pa-chat-message '+role;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;transcript.push((role==='user'?'Buyer':'Assistant')+': '+text)}
  function rangeFrom(text){const t=text.toLowerCase();if(t.includes('astra')||t.includes('premium'))return'astra';if(t.includes('medium')||t.includes('mid premium')||t.includes('mid-premium'))return'medium';if(t.includes('workwear')||t.includes('workmon')||t.includes('uniform'))return'workwear';return null}
  function policy(text){const t=text.toLowerCase();if(['price','cost','how much','per piece','unit price'].some(x=>t.includes(x)))return copy.price;if(['lead time','delivery time','how long','production time'].some(x=>t.includes(x)))return copy.lead;if(['certification','certified','certificate','iso'].some(x=>t.includes(x)))return copy.certification;if(t.includes('moq')||t.includes('minimum order'))return copy.moq;if(['where made','where manufactured','factory','pakistan','uk-facing','uk facing'].some(x=>t.includes(x)))return copy.made;return null}
  function q(){if(state.stage==='range')return copy.greeting;if(state.stage==='buyer')return copy.buyer;if(state.stage==='product')return copy.product;if(state.stage==='quantity')return 'How many pieces do you need per style and colour? '+labels[state.range]+' starts from '+moq[state.range]+' pieces per style/colour.';if(state.stage==='colour')return copy.colour;if(state.stage==='fabric')return copy.fabric;if(state.stage==='size')return copy.size;if(state.stage==='branding')return copy.branding;if(state.stage==='certifications')return copy.certs;if(state.stage==='timeline')return copy.timeline;return copy.complete}
  function setBrief(){const brief=host.querySelector('[name="contact[body]"]');if(!brief)return;brief.value=['Pristine Apparel chatbot wholesale enquiry','Range: '+(labels[state.range]||''),'Buyer type: '+(state.buyer||''),'Product/style: '+(state.product||''),'Quantity per style/colour: '+(state.quantity||''),'Colour: '+(state.colour||''),'Fabric preference/intended use: '+(state.fabric||''),'Size ratio: '+(state.size||''),'Branding method: '+(state.branding||''),'Required certifications/standards: '+(state.certifications||''),'Target delivery timing: '+(state.timeline||''),'','Chat transcript:',transcript.join('\n')].join('\n')}
  function advance(text){const safe=policy(text);if(safe){add(safe+' '+q(),'bot');return}if(state.stage==='range'){const r=rangeFrom(text);if(!r){add('Please choose Astra (premium), Medium, or Workwear.','bot');return}state.range=r;state.stage='buyer'}else if(state.stage==='buyer'){state.buyer=text;state.stage='product'}else if(state.stage==='product'){state.product=text;state.stage='quantity'}else if(state.stage==='quantity'){const found=(text.replace(/,/g,'').match(/\b\d{2,7}\b/)||[])[0];if(!found){add('Please enter the number of pieces required per style and colour.','bot');return}state.quantity=parseInt(found,10);if(state.quantity<moq[state.range]){add(labels[state.range]+' has a minimum of '+moq[state.range]+' pieces per style/colour. Please increase the quantity or choose another range.','bot');return}state.stage='colour'}else if(state.stage==='colour'){state.colour=text;state.stage='fabric'}else if(state.stage==='fabric'){state.fabric=text;state.stage='size'}else if(state.stage==='size'){state.size=text;state.stage='branding'}else if(state.stage==='branding'){state.branding=text;state.stage='certifications'}else if(state.stage==='certifications'){state.certifications=text;state.stage='timeline'}else if(state.stage==='timeline'){state.timeline=text;state.stage='complete';setBrief();if(lead)lead.hidden=false;add(copy.complete,'bot');return}add(q(),'bot')}
  function send(text){const value=String(text||'').trim();if(!value)return;add(value,'user');input.value='';advance(value)}
  launch.onclick=()=>{const opening=panel.hidden;panel.hidden=!opening;launch.setAttribute('aria-expanded',String(opening));if(opening&&!messages.children.length){add(copy.greeting,'bot');input.focus()}};
  close.onclick=()=>{panel.hidden=true;launch.setAttribute('aria-expanded','false')};
  form.onsubmit=e=>{e.preventDefault();send(input.value)};
  root.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>send(b.textContent));
  const leadForm=host.querySelector('.pa-chat-lead-form');if(leadForm)leadForm.addEventListener('submit',setBrief);
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(Recognition){const r=new Recognition();r.lang='en-GB';r.interimResults=false;r.maxAlternatives=1;voice.onclick=()=>r.start();r.onresult=e=>send(e.results[0][0].transcript);r.onerror=()=>add('Voice input was not available. Please type your message.','bot')}else voice.hidden=true;
})();