// src/components/VerifyAccountEmail.jsx
// Landing page for the account-verification link emailed by the backend.
// Reads ?kind=student|teacher&uid=&token= from the URL and asks the backend
// to check the token and mark the account verified.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import StatusCard from "./StatusCard";

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

  const loginPath = LOGIN_PATH[kind] || "/";
  const loginLabel = LOGIN_LABEL[kind] || "Log in";

  const states = {
    checking: { icon: "wait", title: "Verifying..." },
    success: {
      icon: "ok",
      title: "Email verified!",
      text: "Your account is now active. You can log in.",
      action: loginLabel,
      actionTo: loginPath,
    },
    invalid: {
      icon: "warn",
      title: "Link not valid",
      text: "This verification link is invalid or has already been used. You can request a new one from the login page.",
      action: "Go to login",
      actionTo: loginPath,
    },
    error: {
      icon: "error",
      title: "Something went wrong",
      text: "Please try again, or request a new link from the login page.",
      action: "Go to login",
      actionTo: loginPath,
    },
  };

  return <StatusCard label='Account' {...states[status]} />;
}
