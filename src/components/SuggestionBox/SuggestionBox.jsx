import { useState } from 'react';
import emailjs from '@emailjs/browser';
import './SuggestionBox.css';

const SuggestionBox = () => {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const sendSuggestion = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    emailjs.send(
      'service_16ztpcp',     // Replace with your EmailJS service ID
      'template_0xxxcey',    // Replace with your template ID
      { message },           // Template parameters
      'KhI0JKyZp3USPmgJM'      // Replace with your EmailJS public key
    ).then(() => {
      setStatus('✅ Suggestion sent! Thank you!');
      setMessage('');
    }).catch(() => {
      setStatus('❌ Error sending suggestion. Try again later.');
    });
  };

  return (
    <footer className="suggestion-footer">
      <h4>💬 Got feedback or ideas?</h4>
      <form onSubmit={sendSuggestion}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your suggestion..."
          rows="3"
        />
        <button type="submit">Send</button>
        {status && <p className="status-message">{status}</p>}
      </form>
    </footer>
  );
};

export default SuggestionBox;
