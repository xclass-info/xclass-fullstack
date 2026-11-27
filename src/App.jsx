import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import {
  Strip,
  MentorStrip,
  Paths,
  StudentWork,
  ApplyBand,
} from "./components/HomeSections";
import Tutors from "./components/Tutors";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import BecomeMentor from "./components/BecomeMentor";
import MentorContinue from "./components/MentorContinue";
import MentorApplication from "./components/MentorApplication";
import MentorGuidelines from "./components/MentorGuidelines";
import TeacherLogin from "./components/TeacherLogin";
import TeacherDashboard from "./components/TeacherDashboard";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import AdminDashboard from "./components/AdminDashboard";
import TeacherProfile from "./components/TeacherProfile";
import ResearchListing from "./components/ResearchListing";
import ResearchDetail from "./components/ResearchDetail";
import ProjectListing from "./components/ProjectListing";
import ProjectDetail from "./components/ProjectDetail";
import ShowcaseListing from "./components/ShowcaseListing";
import ExploreResources from "./components/ExploreResources";
import TellUsWhatYouNeed from "./components/TellUsWhatYouNeed";
import VerifyMentorEmail from "./components/VerifyMentorEmail";
import VerifyAccountEmail from "./components/VerifyAccountEmail";
import ResetPassword from "./components/ResetPassword";
import StudentLogin from "./components/StudentLogin";
import StudentRegister from "./components/StudentRegister";
import StudentDashboard from "./components/StudentDashboard";
import ActiveEnrolling from "./components/ActiveEnrolling";
import FAQSection from "./components/FAQSection";

import ContactUs from "./components/ContactUs";
import AboutUs from "./components/AboutUs";
import Gallery from "./components/Gallery";

function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    const observeReveals = (root) => {
      root.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    };
    observeReveals(document);

    // Sections like Tutors/ResearchSection render their real .reveal cards
    // only after their own Firestore fetch resolves, which happens after
    // this initial scan - watch for those being added to the page too.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const { addedNodes } of mutations) {
        addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList?.contains("reveal")) observer.observe(node);
          observeReveals(node);
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <>
      <Navbar />
      <Hero />
      <Strip />
      <MentorStrip />
      <Paths />
      <ActiveEnrolling />
      <StudentWork />
      <Testimonials />
      <FAQSection />
      <ApplyBand />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/tutors' element={<Tutors />} />
        <Route path='/student/login' element={<StudentLogin />} />
        <Route path='/student/register' element={<StudentRegister />} />
        <Route path='/student/dashboard' element={<StudentDashboard />} />
        <Route
          path='/student/registrations'
          element={<Navigate to='/student/dashboard' replace />}
        />
        <Route path='/become-a-mentor' element={<BecomeMentor />} />
        <Route path='/mentor/continue' element={<MentorContinue />} />
        <Route path='/mentor/application' element={<MentorApplication />} />
        <Route path='/mentor/guidelines' element={<MentorGuidelines />} />
        <Route
          path='/teacher/register'
          element={<Navigate to='/become-a-mentor' replace />}
        />
        <Route path='/teacher/login' element={<TeacherLogin />} />
        <Route path='/teacher/dashboard' element={<TeacherDashboard />} />
        <Route path='/admin' element={<AdminDashboard />} />
        <Route path='/teacher/:teacherId' element={<TeacherProfile />} />
        <Route path='/research' element={<ResearchListing />} />
        <Route path='/research/:researchId' element={<ResearchDetail />} />
        <Route path='/projects' element={<ProjectListing />} />
        <Route path='/projects/:projectId' element={<ProjectDetail />} />
        <Route path='/showcase' element={<ShowcaseListing />} />
        <Route path='/explore' element={<ExploreResources />} />
        <Route path='/tell-us-what-you-need' element={<TellUsWhatYouNeed />} />
        <Route path='/verify-mentor-email' element={<VerifyMentorEmail />} />
        <Route path='/verify-account-email' element={<VerifyAccountEmail />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/about' element={<AboutUs />} />
        <Route path='/contact' element={<ContactUs />} />
        <Route path='/gallery' element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  );
}
