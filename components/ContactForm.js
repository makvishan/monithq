import { useState } from 'react';

export default function ContactForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed.');
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (submitted) {
    return <div className="text-green-600 font-semibold">Thank you! We'll be in touch soon.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center w-full gap-2">
      <div className="flex w-full max-w-md gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email address"
          className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
          required
        />
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all whitespace-nowrap"
        >
          Submit
        </button>
      </div>
      {error && <div className="text-red-500 text-sm w-full max-w-md text-left">{error}</div>}
    </form>
  );
}
