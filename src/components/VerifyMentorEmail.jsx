// src/components/VerifyMentorEmail.jsx
// Landing page for the link sent to a mentor applicant's university email. Reads
// ?uid=&token= from the URL, and if they match what's on the teacher doc,
// marks the work email verified (checked by the backend).
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import StatusCard from "./StatusCard";

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
        const res = await api.post("/teachers/verify-work-email", {
          uid,
          token,
        });
        setStatus(res.status);
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    run();
  }, [uid, token]);

  const states = {
    checking: { icon: "wait", title: "Verifying..." },
    success: {
      icon: "ok",
      title: "Email verified!",
      text: "Your university email is confirmed. Head back to your application to finish the remaining steps.",
      action: "Back to my application",
      actionTo: "/mentor/application",
    },
    invalid: {
      icon: "warn",
      title: "Link not valid",
      text: "This verification link is invalid or has already been used. You can request a new one from the Credentials step of your application.",
      action: "Go to my application",
      actionTo: "/mentor/application",
    },
    error: {
      icon: "error",
      title: "Something went wrong",
      text: "Please try again, or request a new link from your application.",
      action: "Go to my application",
      actionTo: "/mentor/application",
    },
  };

  return <StatusCard label='Mentor application' {...states[status]} />;
}
