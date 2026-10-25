// src/components/MentorContinue.jsx
// Landing page for the "continue your application" email link: signs the
// applicant in with the link's token and takes them to their application.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { signInWith } from "../auth";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MentorContinue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }
    api
      .post("/mentor-application/continue", { token })
      .then((res) => {
        signInWith(res);
        navigate("/mentor/application", { replace: true });
      })
      .catch(() => setFailed(true));
  }, [token, navigate]);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "140px 24px 80px", textAlign: "center" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 40, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          {failed ? (
            <>
              <p style={{ fontSize: 48, margin: "0 0 8px" }}>⚠️</p>
              <h2 style={{ margin: "0 0 8px" }}>This link has expired</h2>
              <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                No problem - log in with the email and password you signed up
                with to continue your application. If your email isn't
                confirmed yet, the login page lets you resend the link.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <Link to='/teacher/login' style={{ padding: "12px 20px", borderRadius: 8, background: "#2f6175", color: "white", fontWeight: 700, textDecoration: "none" }}>
                  Mentor Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 40, margin: "0 0 8px" }}>⏳</p>
              <h2 style={{ margin: 0 }}>Opening your application...</h2>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
