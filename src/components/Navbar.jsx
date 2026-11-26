import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, logout } from "../auth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(null);

  // Mentors are logged-in users too, so a student is someone with a
  // students record.
  useEffect(
    () =>
      onAuthStateChanged((user) =>
        setStudent(user?.student ? { name: user.student.name } : null),
      ),
    [],
  );

  function handleStudentLogout() {
    logout();
    setStudent(null);
    navigate("/");
  }

  function scrollToTop() {
    if (location.pathname !== "/") {
      navigate("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <Link to='/' className={styles.logo} aria-label='HappyResearch home'>
        happyresearch<span className={styles.logoDot}>.</span>
      </Link>

      <ul className={styles.links}>
        <li className={styles.dropdown}>
          <span className={styles.dropdownTrigger}>
            Programs <span className={styles.dropdownCaret}>▾</span>
          </span>
          <div className={styles.dropdownMenu}>
            <div className={styles.dropdownMenuInner}>
              <Link to='/projects'>Projects</Link>
              <Link to='/research'>Research</Link>
              <Link to='/tutors'>1-on-1 Learning</Link>
              <Link to='/tell-us-what-you-need'>On-demand Learning</Link>
            </div>
          </div>
        </li>
        <li>
          <Link to='/showcase'>Student Work</Link>
        </li>
        <li>
          <Link to='/tutors'>Mentors</Link>
        </li>
        <li>
          <Link to='/gallery'>Gallery</Link>
        </li>
        <li>
          <Link to='/about'>About</Link>
        </li>
        <li>
          <Link to='/contact'>Contact</Link>
        </li>
      </ul>

      {/* Desktop right side buttons */}
      <div className={styles.navRight}>
        {student ? (
          <>
            <button
              className={styles.teacherBtn}
              onClick={handleStudentLogout}
              style={{ cursor: "pointer" }}
            >
              Log out
            </button>
            <Link to='/student/dashboard' className={styles.cta}>
              My dashboard
            </Link>
          </>
        ) : (
          <>
            <div className={styles.dropdown}>
              <span
                className={`${styles.teacherBtn} ${styles.dropdownTrigger}`}
              >
                Log in <span className={styles.dropdownCaret}>▾</span>
              </span>
              <div
                className={`${styles.dropdownMenu} ${styles.dropdownMenuRight}`}
              >
                <div className={styles.dropdownMenuInner}>
                  <Link to='/student/login'>Student login</Link>
                  <Link to='/teacher/login'>Mentor login</Link>
                </div>
              </div>
            </div>
            <Link to='/student/register' className={styles.cta}>
              Apply now
            </Link>
          </>
        )}
      </div>

      {/* Hamburger button */}
      <button
        className={styles.hamburger}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Mobile menu */}
      {open && (
        <ul className={styles.mobileMenu} onClick={() => setOpen(false)}>
          <li>
            <a onClick={scrollToTop} style={{ cursor: "pointer" }}>
              Home
            </a>
          </li>
          <li>
            <p className={styles.mobileGroupLabel}>Programs</p>
          </li>
          <li>
            <Link to='/projects'>Projects</Link>
          </li>
          <li>
            <Link to='/research'>Research</Link>
          </li>
          <li>
            <Link to='/tutors'>1-on-1 Learning</Link>
          </li>
          <li>
            <Link to='/tell-us-what-you-need'>On-demand Learning</Link>
          </li>
          <li>
            <Link to='/showcase'>Student Work</Link>
          </li>

          <li>
            <Link to='/tutors'>Mentors</Link>
          </li>
          <li>
            <Link to='/gallery'>Gallery</Link>
          </li>
          <li>
            <Link to='/about'>About Us</Link>
          </li>
          <li>
            <Link to='/contact'>Contact</Link>
          </li>
          {student ? (
            <>
              <li>
                <Link to='/student/dashboard'>My Dashboard</Link>
              </li>
              <li>
                <a onClick={handleStudentLogout} style={{ cursor: "pointer" }}>
                  Logout
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to='/student/login'>Student Login</Link>
              </li>
              <li>
                <Link to='/teacher/login'>Mentor Login</Link>
              </li>
              <li>
                <Link to='/student/register' className={styles.cta}>
                  Apply now
                </Link>
              </li>
            </>
          )}
        </ul>
      )}
    </nav>
  );
}
