import React, { useState } from "react";
import "./App.css";
import Register from "./components/Register";
import AdminDashboard from "./components/AdminDashboard";
import SalesDashboard from "./components/SalesDashboard";
import SalesManagerDashboard from "./components/SalesManagerDashboard";
import AccountingDashboard from "./components/AccountingDashboard";
import WarehouseDashboard from "./components/WarehouseDashboard";
import CreativeDashboard from "./components/CreativeDashboard";
import LinenDashboard from "./components/LinenDashboard";
import LogisticsDashboard from "./components/LogisticsDashboard";
import FabricationDashboard from "./components/FabricationDashboard";
import KitchenDashboard from "./components/KitchenDashboard";
import StockroomDashboard from "./components/StockroomDashboard";
import PurchasingDashboard from "./components/PurchasingDashboard";
import BanquetStaffDashboard from "./components/BanquetStaffDashboard";

function App() {
  const [currentView, setCurrentView] = useState("login"); // login, register, admin, sales, specific departments
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setMessage(data.message);
      
      if (res.ok) {
        setCurrentUser(data.user);
        if (data.user.role === 'Admin') {
          setCurrentView("admin");
        } else if (data.user.role === 'Sales') {
          setCurrentView("sales");
        } else if (data.user.role === 'Sales Manager') {
          setCurrentView("sales-manager");
        } else {
          // Route by specific department role
          switch (data.user.role) {
            case 'Accounting':
              setCurrentView('accounting');
              break;
            case 'Warehouse':
              setCurrentView('warehouse');
              break;
            case 'Creative':
              setCurrentView('creative');
              break;
            case 'Linen':
              setCurrentView('linen');
              break;
            case 'Logistics':
              setCurrentView('logistics');
              break;
            case 'Fabrication':
              setCurrentView('fabrication');
              break;
            case 'Kitchen':
              setCurrentView('kitchen');
              break;
            case 'Stockroom':
              setCurrentView('stockroom');
              break;
            case 'Purchasing':
              setCurrentView('purchasing');
              break;
            case 'Banquet Staff':
              setCurrentView('banquet');
              break;
            default:
              setMessage("Access denied. Contact admin for role setup.");
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("login");
    setUsername("");
    setPassword("");
    setMessage("");
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
    setMessage("");
  };

  const handleGoToRegister = () => {
    setCurrentView("register");
    setMessage("");
  };

  if (currentView === "register") {
    return <Register onBackToLogin={handleBackToLogin} />;
  }

  if (currentView === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (currentView === "sales") {
    return <SalesDashboard onLogout={handleLogout} />;
  }

  if (currentView === "sales-manager") {
    return <SalesManagerDashboard onLogout={handleLogout} />;
  }

  if (currentView === "accounting") return <AccountingDashboard onLogout={handleLogout} />;
  if (currentView === "warehouse") return <WarehouseDashboard onLogout={handleLogout} />;
  if (currentView === "creative") return <CreativeDashboard onLogout={handleLogout} />;
  if (currentView === "linen") return <LinenDashboard onLogout={handleLogout} />;
  if (currentView === "logistics") return <LogisticsDashboard onLogout={handleLogout} />;
  if (currentView === "fabrication") return <FabricationDashboard onLogout={handleLogout} />;
  if (currentView === "kitchen") return <KitchenDashboard onLogout={handleLogout} />;
  if (currentView === "stockroom") return <StockroomDashboard onLogout={handleLogout} />;
  if (currentView === "purchasing") return <PurchasingDashboard onLogout={handleLogout} />;
  if (currentView === "banquet") return <BanquetStaffDashboard onLogout={handleLogout} />;

  return (
    <div className="App">
      <div className="login-box">
        <h1>Welcome</h1>
        <p className="subtitle">Input your credentials</p>
        <input
          type="text"
          placeholder="Username"
          className="input-field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>
        {message && <p className="message">{message}</p>}
        <button className="register-link-btn" onClick={handleGoToRegister}>
          Don't have an account? Register here
        </button>
      </div>
    </div>
  );
}

export default App;