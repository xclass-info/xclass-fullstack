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

  function scrollTo(id) {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
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
      <Link to='/' className={styles.logo}>
        <svg
          width='34'
          height='34'
          viewBox='0 0 100 100'
          className={styles.logoMark}
          aria-hidden='true'
        >
          <rect width='100' height='100' rx='22' fill='#2f6175' />
          <path
            d='M78,15 L80,20 L85,22 L80,24 L78,29 L76,24 L71,22 L76,20 Z'
            fill='#ffffff'
          />
          <path
            d='M43,17 L57,17 L57,37 L71,78 C72.5,83 69,87 63,87 L37,87 C31,87 27.5,83 29,78 L43,37 Z'
            fill='none'
            stroke='#9a772b'
            strokeWidth='6'
            strokeLinejoin='round'
          />
          <path
            d='M33.5,68 L29,78 C27.5,83 31,87 37,87 L63,87 C69,87 72.5,83 71,78 L66.5,68 Z'
            fill='#ffffff'
          />
          <circle cx='46' cy='76' r='3' fill='#9a772b' />
          <circle cx='56' cy='80' r='2.3' fill='#9a772b' />
          <circle cx='50' cy='71' r='2' fill='#9a772b' />
        </svg>
        happy<span className={styles.logoClass}>Research</span>
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
          <button
            className={styles.teacherBtn}
            onClick={handleStudentLogout}
            style={{ cursor: "pointer" }}
          >
            Logout
          </button>
        ) : (
          <>
            <div className={styles.dropdown}>
              <span className={`${styles.teacherBtn} ${styles.dropdownTrigger}`}>
                Log in <span className={styles.dropdownCaret}>▾</span>
              </span>
              <div className={`${styles.dropdownMenu} ${styles.dropdownMenuRight}`}>
                <div className={styles.dropdownMenuInner}>
                  <Link to='/student/login'>Student login</Link>
                  <Link to='/teacher/login'>Mentor login</Link>
                </div>
              </div>
            </div>
            <Link to='/student/register' className={styles.cta}>
              Apply Now
            </Link>
          </>
        )}
      </div>

      {/* Hamburger button */}
      <button className={styles.hamburger} onClick={() => setOpen(!open)}>
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
            <a onClick={() => scrollTo("tutors")} style={{ cursor: "pointer" }}>
              Mentor
            </a>
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
                  Apply Now
                </Link>
              </li>
            </>
          )}
        </ul>
      )}
    </nav>
  );
}
