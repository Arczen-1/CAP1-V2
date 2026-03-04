import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./DepartmentDashboard.css";

function LogisticsDashboard({ onLogout }) {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null); // calendar modal
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("contracts");
  const [calendarURL, setCalendarURL] = useState("");
  const [bookings, setBookings] = useState([]);
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routeControlRef = useRef(null);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchContracts();
    fetchCalendarData();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (activeTab === "map") {
      setTimeout(() => initMap(), 300);
    }
  }, [activeTab, contracts]);

  useEffect(() => {
    if (activeTab === "map" && mapInstance.current) {
      setTimeout(() => mapInstance.current.invalidateSize(), 500);
    }
  }, [activeTab]);

  // ===== FETCH CONTRACTS =====
  const fetchContracts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logistics/contracts");
      const data = await res.json();
      if (res.ok) setContracts(data.contracts || []);
    } catch (e) {
      console.error("Error fetching contracts:", e);
    }
  };

  // ===== FETCH CALENDAR DATA =====
  const fetchCalendarData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logistics/calendar");
      const data = await res.json();
      if (res.ok) {
        setCalendarURL(data.calendarEmbedURL);
        const eventList = (data.events || []).map((ev) => ({
          title: ev.title || "Event",
          date: ev.start ? new Date(ev.start) : null,
          venue: ev.venue || "N/A",
          truck: ev.truck || "Unassigned",
          driver: ev.driver || "Unassigned",
          color: ev.color || "#1a73e8",
          description: ev.description || "",
        }));
        setBookings(eventList);
      }
    } catch (e) {
      console.error("Error loading calendar data:", e);
    }
  };

  // ===== FETCH BOOKINGS =====
  const fetchBookings = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logistics/bookings");
      const data = await res.json();
      if (res.ok) {
        const bookingList = (data.bookings || []).map((b) => ({
          title: b.venue || "Booking",
          date: b.date ? new Date(b.date) : null,
          client: b.client || "Unknown Client",
          truck: b.truck || "N/A",
          driver: b.driver || "N/A",
          venue: b.venue || "N/A",
          color: "#ff9800",
          description: `Booking for ${b.client || "client"} at ${
            b.venue || "venue"
          }`,
        }));
        setBookings((prev) => [...prev, ...bookingList]);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  // ===== MAP INITIALIZATION =====
  const initMap = () => {
    if (!mapRef.current) return;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    mapInstance.current = L.map(mapRef.current).setView([14.5995, 120.9842], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstance.current);

    contracts.forEach((c) => {
      const address = c.page1?.address || c.page1?.venue;
      if (!address) return;
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address + ", Philippines"
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data[0]) {
            const { lat, lon } = data[0];
            const marker = L.marker([lat, lon]).addTo(mapInstance.current);
            marker.bindPopup(
              `<strong>${c.name}</strong><br/>${
                c.page1?.celebratorName || ""
              }<br/>${c.page1?.venue || ""}`
            );
          }
        })
        .catch(() => {});
    });
  };

  // ===== FIXED GEOCODE FUNCTION =====
  const geocode = async (q) => {
    if (!q || q.trim() === "") throw new Error("⚠️ Please enter a valid address.");

    const cleanedQuery = q
      .replace(/\s+/g, " ")
      .replace(/[.,]/g, "")
      .trim();
    const query = `${cleanedQuery}, Philippines`;

    // 1️⃣ Try Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          query
        )}`,
        { headers: { "User-Agent": "EventManagementSystem/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0)
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch (err) {
      console.warn("Nominatim failed:", err);
    }

    // 2️⃣ Try Photon fallback
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        return [lat, lon];
      }
    } catch (err) {
      console.warn("Photon fallback failed:", err);
    }

    // 3️⃣ Optional Google Maps fallback (use your API key)
    try {
      const googleApiKey = "YOUR_GOOGLE_MAPS_API_KEY"; // replace this
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          query
        )}&key=${googleApiKey}`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return [lat, lng];
      }
    } catch (err) {
      console.warn("Google Maps fallback failed:", err);
    }

    throw new Error(`⚠️ Location not found or invalid address: ${q}`);
  };

  // ===== ROUTE FINDER =====
  const showRoute = async () => {
    if (!startLocation || !endLocation) {
      alert("Please enter both a starting point and destination.");
      return;
    }

    try {
      const start = await geocode(startLocation);
      const end = await geocode(endLocation);

      if (!mapInstance.current) initMap();

      if (routeControlRef.current) {
        mapInstance.current.removeControl(routeControlRef.current);
      }

      const control = L.Routing.control({
        waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
        routeWhileDragging: false,
        lineOptions: { styles: [{ color: "#007bff", weight: 5 }] },
        createMarker: () => null,
      })
        .on("routesfound", (e) => {
          const route = e.routes[0];
          const dist = (route.summary.totalDistance / 1000).toFixed(2);
          const time = (route.summary.totalTime / 60).toFixed(1);
          setRouteInfo({ distance: `${dist} km`, duration: `${time} mins` });
        })
        .on("routingerror", () => {
          alert("Could not calculate route. Please check the addresses.");
        })
        .addTo(mapInstance.current);

      routeControlRef.current = control;
      mapInstance.current.setView(start, 10);
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== CONTRACT TABLE =====
  const renderContractsTable = () => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedContracts = contracts.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return (
      <div className="contracts-table-container">
        <div className="table-header">
          <h3>Active Contracts</h3>
          <div className="pager">
            <button
              className="pager-btn"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ←
            </button>
            <span className="page-indicator">
              Page {page} of {Math.ceil(contracts.length / itemsPerPage)}
            </span>
            <button
              className="pager-btn"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(contracts.length / itemsPerPage)}
            >
              →
            </button>
          </div>
        </div>

        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Contract Name</th>
                <th>Celebrator/Corporate Name</th>
                <th>Contract No.</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.length === 0 ? (
                <tr className="no-contracts">
                  <td colSpan="4">No active contracts available</td>
                </tr>
              ) : (
                paginatedContracts.map((contract) => (
                  <tr key={contract._id}>
                    <td>{contract.name}</td>
                    <td>{contract.celebratorName}</td>
                    <td>{contract.contractNumber || "-"}</td>
                    <td>
                      <button
                        className="btn-review"
                        onClick={async () => {
                          const res = await fetch(
                            `http://localhost:5000/contracts/${contract._id}`
                          );
                          const data = await res.json();
                          if (res.ok) setSelectedContract(data.contract);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ===== CALENDAR VIEW =====
  const renderCalendarView = () => (
    <div className="calendar-container">
      <h3 style={{ color: "#fff", marginBottom: "10px" }}>
        📅 Google Calendar — Event Overview
      </h3>
      {calendarURL && (
        <iframe
          src={calendarURL}
          style={{
            border: 0,
            width: "100%",
            height: "500px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
          title="Google Calendar"
        ></iframe>
      )}
      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          padding: "20px",
          borderRadius: "10px",
          maxHeight: "600px",
          overflowY: "auto",
        }}
      >
        {bookings.map((b, i) => (
          <div
            key={i}
            title={`Driver: ${b.driver}\nTruck: ${b.truck}\nVenue: ${b.venue}`}
            className="calendar-event-card"
            style={{
              background: "rgba(255,255,255,0.95)",
              marginBottom: "12px",
              padding: "14px 18px",
              borderRadius: "10px",
              borderLeft: `6px solid ${b.color || "#1a73e8"}`,
              cursor: "pointer",
              transition: "0.2s ease",
            }}
            onClick={() => setSelectedEvent(b)}
          >
            <h4 style={{ color: "#333", marginBottom: "6px" }}>{b.title}</h4>
            <p style={{ margin: 0 }}>
              📆 <strong>Date:</strong>{" "}
              {b.date ? b.date.toLocaleDateString() : "No date set"}
            </p>
            <p style={{ margin: 0 }}>
              📍 <strong>Venue:</strong> {b.venue}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  // ===== EVENT MODAL =====
  const renderEventModal = () =>
    selectedEvent && (
      <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Event Details</h3>
            <button className="close-btn" onClick={() => setSelectedEvent(null)}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <p>
              <strong>Event:</strong> {selectedEvent.title}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {selectedEvent.date?.toLocaleDateString() || "Unknown"}
            </p>
            <p>
              <strong>Venue:</strong> {selectedEvent.venue}
            </p>
            <p>
              <strong>Driver:</strong> {selectedEvent.driver}
            </p>
            <p>
              <strong>Truck:</strong> {selectedEvent.truck}
            </p>
            {selectedEvent.description && (
              <p>
                <strong>Description:</strong> {selectedEvent.description}
              </p>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setEndLocation(selectedEvent.venue || "");
                setActiveTab("map");
                setSelectedEvent(null);
              }}
            >
              Show Route
            </button>
            <button className="btn-secondary" onClick={() => setSelectedEvent(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );

  // ===== MAP VIEW =====
  const renderMapView = () => (
    <div className="map-container">
      <h3 style={{ color: "#fff" }}>Venue Map & Route Planner</h3>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Enter starting point"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          style={{ flex: 1, padding: "8px", borderRadius: "6px" }}
        />
        <input
          type="text"
          placeholder="Enter event destination"
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          style={{ flex: 1, padding: "8px", borderRadius: "6px" }}
        />
        <button
          onClick={showRoute}
          style={{
            padding: "8px 12px",
            background: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Show Route
        </button>
      </div>
      {routeInfo && (
        <div style={{ color: "#fff", marginBottom: "10px" }}>
          <strong>Distance:</strong> {routeInfo.distance} |{" "}
          <strong>Duration:</strong> {routeInfo.duration}
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "10px",
          background: "#ccc",
        }}
      ></div>
    </div>
  );

  // ===== CONTRACT MODAL =====
  const renderDetailsModal = () =>
    selectedContract && (
      <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Logistics Contract Details</h3>
            <button
              className="close-btn"
              onClick={() => setSelectedContract(null)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <p>
              <strong>Contract Number:</strong>{" "}
              {selectedContract.contractNumber}
            </p>
            <p>
              <strong>Client:</strong> {selectedContract.page1?.celebratorName}
            </p>
            <p>
              <strong>Venue:</strong> {selectedContract.page1?.venue}
            </p>
            <p>
              <strong>Address:</strong> {selectedContract.page1?.address}
            </p>
            <p>
              <strong>Date:</strong> {selectedContract.page1?.eventDate}
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setEndLocation(selectedContract.page1?.address || "");
                setActiveTab("map");
                setSelectedContract(null);
              }}
            >
              Show Route to Venue
            </button>
            <button
              className="btn-secondary"
              onClick={() => setSelectedContract(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );

  // ===== MAIN RETURN =====
  return (
    <div className="department-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1>Logistics Dashboard</h1>
          <div className="tabs">
            <button
              className={`tab ${activeTab === "contracts" ? "active" : ""}`}
              onClick={() => setActiveTab("contracts")}
            >
              Contracts
            </button>
            <button
              className={`tab ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}
            >
              Calendar
            </button>
            <button
              className={`tab ${activeTab === "map" ? "active" : ""}`}
              onClick={() => setActiveTab("map")}
            >
              Map View
            </button>
          </div>
          <button onClick={onLogout} className="logout-btn header-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === "contracts" && renderContractsTable()}
        {activeTab === "calendar" && renderCalendarView()}
        {activeTab === "map" && renderMapView()}
        {selectedContract && renderDetailsModal()}
        {selectedEvent && renderEventModal()}
      </div>
    </div>
  );
}

export default LogisticsDashboard;
