import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { api } from "../api";

export default function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
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
      await api.post("/contact", {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setError(
        "Failed to send message. Please try again or email us directly.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div
        style={{ maxWidth: 600, margin: "0 auto", padding: "100px 24px 48px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 className="page-title">Contact us</h1>
          <p className="page-sub">
            Have questions? We'd love to hear from you!
          </p>
        </div>

        {/* Contact info */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 32,
            border: "1px solid var(--border)",
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, margin: "0 0 20px", fontSize: 16 }}>Get in Touch</h3>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 24 }}>📧</span>
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: "#aaa",
                  margin: "0 0 2px",
                  fontWeight: 600,
                }}
              >
                Email
              </p>
              <a
                href='mailto:happyprogramming.us@gmail.com'
                style={{ fontSize: 15, color: "#111111", fontWeight: 600 }}
              >
                happyprogramming.us@gmail.com
              </a>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 24 }}>📞</span>
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: "#aaa",
                  margin: "0 0 2px",
                  fontWeight: 600,
                }}
              >
                Phone
              </p>
              <a
                href='tel:+17033000061'
                style={{ fontSize: 15, color: "#111111", fontWeight: 600 }}
              >
                (703)-300-0061
              </a>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 24 }}>🌐</span>
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: "#aaa",
                  margin: "0 0 2px",
                  fontWeight: 600,
                }}
              >
                Website
              </p>
              <a
                href='https://happyresearch.org'
                style={{ fontSize: 15, color: "#111111", fontWeight: 600 }}
              >
                happyresearch.org
              </a>
            </div>
          </div>

          {/* WeChat QR Code */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "#555",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              💚 Scan to chat on WeChat
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src='/wechat-qr.jpg'
                alt='WeChat QR Code'
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 8,
                  border: "1px solid #eee",
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#888",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Scan this QR code with WeChat to add us and start a
                  conversation directly.
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp QR Code */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 24,
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "#555",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              💬 Scan to chat on WhatsApp
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src='/whatsapp-qr.jpg'
                alt='WhatsApp QR Code'
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 8,
                  border: "1px solid #eee",
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#888",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Scan this QR code with your phone camera to start a WhatsApp
                  conversation with us directly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 32,
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, margin: "0 0 20px", fontSize: 16 }}>
            Send us a Message
          </h3>

          {submitted ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
              <h3>Message Sent!</h3>
              <p style={{ color: "#888" }}>
                Thank you for reaching out. We'll get back to you soon!
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  marginTop: 16,
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#111111",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <p
                  style={{
                    color: "#a01f13",
                    fontSize: 13,
                    marginBottom: 16,
                    background: "#fee2e2",
                    padding: "10px 14px",
                    borderRadius: 8,
                  }}
                >
                  {error}
                </p>
              )}

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 13,
                    color: "#555",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Your Name *
                </label>
                <input
                  name='name'
                  value={form.name}
                  onChange={handleChange}
                  placeholder='Your full name'
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 13,
                    color: "#555",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Email *
                </label>
                <input
                  name='email'
                  type='email'
                  value={form.email}
                  onChange={handleChange}
                  placeholder='your@email.com'
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 13,
                    color: "#555",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Subject *
                </label>
                <input
                  name='subject'
                  value={form.subject}
                  onChange={handleChange}
                  placeholder='How can we help?'
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    fontSize: 13,
                    color: "#555",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Message *
                </label>
                <textarea
                  name='message'
                  value={form.message}
                  onChange={handleChange}
                  placeholder='Tell us more about your question or inquiry...'
                  rows={6}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 14,
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type='submit'
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  background: "#111111",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Sending..." : "Send Message 📬"}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
