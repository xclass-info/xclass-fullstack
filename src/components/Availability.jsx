// src/components/Availability.jsx
import { useState, useEffect } from "react";
import { api, live, seg } from "../api";
import { getCurrentUser } from "../auth";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function Availability() {
  const [slots, setSlots] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null); // selected slot to confirm
  const [loading, setLoading] = useState(false);
  const teacherId = getCurrentUser()?.uid;
  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: 60,
    price: "",
  });

  useEffect(() => {
    if (!teacherId) return;
    const unsub = live(
      () => api.get("/teachers/me/availability"),
      (data) => {
        setSlots(data);

        // Convert to calendar events
        setEvents(
          data.map((slot) => ({
            id: slot.id,
            title: slot.booked
              ? "✅ Booked"
              : `📅 Available (${slot.duration} min) $${slot.price || 0}`,
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

  // When teacher clicks an empty slot on the calendar
  function handleSelectSlot({ start }) {
    const date = moment(start).format("YYYY-MM-DD");
    const time = moment(start).format("HH:mm");
    setSelected({ date, time, duration: 60 });
  }

  // When teacher clicks an existing event
  function handleSelectEvent(event) {
    if (!event.booked) {
      if (
        window.confirm(
          `Remove slot on ${event.slotData.date} at ${event.slotData.time}?`,
        )
      ) {
        api
          .del(`/teachers/me/availability/${seg(event.id)}`)
          .catch((err) => console.error(err));
      }
    }
  }

  async function confirmAddSlot() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post("/teachers/me/availability", {
        date: selected.date,
        time: selected.time,
        duration: Number(selected.duration),
        price: Number(form.price),
      });
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Color code events
  function eventStyleGetter(event) {
    return {
      style: {
        backgroundColor: event.booked ? "#1f6f4a" : "#111111",
        borderRadius: 6,
        border: "none",
        color: "white",
        fontSize: 13,
      },
    };
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h3>🗓 My Availability</h3>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
        Click any time slot on the calendar to mark yourself as available. Click
        an existing slot to remove it.
      </p>

      {/* Calendar */}
      <div
        style={{
          height: 600,
          background: "white",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
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
          style={{ height: "100%" }}
        />
      </div>

      {/* Confirm modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 32,
              width: 360,
            }}
          >
            <h3 style={{ marginBottom: 16 }}>Add Availability Slot</h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#888" }}>Date</label>
              <input
                type='date'
                value={selected.date}
                onChange={(e) =>
                  setSelected({ ...selected, date: e.target.value })
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  marginTop: 4,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#888" }}>Time</label>
              <input
                type='time'
                value={selected.time}
                onChange={(e) =>
                  setSelected({ ...selected, time: e.target.value })
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  marginTop: 4,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "#888" }}>Duration</label>
              <select
                value={selected.duration}
                onChange={(e) =>
                  setSelected({ ...selected, duration: e.target.value })
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  marginTop: 4,
                  boxSizing: "border-box",
                }}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "#888" }}>Price (USD)</label>
              <input
                type='number'
                min='0'
                step='0.01'
                placeholder='e.g. 45.00 (enter 0 for free)'
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  marginTop: 4,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={confirmAddSlot}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: "#111111",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {loading ? "Adding..." : "Add Slot ✓"}
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: "#f1f1f1",
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
