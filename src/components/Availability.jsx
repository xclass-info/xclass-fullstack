// src/components/Availability.jsx
// Mentor's 1-on-1 availability: a week calendar where clicking an empty
// time opens a small form to add an open slot, and clicking an open slot
// removes it. Students book these on the mentor's public profile.
import { useState, useEffect } from "react";
import { api, live, seg } from "../api";
import { getCurrentUser } from "../auth";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./TeacherDashboard.module.css";
import reg from "./RegisterControls.module.css";
import auth from "./TeacherAuth.module.css";

const localizer = momentLocalizer(moment);

export default function Availability() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null); // slot being added
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const teacherId = getCurrentUser()?.uid;

  useEffect(() => {
    if (!teacherId) return;
    const unsub = live(
      () => api.get("/teachers/me/availability"),
      (data) => {
        setEvents(
          data.map((slot) => ({
            id: slot.id,
            title: slot.booked
              ? "Booked"
              : `Open · ${slot.duration} min · ${slot.price > 0 ? `$${slot.price}` : "Free"}`,
            start: new Date(`${slot.date}T${slot.time}`),
            end: moment(`${slot.date}T${slot.time}`)
              .add(slot.duration, "minutes")
              .toDate(),
            booked: slot.booked,
            slotData: slot,
          })),
        );
      },
    );
    return () => unsub();
  }, [teacherId]);

  function handleSelectSlot({ start }) {
    setError("");
    setSelected({
      date: moment(start).format("YYYY-MM-DD"),
      time: moment(start).format("HH:mm"),
      duration: 60,
    });
  }

  function handleSelectEvent(event) {
    if (event.booked) return;
    const when = moment(event.start).format("ddd, MMM D [at] h:mm A");
    if (window.confirm(`Remove the open slot on ${when}?`)) {
      api
        .del(`/teachers/me/availability/${seg(event.id)}`)
        .catch((err) => console.error(err));
    }
  }

  async function confirmAddSlot(e) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/teachers/me/availability", {
        date: selected.date,
        time: selected.time,
        duration: Number(selected.duration),
        price: Number(price) || 0,
      });
      setSelected(null);
    } catch (err) {
      console.error(err);
      setError("Couldn't add this slot. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function eventStyleGetter(event) {
    return {
      style: {
        backgroundColor: event.booked ? "#f6ded3" : "#22372c",
        color: event.booked ? "#22372c" : "#eef2ea",
        borderRadius: 8,
        border: "none",
        fontSize: 12,
        fontWeight: 600,
      },
    };
  }

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Availability.</h2>
          <p className={styles.sectionSub}>
            Click an empty time to open it for 1-on-1 bookings. Click an open
            slot to remove it. Students book these from your public profile.
          </p>
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendOpen}>Open</span>
        <span className={styles.legendBooked}>Booked</span>
      </div>

      <div className={styles.calendar}>
        <Calendar
          localizer={localizer}
          events={events}
          defaultView='week'
          views={["month", "week", "day"]}
          step={30}
          timeslots={2}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          scrollToTime={new Date(1970, 0, 1, 8)}
          style={{ height: "100%" }}
        />
      </div>

      {selected && (
        <div className={reg.overlay} onClick={() => setSelected(null)}>
          <form
            className={reg.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='slot-title'
            onClick={(e) => e.stopPropagation()}
            onSubmit={confirmAddSlot}
          >
            <div className={reg.modalHead}>
              <div>
                <p className={reg.modalKicker}>Availability</p>
                <h3 id='slot-title' className={reg.modalTitle}>
                  Open a time slot
                </h3>
              </div>
              <button
                type='button'
                className={reg.close}
                onClick={() => setSelected(null)}
                aria-label='Close'
              >
                ✕
              </button>
            </div>

            <div className={auth.form}>
              <div className={auth.row}>
                <div className={auth.field}>
                  <label className={auth.label} htmlFor='slot-date'>
                    Date
                  </label>
                  <input
                    id='slot-date'
                    type='date'
                    className={auth.input}
                    value={selected.date}
                    onChange={(e) =>
                      setSelected({ ...selected, date: e.target.value })
                    }
                  />
                </div>
                <div className={auth.field}>
                  <label className={auth.label} htmlFor='slot-time'>
                    Time
                  </label>
                  <input
                    id='slot-time'
                    type='time'
                    className={auth.input}
                    value={selected.time}
                    onChange={(e) =>
                      setSelected({ ...selected, time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className={auth.row}>
                <div className={auth.field}>
                  <label className={auth.label} htmlFor='slot-duration'>
                    Length
                  </label>
                  <select
                    id='slot-duration'
                    className={auth.input}
                    value={selected.duration}
                    onChange={(e) =>
                      setSelected({ ...selected, duration: e.target.value })
                    }
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
                <div className={auth.field}>
                  <label className={auth.label} htmlFor='slot-price'>
                    Price (USD)
                  </label>
                  <input
                    id='slot-price'
                    type='number'
                    min='0'
                    step='0.01'
                    className={auth.input}
                    placeholder='0 for free'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
              {error && <p className={auth.error}>{error}</p>}
              <button type='submit' className={reg.applyBtn} disabled={loading}>
                {loading ? "Adding..." : "Open this slot"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
