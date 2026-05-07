import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaLock,
  FaLockOpen,
  FaPlus,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSearch,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AddType.css";

const initialTypes = [
  { id: 1, name: "Construction", isBlocked: false },
  { id: 2, name: "Interior", isBlocked: false },
  { id: 3, name: "Electrical", isBlocked: true },
  { id: 4, name: "Plumbing", isBlocked: false },
];

export default function AddType() {
  const [types, setTypes] = useState(initialTypes);
  const [showModal, setShowModal] = useState(false);
  const [newType, setNewType] = useState("");
  const [editType, setEditType] = useState(null);
  const [viewType, setViewType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);

  // Error states
  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");

  // Success message states
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Simulate loading when data changes
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [types]);

  // Reset to first page when filtered results change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, types.length]);

  const filteredTypes = types.filter((type) => {
    const search = searchTerm.toLowerCase();
    return (
      type.name.toLowerCase().includes(search) ||
      String(type.id).includes(search)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const showSuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // ADD TYPE with validation
  const handleAdd = () => {
    // Validation
    if (!newType.trim()) {
      setAddError("Type name cannot be empty");
      return;
    }

    if (newType.length < 2) {
      setAddError("Type name must be at least 2 characters long");
      return;
    }

    if (newType.length > 50) {
      setAddError("Type name cannot exceed 50 characters");
      return;
    }

    // Check for duplicate
    const isDuplicate = types.some(
      (t) => t.name.toLowerCase() === newType.trim().toLowerCase(),
    );

    if (isDuplicate) {
      setAddError("This type name already exists!");
      return;
    }

    // Add new type
    const newEntry = {
      id: Date.now(),
      name: newType.trim(),
      isBlocked: false,
    };

    setTypes([newEntry, ...types]);
    setNewType("");
    setShowModal(false);
    setAddError("");
    showSuccessMessage(`"${newType.trim()}" has been added successfully!`);
  };

  // DELETE with confirmation
  const handleDelete = (id) => {
    const typeToDelete = types.find((t) => t.id === id);
    setDeleteConfirm({
      id,
      name: typeToDelete.name,
      show: true,
    });
  };

  const confirmDelete = () => {
    const typeName = deleteConfirm.name;
    setTypes(types.filter((t) => t.id !== deleteConfirm.id));
    setDeleteConfirm(null);
    showSuccessMessage(`"${typeName}" has been deleted successfully!`);
  };

  // BLOCK / UNBLOCK with validation
  const toggleBlock = (id) => {
    const typeToToggle = types.find((t) => t.id === id);
    const newStatus = !typeToToggle.isBlocked;

    setTypes(
      types.map((t) => (t.id === id ? { ...t, isBlocked: newStatus } : t)),
    );

    showSuccessMessage(
      `"${typeToToggle.name}" has been ${newStatus ? "blocked" : "unblocked"} successfully!`,
    );
  };

  // EDIT SAVE with validation
  const handleEditSave = () => {
    if (!editType.name.trim()) {
      setEditError("Type name cannot be empty");
      return;
    }

    if (editType.name.length < 2) {
      setEditError("Type name must be at least 2 characters long");
      return;
    }

    if (editType.name.length > 50) {
      setEditError("Type name cannot exceed 50 characters");
      return;
    }

    // Check for duplicate (excluding current type)
    const isDuplicate = types.some(
      (t) =>
        t.id !== editType.id &&
        t.name.toLowerCase() === editType.name.trim().toLowerCase(),
    );

    if (isDuplicate) {
      setEditError("This type name already exists!");
      return;
    }

    const oldName = types.find((t) => t.id === editType.id).name;
    const newName = editType.name.trim();

    setTypes(
      types.map((t) =>
        t.id === editType.id ? { ...editType, name: newName } : t,
      ),
    );
    setEditType(null);
    setEditError("");
    showSuccessMessage(
      `"${oldName}" has been updated to "${newName}" successfully!`,
    );
  };

  return (
    <div className="add-type-container">
      {/* Success Toast Message */}
      {successMessage && (
        <div className="success-toast">
          <FaCheckCircle className="toast-icon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="content-wrapper">
        {/* Header Section */}
        <div className="header-section">
          <div>
            <h3 className="page-title">Add Construction Type</h3>
            <p className="page-subtitle">
              Manage all construction related types
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Search Wrapper */}
            <div style={{ position: "relative", marginRight: "20px" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "10px",
                  transform: "translateY(-50%)",
                  color: "#999",
                  pointerEvents: "none",
                }}
              />

              <input
                type="text"
                placeholder="Search type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px 8px 32px", // left space for icon
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <button
              className="btn-add"
              onClick={() => {
                setShowModal(true);
                setAddError("");
                setNewType("");
              }}
              style={{ whiteSpace: "nowrap" }}
            >
              Add Type
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-responsive">
          {loading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p>Loading types...</p>
            </div>
          ) : (
            <>
              <table className="material-table">
                <thead className="table-header">
                  <tr>
                    <th className="compact-header">SR.No.</th>
                    <th className="compact-header">Type Name</th>
                    <th className="compact-header">Status</th>
                    <th className="compact-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((type, index) => (
                      <tr key={type.id}>
                        <td className="sr-cell">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="name-cell">{type.name}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              type.isBlocked ? "blocked" : "active"
                            }`}
                          >
                            {type.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="action-btn view"
                            onClick={() => setViewType(type)}
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={() => {
                              setEditType(type);
                              setEditError("");
                            }}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(type.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                          <button
                            className={`action-btn ${
                              type.isBlocked ? "unblock" : "block"
                            }`}
                            onClick={() => toggleBlock(type.id)}
                            title={type.isBlocked ? "Unblock" : "Block"}
                          >
                            {type.isBlocked ? <FaLockOpen /> : <FaLock />}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="empty-row">
                      <td colSpan="4">
                        <div className="empty-state">
                          <FaExclamationTriangle className="empty-icon" />
                          <p>No types found</p>
                          <button
                            className="btn-add-small"
                            onClick={() => setShowModal(true)}
                          >
                            <FaPlus /> Add Your First Type
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Section */}
              {filteredTypes.length > 0 && (
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
                          // Show limited page numbers with ellipsis
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
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowModal(false);
            setAddError("");
            setNewType("");
          }}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Add New Type</h5>
              <button
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setAddError("");
                  setNewType("");
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <label className="input-label">Type Name *</label>
              <input
                className={`modal-input ${addError ? "error" : ""}`}
                placeholder="Enter type name (e.g., Plumbing, Painting)"
                value={newType}
                onChange={(e) => {
                  setNewType(e.target.value);
                  if (addError) setAddError("");
                }}
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              />
              {addError && (
                <div className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  <span>{addError}</span>
                </div>
              )}
              <div className="input-hint">
                * Minimum 2 characters, maximum 50 characters
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowModal(false);
                  setAddError("");
                  setNewType("");
                }}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleAdd}>
                Save Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editType && (
        <div
          className="modal-overlay"
          onClick={() => {
            setEditType(null);
            setEditError("");
          }}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Edit Type</h5>
              <button
                className="modal-close"
                onClick={() => {
                  setEditType(null);
                  setEditError("");
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <label className="input-label">Type Name *</label>
              <input
                className={`modal-input ${editError ? "error" : ""}`}
                value={editType.name}
                onChange={(e) => {
                  setEditType({ ...editType, name: e.target.value });
                  if (editError) setEditError("");
                }}
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleEditSave()}
              />
              {editError && (
                <div className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  <span>{editError}</span>
                </div>
              )}
              <div className="input-hint">
                * Minimum 2 characters, maximum 50 characters
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setEditType(null);
                  setEditError("");
                }}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleEditSave}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewType && (
        <div className="modal-overlay" onClick={() => setViewType(null)}>
          <div
            className="modal-box view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5>Type Details</h5>
              <button className="modal-close" onClick={() => setViewType(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body view-body">
              <div className="view-item">
                <span className="view-label">Type Name:</span>
                <span className="view-value">{viewType.name}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Status:</span>
                <span
                  className={`view-status ${
                    viewType.isBlocked ? "blocked" : "active"
                  }`}
                >
                  {viewType.isBlocked ? "Blocked" : "Active"}
                </span>
              </div>
              <div className="view-item">
                <span className="view-label">ID:</span>
                <span className="view-value">{viewType.id}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setViewType(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && deleteConfirm.show && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div
            className="modal-box delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5>Confirm Delete</h5>
              <button
                className="modal-close"
                onClick={() => setDeleteConfirm(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body delete-body">
              <FaExclamationTriangle className="delete-warning-icon" />
              <p>
                Are you sure you want to delete{" "}
                <strong>"{deleteConfirm.name}"</strong>?
              </p>
              <p className="delete-hint">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button className="btn-delete" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
