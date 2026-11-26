// src/components/ContactUs.jsx
// Contact page: email, phone and chat QR codes on the left, a message form
// on the right. The message is emailed to the team inbox.
import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { api } from "../api";
import styles from "./Enquiry.module.css";
import auth from "./TeacherAuth.module.css";

const EMPTY = { name: "", email: "", subject: "", message: "" };

export function DoneIcon() {
  return (
    <div className={auth.doneIcon} aria-hidden='true'>
      <svg
        width='26'
        height='26'
        viewBox='0 0 24 24'
        fill='none'
        stroke='#22372c'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M5 12.5l4.5 4.5L19 7.5' />
      </svg>
    </div>
  );
}

export default function ContactUs() {
  const [form, setForm] = useState(EMPTY);
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Emailed to the team inbox; replying goes straight to the sender.
      await api.post("/contact", form);
      setSentTo(form.email);
      setForm(EMPTY);
    } catch (err) {
      console.error(err);
      setError(
        "Your message didn't send. Please try again, or email us at happyprogramming.us@gmail.com.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <header className={`${styles.wrap} ${styles.hero}`}>
        <p className='section-label'>Contact</p>
        <h1 className={styles.h1}>Talk to a real person.</h1>
        <p className={styles.sub}>
          Questions about programs, mentors or whether this is right for your
          student? Write to us, call, or message us on WeChat or WhatsApp.
        </p>
      </header>

      <div className={`${styles.wrap} ${styles.body}`}>
        <div className={styles.info}>
          <ul className={styles.rows}>
            <li>
              <a
                href='mailto:happyprogramming.us@gmail.com'
                className={styles.rowLink}
              >
                <span className={styles.rowLabel}>Email</span>
                <span className={styles.rowValue}>
                  happyprogramming.us@gmail.com
                </span>
              </a>
            </li>
            <li>
              <a href='tel:+17033000061' className={styles.rowLink}>
                <span className={styles.rowLabel}>Phone</span>
                <span className={styles.rowValue}>(703) 300-0061</span>
              </a>
            </li>
          </ul>

          <p className={styles.infoTitle}>Chat with us</p>
          <div className={styles.qrs}>
            <div className={styles.qr}>
              <img src='/wechat-qr.jpg' alt='WeChat QR code' />
              <div>
                <p className={styles.qrName}>WeChat</p>
                <p className={styles.qrText}>Scan with WeChat to add us.</p>
              </div>
            </div>
            <div className={styles.qr}>
              <img src='/whatsapp-qr.jpg' alt='WhatsApp QR code' />
              <div>
                <p className={styles.qrName}>WhatsApp</p>
                <p className={styles.qrText}>
                  Scan with your phone camera to start a chat.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          {sentTo ? (
            <div role='status'>
              <DoneIcon />
              <h2 className={styles.cardTitle}>Message sent.</h2>
              <p className={auth.bodyText}>
                Thanks for reaching out. We'll reply to{" "}
                <strong>{sentTo}</strong>.
              </p>
              <button
                type='button'
                className='btn-ghost'
                onClick={() => setSentTo("")}
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              <h2 className={styles.cardTitle}>Send us a message.</h2>
              <form onSubmit={handleSubmit} className={auth.form}>
                {error && <p className={auth.error}>{error}</p>}
                <div className={auth.row}>
                  <div className={auth.field}>
                    <label className={auth.label} htmlFor='c-name'>
                      Your name
                    </label>
                    <input
                      id='c-name'
                      name='name'
                      className={auth.input}
                      value={form.name}
                      onChange={handleChange}
                      autoComplete='name'
                      required
                    />
                  </div>
                  <div className={auth.field}>
                    <label className={auth.label} htmlFor='c-email'>
                      Email
                    </label>
                    <input
                      id='c-email'
                      name='email'
                      type='email'
                      className={auth.input}
                      value={form.email}
                      onChange={handleChange}
                      autoComplete='email'
                      required
                    />
                  </div>
                </div>
                <div className={auth.field}>
                  <label className={auth.label} htmlFor='c-subject'>
                    Subject
                  </label>
                  <input
                    id='c-subject'
                    name='subject'
                    className={auth.input}
                    value={form.subject}
                    onChange={handleChange}
                    placeholder='How can we help?'
                    required
                  />
                </div>
                <div className={auth.field}>
                  <label className={auth.label} htmlFor='c-message'>
                    Message
                  </label>
                  <textarea
                    id='c-message'
                    name='message'
                    className={`${auth.input} ${auth.textarea}`}
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    required
                  />
                </div>
                <button type='submit' className={auth.btn} disabled={loading}>
                  {loading ? "Sending..." : "Send message →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
