// src/components/VerifyMentorEmail.jsx
// Landing page for the link sent to a mentor applicant's university email. Reads
// ?uid=&token= from the URL, and if they match what's on the teacher doc,
// marks the work email verified (checked by the backend).
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function VerifyMentorEmail() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [status, setStatus] = useState("checking"); // checking | success | invalid | error

  useEffect(() => {
    async function run() {
      if (!uid || !token) {
        setStatus("invalid");
        return;
      }
      try {
        const res = await api.post("/teachers/verify-work-email", { uid, token });
        setStatus(res.status);
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    run();
  }, [uid, token]);

  const CARD = {
    background: "white",
    borderRadius: 16,
    padding: 40,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    textAlign: "center",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "140px 24px 80px" }}>
        <div style={CARD}>
          {status === "checking" && (
            <>
              <p style={{ fontSize: 40, marginBottom: 8 }}>⏳</p>
              <h2 style={{ margin: "0 0 8px" }}>Verifying...</h2>
            </>
          )}
          {status === "success" && (
            <>
              <p style={{ fontSize: 48, marginBottom: 8 }}>✅</p>
              <h2 style={{ margin: "0 0 8px" }}>Email verified!</h2>
              <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
                Your university email is confirmed. Head back to your
                application to finish the remaining steps.
              </p>
              <Link
                to='/mentor/application'
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  borderRadius: 8,
                  background: "#22372c",
                  color: "white",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Back to my application →
              </Link>
            </>
          )}
          {status === "invalid" && (
            <>
              <p style={{ fontSize: 48, marginBottom: 8 }}>⚠️</p>
              <h2 style={{ margin: "0 0 8px" }}>Link not valid</h2>
              <p style={{ color: "#666", fontSize: 14 }}>
                This verification link is invalid or has already been used.
                You can request a new one from the Credentials step of your
                application.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <p style={{ fontSize: 48, marginBottom: 8 }}>❌</p>
              <h2 style={{ margin: "0 0 8px" }}>Something went wrong</h2>
              <p style={{ color: "#666", fontSize: 14 }}>
                Please try again, or request a new link from your application.
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
