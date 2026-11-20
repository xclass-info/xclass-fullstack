// src/components/TellUsWhatYouNeed.jsx
// Full page version of "On-demand Learning" (formerly "Tell us what you
// need") - a free-text (+ optional photo) request that gets emailed
// straight to the team, for visitors who don't want to browse
// Projects/Research/1-1 themselves.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";

const MAX_IMAGE_MB = 5;

export default function TellUsWhatYouNeed() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", details: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors({ ...errors, image: "Please attach an image file." });
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setErrors({ ...errors, image: `Image must be under ${MAX_IMAGE_MB}MB.` });
      return;
    }
    setErrors({ ...errors, image: "" });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.details.trim()) e.details = "Please describe what you need";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      // Emailed to the team inbox; an attached image is stored and linked
      // in the email.
      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("details", form.details.trim());
      if (imageFile) data.append("image", imageFile);
      await api.post("/on-demand-request", data);
      setDone(true);
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = (hasError) => ({
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${hasError ? "#a01f13" : "#ddd"}`,
    marginBottom: 4,
    boxSizing: "border-box",
    fontSize: 15,
    fontFamily: "inherit",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div
        style={{ maxWidth: 600, margin: "0 auto", padding: "120px 24px 80px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className='section-label'>
            On-demand Learning
          </div>
          <h1 className="page-title">Not sure where to start?</h1>
          <p className="page-sub">
            Describe what you need help with - even attach a photo of your
            homework or project - and we'll point you in the right
            direction.
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 40,
            border: "1px solid var(--border)",
          }}
        >
          {done ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <p style={{ fontSize: 48 }}>✅</p>
              <h3>Got it!</h3>
              <p style={{ color: "#888", marginBottom: 20 }}>
                We'll follow up at {form.email} to help find the right fit.
              </p>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "12px 28px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2f6175",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back to Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "#555",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Your Name
              </label>
              <input
                placeholder="Your name"
                name="name"
                value={form.name}
                onChange={handleChange}
                style={inputStyle(errors.name)}
              />
              {errors.name && (
                <p style={{ color: "#a01f13", fontSize: 12, margin: "0 0 12px" }}>
                  {errors.name}
                </p>
              )}

              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "#555",
                  fontWeight: 600,
                  margin: "12px 0 6px",
                }}
              >
                Your Email
              </label>
              <input
                placeholder="Your email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                style={inputStyle(errors.email)}
              />
              {errors.email && (
                <p style={{ color: "#a01f13", fontSize: 12, margin: "0 0 12px" }}>
                  {errors.email}
                </p>
              )}

              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "#555",
                  fontWeight: 600,
                  margin: "12px 0 6px",
                }}
              >
                What do you need help with?
              </label>
              <textarea
                placeholder="A project idea, homework help, exam prep, anything"
                name="details"
                value={form.details}
                onChange={handleChange}
                rows={7}
                style={{ ...inputStyle(errors.details), resize: "vertical" }}
              />
              {errors.details && (
                <p style={{ color: "#a01f13", fontSize: 12, margin: "0 0 12px" }}>
                  {errors.details}
                </p>
              )}

              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "#555",
                  fontWeight: 600,
                  margin: "12px 0 6px",
                }}
              >
                Attach an image (optional) - a photo of homework, a project,
                etc.
              </label>
              {imagePreview ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Attachment preview"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      background: "none",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      padding: "8px 14px",
                      fontSize: 13,
                      cursor: "pointer",
                      color: "#a01f13",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ marginBottom: 12, fontSize: 14 }}
                />
              )}
              {errors.image && (
                <p style={{ color: "#a01f13", fontSize: 12, margin: "0 0 12px" }}>
                  {errors.image}
                </p>
              )}

              {submitError && (
                <p style={{ color: "#a01f13", fontSize: 13, margin: "12px 0" }}>
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: 14,
                  marginTop: 12,
                  borderRadius: 8,
                  border: "none",
                  background: "#2f6175",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
