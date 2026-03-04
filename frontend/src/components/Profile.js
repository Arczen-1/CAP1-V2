import React, { useEffect, useState } from "react";
import "./Profile.css";

function Profile({ user, onLogout }) {
  const [profile, setProfile] = useState({
    username: "",
    fullName: "",
    email: "",
    mobile: "",
    landline: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/profile/${user.username}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
      } else {
        alert("Failed to load profile");
      }
    } catch (err) {
      alert("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/profile/${user.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: profile.mobile,
          landline: profile.landline,
          address: profile.address,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`http://localhost:5000/profile/${user.username}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password changed successfully");
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch (err) {
      alert("Error changing password");
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return name[0];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {getInitials(profile.fullName)}
          </div>
          <div className="profile-header-info">
            <h2>{profile.fullName}</h2>
            <p>Sales Employee • Catering Service</p>
          </div>
        </div>

        {/* Profile Body */}
        <div className="profile-body">
          {/* Success Message */}
          {showSuccess && (
            <div className="success-message">
              Profile updated successfully!
            </div>
          )}

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Personal Information Section */}
            <div className="section-title">Personal Information</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="read-only-field">{profile.username}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="read-only-field">{profile.fullName}</div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Email Address</label>
                <div className="read-only-field">{profile.email}</div>
              </div>
            </div>

            <hr className="section-divider" />

            {/* Contact Information Section */}
            <div className="section-title">Contact Information</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="text"
                  className="form-input"
                  name="mobile"
                  value={profile.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Landline Number</label>
                <input
                  type="text"
                  className="form-input"
                  name="landline"
                  value={profile.landline}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  placeholder="Enter your complete address"
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Change Password</h3>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
              />
            </div>
            <div className="modal-buttons">
              <button
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
              <button
                className="btn btn-cancel"
                onClick={() => setShowPasswordModal(false)}
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

export default Profile;