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
  FaUpload,
  FaTrashAlt,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SubcategoryManagement.css";
import axiosInstance from "../../../utils/axiosInstance";

// Local placeholder image as data URL (gray background with text)
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23cccccc'/%3E%3Ctext x='50' y='50' font-size='12' text-anchor='middle' dy='.3em' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function SubcategoryManagement() {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState({
    categoryId: "",
    name: "",
    image: null,
    imagePreview: null,
  });
  const [editSubcategory, setEditSubcategory] = useState(null);
  const [viewSubcategory, setViewSubcategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);

  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories...");
      const response = await axiosInstance.get("/category");
      console.log("Categories API response:", response.data);

      let categoriesData = [];
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      } else if (
        response.data?.categories &&
        Array.isArray(response.data.categories)
      ) {
        categoriesData = response.data.categories;
      } else if (response.data?.result && Array.isArray(response.data.result)) {
        categoriesData = response.data.result;
      }

      console.log("Processed categories data:", categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchSubcategories = async () => {
    setLoading(true);
    try {
      console.log("Fetching subcategories...");
      const response = await axiosInstance.get("/subcategory");
      console.log("Subcategories API response:", response.data);

      let subcategoriesArray = [];

      if (response.data && Array.isArray(response.data)) {
        subcategoriesArray = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        subcategoriesArray = response.data.data;
      } else if (
        response.data?.subcategories &&
        Array.isArray(response.data.subcategories)
      ) {
        subcategoriesArray = response.data.subcategories;
      } else if (response.data?.result && Array.isArray(response.data.result)) {
        subcategoriesArray = response.data.result;
      }

      console.log("Processed subcategories data:", subcategoriesArray);

      const transformedData = subcategoriesArray.map((item) => ({
        id: item._id || item.id,
        _id: item._id || item.id,
        categoryId:
          typeof item.categoryId === "object"
            ? item.categoryId?._id || item.categoryId?.id
            : item.categoryId,
        name: item.name,
        image: item.image || PLACEHOLDER_IMAGE,
        isBlocked: item.status === "blocked" || item.isBlocked === true,
        status: item.status || (item.isBlocked ? "blocked" : "active"),
      }));

      console.log("Transformed subcategories:", transformedData);
      setSubcategories(transformedData);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const filteredSubcategories = subcategories.filter((subcategory) => {
    const search = searchTerm.toLowerCase();
    const category = categories.find(
      (c) => (c._id || c.id) === subcategory.categoryId,
    );

    const matchesSearch =
      subcategory.name.toLowerCase().includes(search) ||
      (category &&
        category.name &&
        category.name.toLowerCase().includes(search)) ||
      String(subcategory.id).includes(search);

    const matchesCategory =
      selectedCategory === "all" || subcategory.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubcategories.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);

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

  const showSuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        const errorMsg = "Please upload a valid image (JPEG, PNG, GIF, WEBP)";
        if (isEdit) setEditError(errorMsg);
        else setAddError(errorMsg);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        const errorMsg = "Image size should be less than 2MB";
        if (isEdit) setEditError(errorMsg);
        else setAddError(errorMsg);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditSubcategory({
            ...editSubcategory,
            image: file,
            imagePreview: reader.result,
          });
        } else {
          setNewSubcategory({
            ...newSubcategory,
            image: file,
            imagePreview: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);

      if (addError) setAddError("");
      if (editError) setEditError("");
    }
  };

  const removeImage = (isEdit = false) => {
    if (isEdit) {
      setEditSubcategory({
        ...editSubcategory,
        image: null,
        imagePreview: null,
      });
    } else {
      setNewSubcategory({
        ...newSubcategory,
        image: null,
        imagePreview: null,
      });
    }
  };

  const handleAdd = async () => {
    if (!newSubcategory.categoryId) {
      setAddError("Please select a category");
      return;
    }

    if (!newSubcategory.name.trim()) {
      setAddError("Subcategory name cannot be empty");
      return;
    }

    if (newSubcategory.name.length < 2) {
      setAddError("Subcategory name must be at least 2 characters long");
      return;
    }

    if (newSubcategory.name.length > 50) {
      setAddError("Subcategory name cannot exceed 50 characters");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("categoryId", newSubcategory.categoryId);
      formData.append("name", newSubcategory.name.trim());
      if (newSubcategory.image) {
        formData.append("image", newSubcategory.image);
      }

      console.log("Adding subcategory:", {
        categoryId: newSubcategory.categoryId,
        name: newSubcategory.name.trim(),
      });

      const response = await axiosInstance.post(
        "/subcategory/create",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Add response:", response.data);

      toast.success(
        `"${newSubcategory.name.trim()}" has been added successfully!`,
      );
      await fetchSubcategories();

      setNewSubcategory({
        categoryId: "",
        name: "",
        image: null,
        imagePreview: null,
      });
      setShowModal(false);
      setAddError("");
    } catch (error) {
      console.error("Error adding subcategory:", error);
      setAddError(error.response?.data?.message || "Failed to add subcategory");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const subcategoryToDelete = subcategories.find((s) => s.id === id);
    setDeleteConfirm({
      id,
      name: subcategoryToDelete?.name,
      show: true,
    });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      console.log("Deleting subcategory:", deleteConfirm.id);
      await axiosInstance.delete(`/subcategory/${deleteConfirm.id}`);

      toast.error(`"${deleteConfirm.name}" has been deleted successfully!`);
      await fetchSubcategories();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete subcategory",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id) => {
    const subcategoryToToggle = subcategories.find((s) => s.id === id);
    const newStatus = !subcategoryToToggle?.isBlocked;

    setLoading(true);
    try {
      console.log("Toggling status for:", id);
      await axiosInstance.patch(`/subcategory/toggle-status/${id}`);

      toast.success(
        `"${subcategoryToToggle?.name}" has been ${newStatus ? "blocked" : "unblocked"} successfully!`,
      );
      await fetchSubcategories();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editSubcategory.categoryId) {
      setEditError("Please select a category");
      return;
    }

    if (!editSubcategory.name.trim()) {
      setEditError("Subcategory name cannot be empty");
      return;
    }

    if (editSubcategory.name.length < 2) {
      setEditError("Subcategory name must be at least 2 characters long");
      return;
    }

    if (editSubcategory.name.length > 50) {
      setEditError("Subcategory name cannot exceed 50 characters");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", editSubcategory.name.trim());
      formData.append("categoryId", editSubcategory.categoryId);
      if (editSubcategory.image && editSubcategory.image instanceof File) {
        formData.append("image", editSubcategory.image);
      }

      console.log("Updating subcategory:", editSubcategory.id);

      await axiosInstance.put(`/subcategory/${editSubcategory.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(`Subcategory has been updated successfully!`);
      await fetchSubcategories();
      setEditSubcategory(null);
      setEditError("");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      setEditError(
        error.response?.data?.message || "Failed to update subcategory",
      );
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categories.length) return "Loading...";

    const category = categories.find(
      (c) => String(c._id || c.id) === String(categoryId),
    );

    return category ? category.name : "Unknown Category";
  };

  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMAGE;
  };

  return (
    <div className="subcategory-container">
      <ToastContainer position="top-right" autoClose={3000} />
      {successMessage && (
        <div className="success-toast">
          <FaCheckCircle className="toast-icon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="headers-section">
        <div>
          <h3 className="page-title">Subcategory Management</h3>
          <p className="page-subtitle">Manage all subcategories with images</p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option
                key={category._id || category.id}
                value={category._id || category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
          <div style={{ position: "relative" }}>
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
              placeholder="Search subcategories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 12px 8px 32px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                width: "250px",
              }}
            />
          </div>

          <button
            className="btn-add"
            onClick={() => {
              setShowModal(true);
              setAddError("");
              setNewSubcategory({
                categoryId: "",
                name: "",
                image: null,
                imagePreview: null,
              });
            }}
            disabled={loading}
          >
            <FaPlus style={{ marginRight: "8px" }} /> Add Subcategory
          </button>
        </div>
      </div>

      <div className="content-wrapper">
        {/* Table Section */}
        <div className="table-responsive">
          {loading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p>Loading subcategories...</p>
            </div>
          ) : (
            <>
              <table className="material-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Subcategory Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((subcategory, index) => (
                      <tr key={subcategory.id}>
                        <td className="sr-cell">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="image-cell">
                          <img
                            src={subcategory.image || PLACEHOLDER_IMAGE}
                            alt={subcategory.name}
                            className="subcategory-image"
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                            onError={handleImageError}
                          />
                        </td>
                        <td className="name-cell">
                          <strong>{subcategory.name}</strong>
                        </td>
                        <td className="category-cell">
                          <span className="category-badge">
                            {getCategoryName(subcategory.categoryId)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${subcategory.isBlocked ? "blocked" : "active"}`}
                          >
                            {subcategory.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="table-actions">
                            {/* VIEW */}
                            <button
                              className="table-action-btn view-btn"
                              onClick={() => setViewSubcategory(subcategory)}
                              title="View"
                            >
                              <FaEye />
                            </button>

                            {/* EDIT */}
                            <button
                              className="table-action-btn edit-btn"
                              onClick={() => {
                                setEditSubcategory({
                                  ...subcategory,
                                  imagePreview: null,
                                });
                                setEditError("");
                              }}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>

                            {/* DELETE */}
                            <button
                              className="table-action-btn delete-btn"
                              onClick={() => handleDelete(subcategory.id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>

                            {/* BLOCK / UNBLOCK */}
                            <button
                              className={`table-action-btn ${
                                subcategory.isBlocked
                                  ? "unlock-btn"
                                  : "lock-btn"
                              }`}
                              onClick={() => toggleBlock(subcategory.id)}
                              title={
                                subcategory.isBlocked ? "Unblock" : "Block"
                              }
                            >
                              {subcategory.isBlocked ? (
                                <FaLockOpen />
                              ) : (
                                <FaLock />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="empty-row">
                      <td colSpan="6">
                        <div className="empty-state">
                          <FaExclamationTriangle className="empty-icon" />
                          <p>No subcategories found</p>
                          <button
                            className="btn-add-small"
                            onClick={() => setShowModal(true)}
                          >
                            <FaPlus /> Add Your First Subcategory
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Section */}
              {filteredSubcategories.length > 0 && (
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
                    {Math.min(indexOfLastItem, filteredSubcategories.length)} of{" "}
                    {filteredSubcategories.length} subcategories
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Add New Subcategory</h5>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <label className="input-label">Category *</label>
              <select
                className={`modal-select ${addError && !newSubcategory.categoryId ? "error" : ""}`}
                value={newSubcategory.categoryId}
                onChange={(e) => {
                  setNewSubcategory({
                    ...newSubcategory,
                    categoryId: e.target.value,
                  });
                  if (addError) setAddError("");
                }}
              >
                <option value="">Select Category</option>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option
                      key={category._id || category.id}
                      value={category._id || category.id}
                    >
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading categories...</option>
                )}
              </select>

              <label className="input-label" style={{ marginTop: "15px" }}>
                Subcategory Name *
              </label>
              <input
                className={`modal-input ${addError && !newSubcategory.name ? "error" : ""}`}
                placeholder="Enter subcategory name"
                value={newSubcategory.name}
                onChange={(e) => {
                  setNewSubcategory({
                    ...newSubcategory,
                    name: e.target.value,
                  });
                  if (addError) setAddError("");
                }}
              />

              <label className="input-label" style={{ marginTop: "15px" }}>
                Image (Optional)
              </label>
              <div className="image-upload-container">
                {newSubcategory.imagePreview ? (
                  <div className="image-preview-wrapper">
                    <img
                      src={newSubcategory.imagePreview}
                      alt="Preview"
                      className="image-preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(false)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ) : (
                  <div className="upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, false)}
                      id="image-upload"
                      style={{ display: "none" }}
                    />
                    <label htmlFor="image-upload" className="upload-label">
                      <FaUpload />
                      <span>Click to upload image</span>
                      <small>JPEG, PNG, GIF (Max 2MB)</small>
                    </label>
                  </div>
                )}
              </div>

              {addError && (
                <div className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  <span>{addError}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleAdd}
                disabled={loading}
              >
                Save Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editSubcategory && (
        <div className="modal-overlay" onClick={() => setEditSubcategory(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Edit Subcategory</h5>
              <button
                className="modal-close"
                onClick={() => setEditSubcategory(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <label className="input-label">Category *</label>
              <select
                className={`modal-select ${editError && !editSubcategory.categoryId ? "error" : ""}`}
                value={editSubcategory.categoryId}
                onChange={(e) => {
                  setEditSubcategory({
                    ...editSubcategory,
                    categoryId: e.target.value,
                  });
                  if (editError) setEditError("");
                }}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option
                    key={category._id || category.id}
                    value={category._id || category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <label className="input-label" style={{ marginTop: "15px" }}>
                Subcategory Name *
              </label>
              <input
                className={`modal-input ${editError && !editSubcategory.name ? "error" : ""}`}
                value={editSubcategory.name}
                onChange={(e) => {
                  setEditSubcategory({
                    ...editSubcategory,
                    name: e.target.value,
                  });
                  if (editError) setEditError("");
                }}
              />

              <label className="input-label" style={{ marginTop: "15px" }}>
                Image
              </label>
              <div className="image-upload-container">
                {editSubcategory.imagePreview || editSubcategory.image ? (
                  <div className="image-preview-wrapper">
                    <img
                      src={
                        editSubcategory.imagePreview ||
                        (typeof editSubcategory.image === "string"
                          ? editSubcategory.image
                          : PLACEHOLDER_IMAGE)
                      }
                      alt="Preview"
                      className="image-preview"
                      onError={handleImageError}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(true)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ) : (
                  <div className="upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, true)}
                      id="edit-image-upload"
                      style={{ display: "none" }}
                    />
                    <label htmlFor="edit-image-upload" className="upload-label">
                      <FaUpload />
                      <span>Click to upload new image</span>
                      <small>JPEG, PNG, GIF (Max 2MB)</small>
                    </label>
                  </div>
                )}
              </div>

              {editError && (
                <div className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  <span>{editError}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setEditSubcategory(null)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleEditSave}
                disabled={loading}
              >
                Update Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewSubcategory && (
        <div className="modal-overlay" onClick={() => setViewSubcategory(null)}>
          <div
            className="modal-box view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5>Subcategory Details</h5>
              <button
                className="modal-close"
                onClick={() => setViewSubcategory(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body view-body">
              <div className="view-image-container">
                <img
                  src={viewSubcategory.image || PLACEHOLDER_IMAGE}
                  alt={viewSubcategory.name}
                  className="view-image"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  onError={handleImageError}
                />
              </div>
              <div className="view-item">
                <span className="view-label">Subcategory Name:</span>
                <span className="view-value">{viewSubcategory.name}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Category:</span>
                <span className="view-value">
                  {getCategoryName(viewSubcategory.categoryId)}
                </span>
              </div>
              <div className="view-item">
                <span className="view-label">Status:</span>
                <span
                  className={`view-status ${viewSubcategory.isBlocked ? "blocked" : "active"}`}
                >
                  {viewSubcategory.isBlocked ? "Blocked" : "Active"}
                </span>
              </div>
              <div className="view-item">
                <span className="view-label">ID:</span>
                <span className="view-value">{viewSubcategory.id}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setViewSubcategory(null)}
              >
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
              <button
                className="btn-delete"
                onClick={confirmDelete}
                disabled={loading}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
