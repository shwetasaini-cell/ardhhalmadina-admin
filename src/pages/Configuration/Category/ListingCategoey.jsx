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
  FaArrowLeft,
  FaImage,
  FaUpload,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CategoryManagement.css";
import axiosInstance from "../../../utils/axiosInstance";

export default function ListingCategoey() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    image: null,
    imagePreview: "",
  });
  const [editCategory, setEditCategory] = useState(null);
  const [viewCategory, setViewCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [CategoryLoading, setCategoryLoading] = useState(false);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/category");

      let categoriesData = [];
      const data = response.data;

      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data.data && Array.isArray(data.data)) {
        categoriesData = data.data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categoriesData = data.categories;
      } else if (data.result && Array.isArray(data.result)) {
        categoriesData = data.result;
      }

      const formattedCategories = categoriesData.map((cat) => ({
        id: cat._id,
        name: cat.name,
        description: cat.description || "",
        isBlocked: cat.status === "blocked",
        image: cat.image || null,
      }));
      setCategories(formattedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      if (error.response?.status === 401) {
        showSuccessMessage("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        showSuccessMessage(
          `Failed to load categories: ${error.response?.data?.message || error.message}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const filteredCategories = categories.filter((category) => {
    const search = searchTerm.toLowerCase();
    return (
      category.name?.toLowerCase().includes(search) ||
      category.description?.toLowerCase().includes(search) ||
      String(category.id).toLowerCase().includes(search)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / itemsPerPage),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredCategories, totalPages]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const showSuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        if (isEdit) {
          setEditError(
            "Please upload a valid image file (JPEG, PNG, GIF, or WEBP)",
          );
        } else {
          setAddError(
            "Please upload a valid image file (JPEG, PNG, GIF, or WEBP)",
          );
        }
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        if (isEdit) {
          setEditError("Image size should be less than 5MB");
        } else {
          setAddError("Image size should be less than 5MB");
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditCategory({
            ...editCategory,
            image: file,
            imagePreview: reader.result,
          });
        } else {
          setNewCategory({
            ...newCategory,
            image: file,
            imagePreview: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async () => {
    if (!newCategory.name.trim()) {
      setAddError("Category name cannot be empty");
      return;
    }

    if (newCategory.name.length < 2) {
      setAddError("Category name must be at least 2 characters long");
      return;
    }

    if (newCategory.name.length > 50) {
      setAddError("Category name cannot exceed 50 characters");
      return;
    }

    if (!newCategory.description.trim()) {
      setAddError("Description cannot be empty");
      return;
    }

    if (newCategory.description.length < 5) {
      setAddError("Description must be at least 5 characters long");
      return;
    }

    if (newCategory.description.length > 200) {
      setAddError("Description cannot exceed 200 characters");
      return;
    }

    try {
      setLoading(true);
      setAddError("");

      const formData = new FormData();
      formData.append("name", newCategory.name.trim());
      formData.append("description", newCategory.description.trim());
      if (newCategory.image) {
        formData.append("image", newCategory.image);
      }

      const response = await axiosInstance.post("/category", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchCategories();
      setNewCategory({
        name: "",
        description: "",
        image: null,
        imagePreview: "",
      });
      setShowModal(false);
      showSuccessMessage(`Category "${newCategory.name}" added successfully!`);
    } catch (error) {
      console.error("Error adding category:", error);
      if (error.response) {
        setAddError(error.response.data.message || "Failed to add category");
      } else if (error.request) {
        setAddError("Network error: Unable to connect to server");
      } else {
        setAddError(error.message || "Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const categoryToDelete = categories.find((c) => c.id === id);
    setDeleteConfirm({
      id,
      name: categoryToDelete?.name,
      show: true,
      type: "category",
    });
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);

      if (deleteConfirm.type === "category") {
        await axiosInstance.delete(`/category/${deleteConfirm.id}`);

        const categoryName = deleteConfirm.name;

        await fetchCategories();

        if (selectedCategory?.id === deleteConfirm.id) {
          setSelectedCategory(null);
        }

        showSuccessMessage(`"${categoryName}" has been deleted successfully!`);
      }

      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting:", error);
      if (error.response) {
        showSuccessMessage(error.response.data.message || "Failed to delete");
      } else {
        showSuccessMessage("Failed to delete");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id) => {
    const categoryToToggle = categories.find((c) => c.id === id);

    try {
      setLoading(true);
      await axiosInstance.patch(`/category/status/${id}`);
      await fetchCategories();
      showSuccessMessage(
        `"${categoryToToggle.name}" status updated successfully`,
      );
    } catch (error) {
      console.error(error);
      showSuccessMessage("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editCategory.name.trim()) {
      setEditError("Category name cannot be empty");
      return;
    }

    if (editCategory.name.length < 2) {
      setEditError("Category name must be at least 2 characters long");
      return;
    }

    if (editCategory.name.length > 50) {
      setEditError("Category name cannot exceed 50 characters");
      return;
    }

    if (!editCategory.description.trim()) {
      setEditError("Description cannot be empty");
      return;
    }

    if (editCategory.description.length < 5) {
      setEditError("Description must be at least 5 characters long");
      return;
    }

    if (editCategory.description.length > 200) {
      setEditError("Description cannot exceed 200 characters");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", editCategory.name.trim());
      formData.append("description", editCategory.description.trim());
      if (editCategory.image && typeof editCategory.image !== "string") {
        formData.append("image", editCategory.image);
      }

      await axiosInstance.put(`/category/${editCategory.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchCategories();
      setEditCategory(null);
      setEditError("");
      showSuccessMessage(`Category has been updated successfully!`);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error.response) {
        setEditError(
          error.response.data.message || "Failed to update category",
        );
      } else {
        setEditError(error.message || "Failed to update category");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (isEdit = false) => {
    if (isEdit) {
      setEditCategory({ ...editCategory, image: null, imagePreview: "" });
    } else {
      setNewCategory({ ...newCategory, image: null, imagePreview: "" });
    }
  };

  return (
    <div className="category-container">
      {successMessage && (
        <div className="success-toast">
          <FaCheckCircle className="toast-icon" />
          <span>{successMessage}</span>
        </div>
      )}
      <div className="header-section">
        <div>
          <h3 className="page-title">
            {selectedCategory ? (
              <>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    background: "none",
                    border: "none",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                >
                  <FaArrowLeft />
                </button>
              </>
            ) : (
              "Category Management"
            )}
          </h3>
          <p className="page-subtitle">
            {selectedCategory
              ? "Manage subcategories for this category"
              : "Manage all product categories"}
          </p>
        </div>

        {!selectedCategory && (
          <div style={{ display: "flex", alignItems: "center" }}>
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
                placeholder="Search categories..."
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
                setNewCategory({
                  name: "",
                  description: "",
                  image: null,
                  imagePreview: "",
                });
              }}
              style={{ whiteSpace: "nowrap" }}
              disabled={loading}
            >
              <FaPlus style={{ marginRight: "8px" }} /> Add Category
            </button>
          </div>
        )}

        {selectedCategory && (
          <div style={{ display: "flex", alignItems: "center" }}></div>
        )}
      </div>

      <div className="content-wrapper">
        <div className="table-responsive">
          {loading || CategoryLoading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {!selectedCategory ? (
                <>
                  <table className="material-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Image</th>
                        <th>Category Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((category, index) => (
                          <tr key={category.id}>
                            <td className="sr-cell">
                              {indexOfFirstItem + index + 1}
                            </td>
                            <td className="image-cell">
                              {category.image ? (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    backgroundColor: "#f0f0f0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <FaImage color="#999" />
                                </div>
                              )}
                            </td>
                            <td
                              className="name-cell"
                              style={{ cursor: "pointer", color: "#007bff" }}
                              onClick={() => setSelectedCategory(category)}
                            >
                              <strong>{category.name}</strong>
                            </td>
                            <td className="description-cell">
                              {category.description?.length > 60
                                ? `${category.description.substring(0, 60)}...`
                                : category.description}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${
                                  category.isBlocked ? "blocked" : "active"
                                }`}
                              >
                                {category.isBlocked ? "Blocked" : "Active"}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <div className="action-buttons">
                                <button
                                  className="table-action-btn view-btn"
                                  onClick={() => setViewCategory(category)}
                                  title="View"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="table-action-btn edit-btn"
                                  onClick={() => {
                                    setEditCategory({
                                      ...category,
                                      imagePreview: category.image,
                                    });
                                    setEditError("");
                                  }}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="table-action-btn delete-btn"
                                  onClick={() => handleDelete(category.id)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                                <button
                                  className={`table-action-btn ${
                                    category.isBlocked
                                      ? "unlock-btn"
                                      : "lock-btn"
                                  }`}
                                  onClick={() => toggleBlock(category.id)}
                                  title={
                                    category.isBlocked ? "Unblock" : "Block"
                                  }
                                >
                                  {category.isBlocked ? (
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
                              <p>No categories found</p>
                              <button
                                className="btn-add-small"
                                onClick={() => setShowModal(true)}
                              >
                                <FaPlus /> Add Your First Category
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredCategories.length > 0 && (
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
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                          ).map((number) => {
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
                          })}
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
                        {Math.min(indexOfLastItem, filteredCategories.length)}{" "}
                        of {filteredCategories.length} categories
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <></>
              )}
            </>
          )}
        </div>
      </div>

      {/* ADD CATEGORY MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Add New Category</h5>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <label className="input-label">Category Image *</label>
              <div className="image-upload-container">
                {newCategory.imagePreview ? (
                  <div className="image-previews">
                    <img
                      src={newCategory.imagePreview}
                      alt="Category preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(false)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <label className="image-upload-label">
                    <FaUpload />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={(e) => handleImageChange(e, false)}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
                {!newCategory.imagePreview && (
                  <div className="image-hint">
                    Recommended: 500x500px, max 5MB (JPEG, PNG, GIF, WEBP)
                  </div>
                )}
              </div>

              <label className="input-label">Category Name *</label>
              <input
                className={`modal-input ${addError ? "error" : ""}`}
                placeholder="Enter category name"
                value={newCategory.name}
                onChange={(e) => {
                  setNewCategory({ ...newCategory, name: e.target.value });
                  if (addError) setAddError("");
                }}
                autoFocus
              />

              <label className="input-label" style={{ marginTop: "15px" }}>
                Description *
              </label>
              <textarea
                className={`modal-textarea ${addError ? "error" : ""}`}
                placeholder="Enter category description"
                value={newCategory.description}
                onChange={(e) => {
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  });
                  if (addError) setAddError("");
                }}
                rows="4"
              />
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
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {editCategory && (
        <div className="modal-overlay" onClick={() => setEditCategory(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Edit Category</h5>
              <button
                className="modal-close"
                onClick={() => setEditCategory(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <label className="input-label">Category Image</label>
              <div className="image-upload-container">
                {editCategory.imagePreview ? (
                  <div className="image-previews">
                    <img
                      src={editCategory.imagePreview}
                      alt="Category preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(true)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <label className="image-upload-label">
                    <FaUpload />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={(e) => handleImageChange(e, true)}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
                {!editCategory.imagePreview && (
                  <div className="image-hint">
                    Recommended: 500x500px, max 5MB (JPEG, PNG, GIF, WEBP)
                  </div>
                )}
              </div>

              <label className="input-label">Category Name *</label>
              <input
                className={`modal-input ${editError ? "error" : ""}`}
                value={editCategory.name}
                onChange={(e) => {
                  setEditCategory({ ...editCategory, name: e.target.value });
                  if (editError) setEditError("");
                }}
              />

              <label className="input-label" style={{ marginTop: "15px" }}>
                Description *
              </label>
              <textarea
                className={`modal-textarea ${editError ? "error" : ""}`}
                value={editCategory.description}
                onChange={(e) => {
                  setEditCategory({
                    ...editCategory,
                    description: e.target.value,
                  });
                  if (editError) setEditError("");
                }}
                rows="4"
              />

              {editError && (
                <div className="error-message">
                  <FaExclamationTriangle className="error-icon" />
                  <span>{editError}</span>
                </div>
              )}
              <div className="input-hint">
                * Name: 2-50 characters | Description: 5-200 characters
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setEditCategory(null)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleEditSave}
                disabled={loading}
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW CATEGORY MODAL */}
      {viewCategory && (
        <div className="modal-overlay" onClick={() => setViewCategory(null)}>
          <div
            className="modal-box view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5>Category Details</h5>
              <button
                className="modal-close"
                onClick={() => setViewCategory(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body view-body">
              {viewCategory.image && (
                <div className="view-item">
                  <span className="view-label">Image:</span>
                  <div className="view-value">
                    <img
                      src={viewCategory.image}
                      alt={viewCategory.name}
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="view-item">
                <span className="view-label">Category Name:</span>
                <span className="view-value">{viewCategory.name}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Description:</span>
                <span className="view-value">{viewCategory.description}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Status:</span>
                <span
                  className={`view-status ${viewCategory.isBlocked ? "blocked" : "active"}`}
                >
                  {viewCategory.isBlocked ? "Blocked" : "Active"}
                </span>
              </div>
              <div className="view-item">
                <span className="view-label">ID:</span>
                <span className="view-value">{viewCategory.id}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setViewCategory(null)}
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
