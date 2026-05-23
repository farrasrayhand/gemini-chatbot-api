// Chat Toggle
const toggleBtn = document.getElementById('chat-toggle-button');
const chatContainer = document.getElementById('chat-container');

toggleBtn.addEventListener('click', () => {
  chatContainer.classList.toggle('open');
});

// Chat Logic
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const conversation = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  conversation.push({ role: 'user', text: userMessage });
  appendMessage('user', userMessage);
  input.value = '';

  input.disabled = true;
  form.querySelector('button').disabled = true;

  const typingId = showTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${res.status}`);
    }

    const data = await res.json();
    const botReply = data.result;

    conversation.push({ role: 'model', text: botReply });
    removeTypingIndicator(typingId);
    appendMessage('bot', botReply);

  } catch (err) {
    removeTypingIndicator(typingId);
    appendMessage('bot', '⚠️ Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    console.error('Chat error:', err);
  } finally {
    input.disabled = false;
    form.querySelector('button').disabled = false;
    input.focus();
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  const content = document.createElement('div');
  content.classList.add('msg-content');
  content.textContent = text;
  msg.appendChild(content);

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const div = document.createElement('div');
  div.classList.add('message', 'bot');
  div.id = 'typing-' + Date.now();

  const indicator = document.createElement('div');
  indicator.classList.add('typing-indicator');
  indicator.innerHTML = '<span></span><span></span><span></span>';
  div.appendChild(indicator);

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div.id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});
