// src/components/VerifyAccountEmail.jsx
// Landing page for the account-verification link emailed by the backend.
// Reads ?kind=student|teacher&uid=&token= from the URL and asks the backend
// to check the token and mark the account verified.
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";

const LOGIN_PATH = { student: "/student/login", teacher: "/teacher/login" };
const LOGIN_LABEL = { student: "Student Login", teacher: "Mentor Login" };

export default function VerifyAccountEmail() {
  const [searchParams] = useSearchParams();
  const kind = searchParams.get("kind");
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [status, setStatus] = useState("checking"); // checking | success | invalid | error

  useEffect(() => {
    async function run() {
      if (!LOGIN_PATH[kind] || !uid || !token) {
        setStatus("invalid");
        return;
      }
      try {
        const res = await api.post("/auth/verify-email", { kind, uid, token });
        setStatus(res.status);
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    run();
  }, [kind, uid, token]);

  const CARD = {
    background: "white",
    borderRadius: 16,
    padding: 40,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    textAlign: "center",
  };

  const loginPath = LOGIN_PATH[kind] || "/";
  const loginLabel = LOGIN_LABEL[kind] || "Login";

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
                Your account is now active. You can log in.
              </p>
              <Link
                to={loginPath}
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  borderRadius: 8,
                  background: "#111111",
                  color: "white",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {loginLabel} →
              </Link>
            </>
          )}
          {status === "invalid" && (
            <>
              <p style={{ fontSize: 48, marginBottom: 8 }}>⚠️</p>
              <h2 style={{ margin: "0 0 8px" }}>Link not valid</h2>
              <p style={{ color: "#666", fontSize: 14 }}>
                This verification link is invalid or has already been used.
                You can request a new one from the login page.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <p style={{ fontSize: 48, marginBottom: 8 }}>❌</p>
              <h2 style={{ margin: "0 0 8px" }}>Something went wrong</h2>
              <p style={{ color: "#666", fontSize: 14 }}>
                Please try again, or request a new link from the login page.
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
