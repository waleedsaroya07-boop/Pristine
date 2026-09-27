(() => {
  const script = document.currentScript;
  const apiBase = (script && script.dataset.apiBase) || window.PRISTINE_CHATBOT_API || '';
  let sessionId = localStorage.getItem('pristine_chat_session') || '';
  let latestState = null;
  let voiceMode = false;
  let listening = false;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const host = document.querySelector('[data-pristine-chatbot-host]');
  const lead = host ? host.querySelector('.pa-chat-lead') : null;
  const leadForm = lead ? lead.querySelector('.pa-chat-lead-form') : null;
  const successNode = lead ? lead.querySelector('[data-pa-success]') : null;
  const postedSuccess = Boolean(successNode && successNode.dataset.paSuccess === 'true');

  const root = document.createElement('div');
  root.className = 'pa-chat-root';
  root.innerHTML = `
    <button class="pa-chat-launch" type="button" aria-expanded="false">Chat / Voice Enquiry</button>
    <section class="pa-chat-panel" hidden aria-label="Pristine Apparel wholesale assistant">
      <header class="pa-chat-header">
        <div><strong>Pristine Apparel</strong><span>Wholesale Assistant · Voice + Knowledge Hub</span></div>
        <button class="pa-chat-close" type="button" aria-label="Close chat">×</button>
      </header>
      <div class="pa-chat-messages" aria-live="polite"></div>
      <div class="pa-chat-quick">
        <button type="button" data-msg="Astra">Astra</button>
        <button type="button" data-msg="Medium">Medium</button>
        <button type="button" data-msg="Workwear">Workwear</button>
        <button type="button" class="pa-chat-voice" aria-label="Start voice chat">🎙 Voice chat</button>
      </div>
      <div class="pa-chat-voice-status" hidden aria-live="polite"></div>
      <div class="pa-chat-cta" hidden><button type="button">Continue to enquiry</button></div>
      <form class="pa-chat-form">
        <input class="pa-chat-input" aria-label="Message" autocomplete="off" placeholder="Ask about products, MOQs or your order…" required>
        <button type="submit">Send</button>
      </form>
      <small>Voice and typed answers use verified Pristine wholesale knowledge. Prices, lead times and certifications are confirmed per order.</small>
    </section>`;
  document.body.appendChild(root);

  const launch = root.querySelector('.pa-chat-launch');
  const panel = root.querySelector('.pa-chat-panel');
  const close = root.querySelector('.pa-chat-close');
  const messages = root.querySelector('.pa-chat-messages');
  const form = root.querySelector('.pa-chat-form');
  const input = root.querySelector('.pa-chat-input');
  const voice = root.querySelector('.pa-chat-voice');
  const voiceStatus = root.querySelector('.pa-chat-voice-status');
  const cta = root.querySelector('.pa-chat-cta');

  if (lead) panel.insertBefore(lead, form);

  function add(text, role, citations = []) {
    const item = document.createElement('div');
    item.className = `pa-chat-item ${role}`;
    const bubble = document.createElement('div');
    bubble.className = `pa-chat-message ${role}`;
    bubble.textContent = text;
    item.appendChild(bubble);

    if (role === 'bot' && Array.isArray(citations) && citations.length) {
      const sources = document.createElement('div');
      sources.className = 'pa-chat-citations';
      const label = document.createElement('span');
      label.textContent = 'Sources: ';
      sources.appendChild(label);
      citations.forEach((citation, index) => {
        const source = document.createElement('a');
        source.textContent = citation.title;
        source.href = citation.source_path || '#';
        if (location.hostname.endsWith('onrender.com')) source.removeAttribute('href');
        sources.appendChild(source);
        if (index < citations.length - 1) sources.appendChild(document.createTextNode(' · '));
      });
      item.appendChild(sources);
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function setVoiceStatus(text = '', active = false) {
    voiceStatus.hidden = !text;
    voiceStatus.textContent = text;
    voiceStatus.classList.toggle('active', active);
  }

  function summary(state) {
    return [
      'Chatbot-qualified wholesale enquiry',
      `Range: ${state.range || ''}`,
      `Buyer: ${state.buyer_type || ''}`,
      `Product/style: ${state.product || ''}`,
      `Quantity: ${state.quantity || ''} per style/colour`,
      `Colour: ${state.colour || ''}`,
      `Fabric preference: ${state.fabric_preference || ''}`,
      `Size ratio: ${state.size_ratio || ''}`,
      `Branding: ${state.branding_method || ''}`,
      `Required certifications/standards: ${state.required_certifications || ''}`,
      `Target timeline: ${state.delivery_timeline || ''}`,
      'Pricing, exact specification, lead time and certification applicability remain subject to quotation and confirmation.'
    ].join('\n');
  }

  function prepareLead(state) {
    if (!lead || !leadForm || !state) return false;
    const body = leadForm.querySelector('textarea[name="contact[body]"]');
    if (body) body.value = summary(state);
    lead.hidden = false;
    cta.hidden = true;
    form.hidden = true;
    lead.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return true;
  }

  function stopSpeech() {
    if (canSpeak) window.speechSynthesis.cancel();
  }

  function speak(text, onDone) {
    if (!voiceMode || !canSpeak) {
      if (typeof onDone === 'function') onDone();
      return;
    }

    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /^en-GB$/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setVoiceStatus('🔊 Speaking…', true);
    utterance.onend = () => {
      if (voiceMode) setVoiceStatus('🎙 Ready for your next question', true);
      if (typeof onDone === 'function') onDone();
    };
    utterance.onerror = () => {
      if (voiceMode) setVoiceStatus('🎙 Voice mode is on', true);
      if (typeof onDone === 'function') onDone();
    };

    window.speechSynthesis.speak(utterance);
  }

  let recognition = null;

  function resetVoiceButton() {
    if (voiceMode) {
      voice.textContent = listening ? '● Listening…' : '■ Stop voice';
      voice.classList.add('active');
      voice.setAttribute('aria-label', listening ? 'Listening for voice input' : 'Stop voice chat');
    } else {
      voice.textContent = '🎙 Voice chat';
      voice.classList.remove('active');
      voice.setAttribute('aria-label', 'Start voice chat');
    }
  }

  function stopVoiceMode() {
    voiceMode = false;
    listening = false;
    if (recognition) {
      try { recognition.stop(); } catch (_) {}
    }
    stopSpeech();
    setVoiceStatus('');
    resetVoiceButton();
  }

  function startListening() {
    if (!voiceMode || !recognition || listening) return;
    try {
      listening = true;
      resetVoiceButton();
      setVoiceStatus('🎙 Listening… speak now', true);
      recognition.start();
    } catch (_) {
      listening = false;
      resetVoiceButton();
    }
  }

  async function send(text, fromVoice = false) {
    const message = String(text || '').trim();
    if (!message) return;

    add(message, 'user');
    input.value = '';
    setVoiceStatus(fromVoice ? 'Thinking…' : '', fromVoice);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId || null, message })
      });
      if (!res.ok) throw new Error();

      const data = await res.json();
      sessionId = data.session_id;
      latestState = data.state;
      localStorage.setItem('pristine_chat_session', sessionId);
      add(data.reply, 'bot', data.citations || []);

      if (data.state && data.state.ready_for_quote) {
        localStorage.setItem('pristine_quote_prefill', JSON.stringify(data.state));
        cta.hidden = false;
      }

      if (voiceMode) {
        speak(data.reply, () => {
          if (voiceMode && recognition) startListening();
        });
      }
    } catch (_) {
      const errorText = 'The wholesale assistant is temporarily unavailable. Please use the website enquiry form.';
      add(errorText, 'bot');
      if (voiceMode) speak(errorText);
    }
  }

  if (Recognition) {
    recognition = new Recognition();
    recognition.lang = 'en-GB';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      listening = true;
      resetVoiceButton();
      setVoiceStatus('🎙 Listening… speak now', true);
    };

    recognition.onresult = event => {
      listening = false;
      resetVoiceButton();
      const transcript = event.results[0][0].transcript;
      setVoiceStatus(`Heard: “${transcript}”`, true);
      send(transcript, true);
    };

    recognition.onend = () => {
      listening = false;
      resetVoiceButton();
      if (voiceMode && !window.speechSynthesis?.speaking) {
        setVoiceStatus('🎙 Voice mode is on', true);
      }
    };

    recognition.onerror = event => {
      listening = false;
      resetVoiceButton();
      const denied = event && (event.error === 'not-allowed' || event.error === 'service-not-allowed');
      const msg = denied
        ? 'Microphone access is blocked. Allow microphone permission for this site, then tap Voice chat again.'
        : 'Voice input could not start. You can keep using the text chat or try Voice chat again.';
      add(msg, 'bot');
      setVoiceStatus(msg, false);
      if (denied) voiceMode = false;
      resetVoiceButton();
    };
  }

  voice.onclick = () => {
    if (voiceMode) {
      stopVoiceMode();
      add('Voice mode is off. You can continue by typing.', 'bot');
      return;
    }

    if (!Recognition) {
      const fallback = 'Voice input is not available in this browser. Open the storefront directly in Safari or Chrome, or use your phone keyboard microphone for dictation.';
      add(fallback, 'bot');
      setVoiceStatus(fallback, false);
      return;
    }

    voiceMode = true;
    resetVoiceButton();
    setVoiceStatus('🎙 Voice mode is on', true);
    startListening();
  };

  launch.onclick = () => {
    panel.hidden = !panel.hidden;
    launch.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden && !messages.children.length) {
      add('Welcome to Pristine Apparel wholesale. You can type, or tap Voice chat and speak. Which range are you looking at – Astra (premium), Medium, or Workwear?', 'bot');
      input.focus();
    }
  };

  close.onclick = () => {
    panel.hidden = true;
    launch.setAttribute('aria-expanded', 'false');
    stopVoiceMode();
  };

  form.onsubmit = event => {
    event.preventDefault();
    send(input.value, false);
  };

  root.querySelectorAll('[data-msg]').forEach(button => {
    button.onclick = () => send(button.dataset.msg, false);
  });

  cta.querySelector('button').onclick = () => prepareLead(latestState);

  const saved = localStorage.getItem('pristine_quote_prefill');
  if (saved) {
    try {
      latestState = JSON.parse(saved);
      cta.hidden = false;
    } catch (_) {
      localStorage.removeItem('pristine_quote_prefill');
    }
  }

  if (postedSuccess) {
    panel.hidden = false;
    launch.setAttribute('aria-expanded', 'true');
    form.hidden = true;
    cta.hidden = true;
    if (lead) lead.hidden = false;
    add('Thanks. Your wholesale enquiry has been sent for review.', 'bot');
    localStorage.removeItem('pristine_quote_prefill');
    localStorage.removeItem('pristine_chat_session');
  }

  resetVoiceButton();
})();
