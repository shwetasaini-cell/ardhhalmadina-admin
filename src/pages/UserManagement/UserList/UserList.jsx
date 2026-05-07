import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaUsers,
  FaSearch,
  FaEye,
  FaLock,
  FaLockOpen,
  FaTimes,
  FaTimesCircle,
  FaCheckCircle,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./UserList.css";
import axiosInstance from "../../../utils/axiosInstance";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;
  const formatPhoneNumber = (phone) => {
    if (!phone) return "N/A";
    if (typeof phone === "object" && phone !== null) {
      const countryCode = phone.countryCode || "";
      const number = phone.number || "";
      return `${countryCode}${number}`.trim() || "N/A";
    }

    // If phone is a string, return as is
    if (typeof phone === "string") {
      return phone || "N/A";
    }

    return "N/A";
  };

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      toast.error("Please login again");
      return null;
    }
    return token;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/admin/users/getAll");

      const data = response.data;

      let usersArray = [];

      if (data.users && Array.isArray(data.users)) {
        usersArray = data.users;
      } else if (data.success && data.users) {
        usersArray = data.users;
      } else if (Array.isArray(data)) {
        usersArray = data;
      } else {
        throw new Error("Unexpected API response format");
      }

      const formattedUsers = usersArray.map((user) => ({
        _id: user._id,
        username:
          user.fullName || user.username || user.email?.split("@")[0] || "N/A",
        email: user.email || "N/A",
        phone: user.mobile || user.phone || "N/A",
        phoneRaw: user.mobile || user.phone,
        isBlocked: user.status === "blocked" || user.isBlocked || false,
        createdAt: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : "N/A",
        status: user.status || "active",
      }));

      setUsers(formattedUsers);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load users");
      }

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Block/Unblock user using updateStatus API
  const toggleBlock = async (id) => {
    try {
      const userToUpdate = users.find((u) => u._id === id);

      if (!userToUpdate) {
        toast.error("User not found");
        return;
      }

      const newBlockStatus = !userToUpdate.isBlocked;

      const response = await axiosInstance.put(
        `/admin/users/updateStatus/${id}`,
        {
          status: newBlockStatus ? "blocked" : "active",
        },
      );

      console.log("Update response:", response.data);

      setUsers((prev) =>
        prev.map((u) =>
          u._id === id
            ? {
                ...u,
                isBlocked: newBlockStatus,
                status: newBlockStatus ? "blocked" : "active",
              }
            : u,
        ),
      );

      toast.success(
        newBlockStatus
          ? "User blocked successfully"
          : "User active successfully",
      );

      if (selectedUser && selectedUser._id === id) {
        setSelectedUser({
          ...selectedUser,
          isBlocked: newBlockStatus,
          status: newBlockStatus ? "blocked" : "active",
        });
      }
    } catch (err) {
      console.error("Error updating user status:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(
          err.response?.data?.message || "Failed to update user status",
        );
      }
    }
  };

  // Get status badge component
  const getStatusBadge = (user) => {
    if (user.isBlocked) {
      return (
        <span className="badge-status badge-blocked">
          <FaTimesCircle className="me-1" /> Blocked
        </span>
      );
    }

    return (
      <span className="badge-status badge-active">
        <FaCheckCircle className="me-1" /> Active
      </span>
    );
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatPhoneNumber(user.phone)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  // Pagination Logic
  const totalRecords = filteredUsers.length;
  const totalPages = Math.ceil(totalRecords / perPage);

  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="user-page">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      {/* HEADER */}
      <div className="page-headers">
        <div className="header-content">
          {/* LEFT SIDE */}
          <div className="header-left">
            <h1 className="page-title">
              <FaUsers className="icon" />
              User Management
            </h1>
            <p className="page-subtitle">
              Manage all registered users and their accounts
            </p>
          </div>

          {/* RIGHT SIDE - Search Bar */}
          <div className="search-box-2">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by username, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <FaTimes
                className="clear-icon"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="main-card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            {/* TABLE */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="user-cell">{user.username}</td>

                        <td>{user.email}</td>
                        <td>{formatPhoneNumber(user.phone)}</td>

                        <td>{getStatusBadge(user)}</td>
                        <td>{user.createdAt}</td>

                        <td className="action-buttons">
                          {/* View Details Button */}
                          <button
                            className="action-icon view"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowModal(true);
                            }}
                            title="View User Details"
                          >
                            <FaEye />
                          </button>

                          {/* Block/Unblock Button */}
                          <button
                            className={`action-btn ${user.isBlocked ? "unblock-btn" : "block-btn"}`}
                            onClick={() => toggleBlock(user._id)}
                            title={
                              user.isBlocked
                                ? "Click to Unblock User"
                                : "Click to Block User"
                            }
                          >
                            {user.isBlocked ? <FaLockOpen /> : <FaLock />}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        {searchTerm
                          ? "No users found matching your search"
                          : "No users available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="pagination-container mt-3">
                <ul className="pagination justify-content-center">
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Prev
                    </button>
                  </li>

                  {[...Array(totalPages)].map((_, i) => (
                    <li
                      key={i}
                      className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* USER DETAILS MODAL - REDESIGNED */}
      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-box redesigned-modal  modal-lg">
            {/* HEADER WITH GRADIENT */}
            <div className="modal-header-gradient">
              <div className="modal-header-content">
                <div className="header-icon-wrapper">
                  <FaUsers className="header-icon" />
                </div>
                <div className="header-text">
                  <h3>User Profile</h3>
                  <p>View and manage user details</p>
                </div>
                <button
                  className="close-btn-modern"
                  onClick={() => setShowModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="modal-body-modern">
              {/* PROFILE SECTION */}
              <div className="profile-section">
                <div className="profile-avatar-wrapper">
                  <div
                    className={`status-indicator ${selectedUser.isBlocked ? "status-blocked" : "status-active"}`}
                  ></div>
                </div>
                <h4 className="profile-name">{selectedUser.username}</h4>
                <div className="profile-badges">
                  <span
                    className={`badge-custom ${selectedUser.isBlocked ? "badge-danger" : "badge-success"}`}
                  >
                    {selectedUser.isBlocked ? (
                      <>
                        <FaLock className="badge-icon" /> Blocked
                      </>
                    ) : (
                      <>
                        <FaLockOpen className="badge-icon" /> Active
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* INFO CARDS GRID */}
              <div className="info-cards-grid">
                {/* Email Card */}
                <div className="info-card">
                  <div className="info-card-icon email-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className="info-card-content">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">{selectedUser.email}</span>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="info-card">
                  <div className="info-card-icon phone-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className="info-card-content">
                    <span className="info-label">Phone Number</span>
                    <span className="info-value">
                      {formatPhoneNumber(selectedUser.phone)}
                    </span>
                  </div>
                </div>

                {/* Created Date Card */}
                <div className="info-card">
                  <div className="info-card-icon date-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className="info-card-content">
                    <span className="info-label">Joined Date</span>
                    <span className="info-value">{selectedUser.createdAt}</span>
                  </div>
                </div>

                {/* User ID Card */}
                <div className="info-card">
                  <div className="info-card-icon id-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="info-card-content">
                    <span className="info-label">User ID</span>
                    <span className="info-value id-value">
                      {selectedUser._id}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="modal-action-buttons">
                <button
                  className={`action-btn-modern ${selectedUser.isBlocked ? "btn-unblock" : "btn-block"}`}
                  onClick={() => {
                    toggleBlock(selectedUser._id);
                  }}
                >
                  {selectedUser.isBlocked ? (
                    <>
                      <FaLockOpen className="btn-icon" /> Unblock User
                    </>
                  ) : (
                    <>
                      <FaLock className="btn-icon" /> Block User
                    </>
                  )}
                </button>
                <button
                  className="action-btn-modern btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  <FaTimes className="btn-icon" /> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
