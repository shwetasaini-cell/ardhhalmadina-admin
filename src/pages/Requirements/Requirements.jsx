import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaTrash,
  FaPlus,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTools,
  FaUser,
  FaUndo,
  FaCheck,
  FaBan,
  FaClock,
  FaUsers,
  FaMobile,
  FaEnvelope,
  FaUserCheck,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Requirements.css";
import axiosInstance from "../../utils/axiosInstance";

export default function Requirements() {
  const [requirements, setRequirements] = useState([]);
  const [filteredRequirements, setFilteredRequirements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    equipmentType: "",
    equipmentName: "",
    addressLine: "",
    requiredDate: "",
    numberOfDays: 1,
  });
  const [viewRequirement, setViewRequirement] = useState(null);
  const [interestedUsersModal, setInterestedUsersModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return false;
    }
    return true;
  };

  // Fetch requirements from API
  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/requirement/all");

      let requirementsData = [];
      const data = response.data;

      if (data.data && Array.isArray(data.data)) {
        requirementsData = data.data;
      } else if (Array.isArray(data)) {
        requirementsData = data;
      } else if (data.requirements && Array.isArray(data.requirements)) {
        requirementsData = data.requirements;
      }

      const formattedRequirements = requirementsData.map((req) => ({
        id: req._id,
        userId: req.userId,
        equipmentType: req.equipmentType,
        equipmentName: req.equipmentName,
        addressLine: req.addressLine,
        requiredDate: req.requiredDate,
        numberOfDays: req.numberOfDays,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        interestedUsers: req.interestedUsers || [],
        acceptedUserId: req.acceptedUserId,
      }));

      setRequirements(formattedRequirements);
      setFilteredRequirements(formattedRequirements);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      if (error.response?.status === 401) {
        showSuccessMessage("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        showSuccessMessage(
          `Failed to load requirements: ${error.response?.data?.message || error.message}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  useEffect(() => {
    filterRequirements();
  }, [searchTerm, statusFilter, dateRange, requirements]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRange]);

  const filterRequirements = () => {
    let filtered = [...requirements];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.equipmentType?.toLowerCase().includes(search) ||
          req.equipmentName?.toLowerCase().includes(search) ||
          req.addressLine?.toLowerCase().includes(search) ||
          req.userId?.email?.toLowerCase().includes(search),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    if (dateRange.start) {
      filtered = filtered.filter(
        (req) => new Date(req.requiredDate) >= new Date(dateRange.start),
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (req) => new Date(req.requiredDate) <= new Date(dateRange.end),
      );
    }

    setFilteredRequirements(filtered);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequirements.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequirements.length / itemsPerPage),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredRequirements, totalPages]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const showSuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: "status-active", icon: <FaCheck />, text: "ACTIVE" },
      pending: { class: "status-pending", icon: <FaClock />, text: "PENDING" },
      cancelled: {
        class: "status-cancelled",
        icon: <FaBan />,
        text: "CANCELLED",
      },
      completed: {
        class: "status-completed",
        icon: <FaCheckCircle />,
        text: "COMPLETED",
      },
      fulfilled: {
        class: "status-fulfilled",
        icon: <FaCheckCircle />,
        text: "FULFILLED",
      },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const getInterestedUserStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "status-pending", icon: <FaClock />, text: "PENDING" },
      accepted: { class: "status-active", icon: <FaCheck />, text: "ACCEPTED" },
      rejected: {
        class: "status-cancelled",
        icon: <FaBan />,
        text: "REJECTED",
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`interest-status-badge ${config.class}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
    setFiltersVisible(false);
  };

  const showErrorMessage = (msg) => {
    setAddError(msg);
    setTimeout(() => setAddError(""), 3000);
  };

  const openInterestedUsersModal = (requirement) => {
    setInterestedUsersModal(requirement);
  };

  return (
    <div className="requirements-container">
      {successMessage && (
        <div className="success-toast">
          <FaCheckCircle className="toast-icon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="header-section">
        <div>
          <h3 className="page-title">Material Requirements</h3>
          <p className="page-subtitle">
            Manage all equipment and material requirements from users
          </p>
        </div>

        <div className="headers-actions">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <button
            className={`btn-filter ${filtersVisible ? "active" : ""}`}
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <FaFilter /> Filters
          </button>
        </div>
      </div>

      {filtersVisible && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-groups">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>

            <div className="filter-groups">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="filter-input"
                placeholder="From Date"
              />
            </div>

            <div className="filter-groups">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="filter-input"
                placeholder="To Date"
              />
            </div>

            <div className="filter-actions">
              <button className="btn-reset" onClick={resetFilters}>
                <FaUndo /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content-wrapper">
        <div className="table-responsive">
          {loading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p>Loading requirements...</p>
            </div>
          ) : (
            <>
              <table className="requirements-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User Info</th>
                    <th>Equipment Name</th>
                    <th>Equipment Type</th>
                    <th>Location</th>
                    <th>Duration</th>
                    <th>Interested</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((requirement, index) => (
                      <tr key={requirement.id}>
                        <td>{indexOfFirstItem + index + 1}</td>
                        <td>
                          <div className="user-info">
                            <span className="user-email">
                              {requirement.userId?.email?.split("@")[0] ||
                                "N/A"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="equipment-name-cell">
                            <span>{requirement.equipmentName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="equipment-type-badge">
                            {requirement.equipmentType}
                          </span>
                        </td>
                        <td>
                          <div className="location-cell">
                            <span>{requirement.addressLine}</span>
                          </div>
                        </td>
                        <td className="duration-cell">
                          {requirement.numberOfDays} day(s)
                        </td>
                        <td>
                          {requirement.interestedUsers?.length > 0 ? (
                            <button
                              className="interested-users-btn"
                              onClick={() =>
                                openInterestedUsersModal(requirement)
                              }
                              title="View Interested Users"
                            >
                              <FaUsers />
                              <span className="interested-count">
                                {requirement.interestedUsers.length}
                              </span>
                            </button>
                          ) : (
                            <span className="no-interested">No interests</span>
                          )}
                        </td>
                        <td>{getStatusBadge(requirement.status)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn view-btn"
                              onClick={() => setViewRequirement(requirement)}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="empty-row">
                      <td colSpan="9">
                        <div className="empty-state">
                          <FaExclamationTriangle className="empty-icon" />
                          <p>No requirements found</p>
                          <button
                            className="btn-add-small"
                            onClick={() => setShowModal(true)}
                          >
                            <FaPlus /> Add Your First Requirement
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredRequirements.length > 0 && (
                <div className="pagination-container">
                  <div className="pagination-controls">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>
                    <div className="page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (number) => {
                          if (
                            number === 1 ||
                            number === totalPages ||
                            (number >= currentPage - 1 &&
                              number <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`page-number ${currentPage === number ? "active" : ""}`}
                              >
                                {number}
                              </button>
                            );
                          } else if (
                            number === currentPage - 2 ||
                            number === currentPage + 2
                          ) {
                            return (
                              <span key={number} className="page-ellipsis">
                                ...
                              </span>
                            );
                          }
                          return null;
                        },
                      )}
                    </div>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                  <div className="pagination-info">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredRequirements.length)} of{" "}
                    {filteredRequirements.length} requirements
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Requirement Modal */}
      {viewRequirement && (
        <div className="modal-overlay" onClick={() => setViewRequirement(null)}>
          <div
            className="modal-box view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5>Requirement Details</h5>
              <button
                className="modal-close"
                onClick={() => setViewRequirement(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body view-body">
              <div className="view-section">
                <h6>User Information</h6>
                <div className="view-item">
                  <span className="view-label">Email:</span>
                  <span className="view-value">
                    {viewRequirement.userId?.email || "N/A"}
                  </span>
                </div>
                <div className="view-item">
                  <span className="view-label">Full Name:</span>
                  <span className="view-value">
                    {viewRequirement.userId?.fullName || "N/A"}
                  </span>
                </div>
                <div className="view-item">
                  <span className="view-label">Mobile:</span>
                  <span className="view-value">
                    {viewRequirement.userId?.mobile?.number
                      ? `${viewRequirement.userId.mobile.countryCode || "+91"} ${viewRequirement.userId.mobile.number}`
                      : "N/A"}
                  </span>
                </div>
              </div>
              <div className="view-section">
                <h6>Equipment Details</h6>
                <div className="view-item">
                  <span className="view-label">Equipment Type:</span>
                  <span className="view-value">
                    {viewRequirement.equipmentType}
                  </span>
                </div>
                <div className="view-item">
                  <span className="view-label">Equipment Name:</span>
                  <span className="view-value">
                    {viewRequirement.equipmentName}
                  </span>
                </div>
              </div>
              <div className="view-section">
                <h6>Location & Schedule</h6>
                <div className="view-item">
                  <span className="view-label">Address:</span>
                  <span className="view-value">
                    {viewRequirement.addressLine}
                  </span>
                </div>
                <div className="view-item">
                  <span className="view-label">Required Date:</span>
                  <span className="view-value">
                    {formatDate(viewRequirement.requiredDate)}
                  </span>
                </div>
                <div className="view-item">
                  <span className="view-label">Duration:</span>
                  <span className="view-value">
                    {viewRequirement.numberOfDays} day(s)
                  </span>
                </div>
              </div>
              <div className="view-section">
                <h6>Status & Timeline</h6>
                <div className="view-item">
                  <span className="view-label">Status:</span>
                  {getStatusBadge(viewRequirement.status)}
                </div>
                <div className="view-item">
                  <span className="view-label">Created At:</span>
                  <span className="view-value">
                    {new Date(viewRequirement.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setViewRequirement(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interested Users Modal */}
      {interestedUsersModal && (
        <div
          className="modal-overlay"
          onClick={() => setInterestedUsersModal(null)}
        >
          <div
            className="modal-box interested-users-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5>
                <FaUsers /> Interested Users
              </h5>
              <button
                className="modal-close"
                onClick={() => setInterestedUsersModal(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="requirement-summary">
                <h6>Requirement Details</h6>
                <p>
                  <strong>Equipment:</strong>{" "}
                  {interestedUsersModal.equipmentName}
                </p>
                <p>
                  <strong>Location:</strong> {interestedUsersModal.addressLine}
                </p>
                <p>
                  <strong>Required Date:</strong>{" "}
                  {formatDate(interestedUsersModal.requiredDate)}
                </p>
              </div>

              <div className="interested-users-list">
                <h6>
                  Interested Users (
                  {interestedUsersModal.interestedUsers?.length || 0})
                </h6>

                {interestedUsersModal.interestedUsers?.length > 0 ? (
                  <div className="users-grid">
                    {interestedUsersModal.interestedUsers.map((user, index) => (
                      <div
                        key={user._id || index}
                        className="interested-user-card"
                      >
                        <div className="user-card-header">
                          <div className="user-avatar">
                            <FaUser />
                          </div>
                          <div className="user-status">
                            {getInterestedUserStatusBadge(user.status)}
                          </div>
                        </div>
                        <div className="user-card-body">
                          <div className="user-detail">
                            <FaEnvelope className="detail-icon" />
                            <span>{user.userId?.email || "N/A"}</span>
                          </div>
                          <div className="user-detail">
                            <FaUserCheck className="detail-icon" />
                            <span>{user.userId?.fullName || "N/A"}</span>
                          </div>
                          <div className="user-detail">
                            <FaMobile className="detail-icon" />
                            <span>
                              {user.userId?.mobile?.number
                                ? `${user.userId.mobile.countryCode || "+91"} ${user.userId.mobile.number}`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="user-detail">
                            <FaClock className="detail-icon" />
                            <span>
                              Interested: {formatDateTime(user.interestedAt)}
                            </span>
                          </div>
                          {interestedUsersModal.acceptedUserId?._id ===
                            user.userId?._id && (
                            <div className="accepted-badge">
                              <FaCheckCircle /> Accepted User
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-interested-users">
                    <FaUsers className="empty-icon" />
                    <p>No users have shown interest in this requirement yet.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setInterestedUsersModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
