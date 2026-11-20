import { useState, useEffect, useRef } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const photos = [
  { url: "/gallery/3.jpg", caption: "Lab session" },
  { url: "/gallery/4.jpg", caption: "Lab session" },
  { url: "/gallery/5.jpg", caption: "Lab session" },
  { url: "/gallery/6.jpg", caption: "Lab session" },
  { url: "/gallery/7.jpg", caption: "Lab session" },
  { url: "/gallery/8.jpg", caption: "Lab session" },
  { url: "/gallery/9.jpg", caption: "Lab session" },
  { url: "/gallery/10.jpg", caption: "Lab session" },
  { url: "/gallery/11.jpg", caption: "Lab session" },
  { url: "/gallery/12.jpg", caption: "Lab session" },
  { url: "/gallery/13.jpg", caption: "Lab session" },
  { url: "/gallery/14.jpg", caption: "Lab session" },
  { url: "/gallery/15.jpg", caption: "Lab session" },
  { url: "/gallery/16.jpg", caption: "Lab session" },
  { url: "/gallery/17.jpg", caption: "Lab session" },
  { url: "/gallery/18.jpg", caption: "Lab session" },
  { url: "/gallery/20.jpg", caption: "Lab session" },
  { url: "/gallery/21.jpg", caption: "Lab session" },
  { url: "/gallery/24.jpg", caption: "Lab session" },
  { url: "/gallery/25.jpg", caption: "Lab session" },
  { url: "/gallery/28.jpg", caption: "Lab session" },
  { url: "/gallery/29.jpg", caption: "Lab session" },
  { url: "/gallery/31.jpg", caption: "Lab session" },
  { url: "/gallery/33.jpg", caption: "Lab session" },
  { url: "/gallery/35.jpg", caption: "Lab session" },
  { url: "/gallery/36.jpg", caption: "Lab session" },
  { url: "/gallery/37.jpg", caption: "Lab session" },
  { url: "/gallery/38.jpg", caption: "Lab session" },
  { url: "/gallery/39.jpg", caption: "Lab session" },
  { url: "/gallery/40.jpg", caption: "Lab session" },
  { url: "/gallery/41.jpg", caption: "Lab session" },
  { url: "/gallery/42.jpg", caption: "Lab session" },
  { url: "/gallery/43.jpg", caption: "Lab session" },
  { url: "/gallery/44.jpg", caption: "Lab session" },
  { url: "/gallery/46.jpg", caption: "Lab session" },
  { url: "/gallery/47.jpg", caption: "Lab session" },
  { url: "/gallery/48.jpg", caption: "Lab session" },
  { url: "/gallery/49.jpg", caption: "Lab session" },
  { url: "/gallery/50.jpg", caption: "Lab session" },
  { url: "/gallery/51.jpg", caption: "Lab session" },
  { url: "/gallery/52.jpg", caption: "Lab session" },
  { url: "/gallery/54.jpg", caption: "Lab session" },
  { url: "/gallery/55.jpg", caption: "Lab session" },
  { url: "/gallery/56.jpg", caption: "Lab session" },
  { url: "/gallery/57.jpg", caption: "Lab session" },
  { url: "/gallery/58.jpg", caption: "Lab session" },
  { url: "/gallery/60.jpg", caption: "Lab session" },
  { url: "/gallery/61.jpg", caption: "Lab session" },
  { url: "/gallery/62.jpg", caption: "Lab session" },
  { url: "/gallery/64.jpg", caption: "Lab session" },
  { url: "/gallery/65.jpg", caption: "Lab session" },
  { url: "/gallery/66.jpg", caption: "Lab session" },
  { url: "/gallery/67.jpg", caption: "Lab session" },
  { url: "/gallery/68.jpg", caption: "Lab session" },
  { url: "/gallery/69.jpg", caption: "Lab session" },
  { url: "/gallery/70.jpg", caption: "Lab session" },
  { url: "/gallery/71.jpg", caption: "Lab session" },
  { url: "/gallery/75.jpg", caption: "Lab session" },
  { url: "/gallery/76.jpg", caption: "Lab session" },
  { url: "/gallery/78.jpg", caption: "Lab session" },
  { url: "/gallery/79.jpg", caption: "Lab session" },
  { url: "/gallery/80.jpg", caption: "Lab session" },
  { url: "/gallery/85.jpg", caption: "Lab session" },
  { url: "/gallery/86.png", caption: "Lab session" },
  { url: "/gallery/88.png", caption: "Lab session" },
  { url: "/gallery/89.png", caption: "Lab session" },
  { url: "/gallery/90.jpg", caption: "Lab session" },
  { url: "/gallery/91.png", caption: "Lab session" },
];

const videos = [
  {
    url: "https://www.youtube.com/embed/G1IM1_tz-qQ",
    caption: "Introduction to HappyResearch",
  },
];

function PhotoCarousel({ photos, onPhotoClick }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);
  const perPage = 6; // ← 2 rows × 3 columns
  const totalPages = Math.ceil(photos.length / perPage);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [totalPages]);

  function goTo(index) {
    setCurrent(index);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % totalPages);
    }, 5000);
  }

  function prev() {
    goTo((current - 1 + totalPages) % totalPages);
  }

  function next() {
    goTo((current + 1) % totalPages);
  }

  if (photos.length === 0) return null;

  return (
    <div>
      {/* Sliding container */}
      <div style={{ overflow: "hidden", borderRadius: 16 }}>
        <div
          style={{
            display: "flex",
            transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div
              key={pageIndex}
              style={{
                minWidth: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(2, 1fr)", // ← 2 rows
                gap: 16,
                padding: "4px",
              }}
            >
              {photos
                .slice(pageIndex * perPage, pageIndex * perPage + perPage)
                .map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => onPhotoClick(photo)}
                    style={{
                      position: "relative",
                      cursor: "pointer",
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                      transition: "transform 0.3s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-4px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      style={{
                        width: "100%",
                        height: 240,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {photo.caption && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background:
                            "linear-gradient(transparent, rgba(0,0,0,0.6))",
                          padding: "24px 12px 10px",
                          color: "white",
                          fontSize: 13,
                        }}
                      >
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginTop: 16,
        }}
      >
        <button
          onClick={prev}
          style={{
            background: "#f0f4ff",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2f6175",
            fontWeight: 700,
          }}
        >
          ‹
        </button>

        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              style={{
                width: index === current ? 20 : 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                background: index === current ? "#2f6175" : "#ddd",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          style={{
            background: "#f0f4ff",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2f6175",
            fontWeight: 700,
          }}
        >
          ›
        </button>

        <span style={{ fontSize: 13, color: "#aaa" }}>
          {current * perPage + 1}–
          {Math.min(current * perPage + perPage, photos.length)} of{" "}
          {photos.length}
        </span>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [tab, setTab] = useState("photos");
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 48px" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 className="page-title">Gallery</h1>
          <p className="page-sub">
            Moments from our research programs, projects and student
            journeys.
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          {[
            { id: "photos", label: "📷 Photos" },
            { id: "videos", label: "🎥 Videos" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 24px",
                borderRadius: 20,
                border: "none",
                background: tab === t.id ? "#2f6175" : "#e0e0e0",
                color: tab === t.id ? "white" : "#555",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Photos Tab */}

        {tab === "photos" && (
          <div>
            {photos.length === 0 ? (
              <div style={{ textAlign: "center", padding: 80, color: "#aaa" }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>📷</p>
                <p style={{ fontSize: 16 }}>No photos yet. Check back soon!</p>
              </div>
            ) : (
              <PhotoCarousel
                photos={photos}
                onPhotoClick={(photo) =>
                  setSelected({ type: "photo", ...photo })
                }
              />
            )}
          </div>
        )}

        {/* Videos Tab */}
        {tab === "videos" && (
          <div>
            {videos.length === 0 ? (
              <div style={{ textAlign: "center", padding: 80, color: "#aaa" }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>🎥</p>
                <p style={{ fontSize: 16 }}>No videos yet. Check back soon!</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 16,
                }}
              >
                {videos.map((video, index) => (
                  <div
                    key={index}
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        paddingBottom: "56.25%",
                        height: 0,
                      }}
                    >
                      <iframe
                        src={video.url}
                        title={video.caption}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                        allowFullScreen
                      />
                    </div>
                    {video.caption && (
                      <div style={{ padding: "12px 16px" }}>
                        <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                          {video.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo lightbox modal */}
      {selected && selected.type === "photo" && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 800, width: "100%" }}
          >
            <img
              src={selected.url}
              alt={selected.caption}
              style={{
                width: "100%",
                borderRadius: 12,
                objectFit: "contain",
                maxHeight: "80vh",
              }}
            />
            {selected.caption && (
              <p
                style={{
                  color: "white",
                  textAlign: "center",
                  marginTop: 12,
                  fontSize: 14,
                }}
              >
                {selected.caption}
              </p>
            )}
            <button
              onClick={() => setSelected(null)}
              style={{
                display: "block",
                margin: "16px auto 0",
                padding: "8px 24px",
                borderRadius: 8,
                border: "none",
                background: "white",
                color: "#333",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
