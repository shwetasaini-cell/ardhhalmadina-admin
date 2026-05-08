import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaEye,
  FaTimes,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaPlus,
  FaBoxes,
  FaDollarSign,
  FaCheckCircle,
  FaTimesCircle,
  FaWarehouse,
  FaExclamationTriangle,
  FaFilter,
  FaSortAmountDown,
  FaToggleOn,
  FaToggleOff,
  FaBan,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Addmaterial.css";
import axiosInstance from "../../../utils/axiosInstance";

export default function MaterialList() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updating, setUpdating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const perPage = 5;

  const [formData, setFormData] = useState({
    materialName: "",
    categoryId: "",
    subCategoryId: "",
    unit: "",
    quantity: "",
    sellingPrice: "",
    supplierName: "",
    addressLine: "",
    description: "",
    listingType: "sell",
    coordinates: "",
    photos: [],
  });

  // =========================
  // LOAD CATEGORIES
  // =========================

  const loadCategories = async () => {
    try {
      const response = await axiosInstance.get("/category");

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
      }

      setCategories(categoriesData);
      return categoriesData;
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
      return [];
    }
  };

  // =========================
  // LOAD SUBCATEGORIES
  // =========================

  const loadAllSubCategories = async () => {
    try {
      const response = await axiosInstance.get("/subcategory");

      let subData = [];
      if (response.data && Array.isArray(response.data)) {
        subData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        subData = response.data.data;
      } else if (
        response.data?.subcategories &&
        Array.isArray(response.data.subcategories)
      ) {
        subData = response.data.subcategories;
      }

      setSubCategories(subData);
      return subData;
    } catch (error) {
      console.error("Error loading subcategories:", error);
      return [];
    }
  };

  // =========================
  // LOAD MATERIALS
  // =========================

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/material");

      let materialsData = [];
      if (response.data && Array.isArray(response.data)) {
        materialsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        materialsData = response.data.data;
      } else if (
        response.data?.materials &&
        Array.isArray(response.data.materials)
      ) {
        materialsData = response.data.materials;
      }

      let allCategories = categories;
      let allSubCategories = subCategories;

      if (allCategories.length === 0) {
        allCategories = await loadCategories();
      }
      if (allSubCategories.length === 0) {
        allSubCategories = await loadAllSubCategories();
      }

      const transformedMaterials = materialsData.map((material) => {
        let categoryName = "-";
        const categoryId = material.categoryId;
        if (categoryId) {
          const foundCategory = allCategories.find(
            (c) =>
              (c._id || c.id) ===
              (typeof categoryId === "object" ? categoryId._id : categoryId)
          );
          categoryName = foundCategory ? foundCategory.name : "-";
        }

        let subCategoryName = "-";
        const subCategoryId = material.subCategoryId;
        if (subCategoryId) {
          const foundSubCategory = allSubCategories.find(
            (s) =>
              (s._id || s.id) ===
              (typeof subCategoryId === "object"
                ? subCategoryId._id
                : subCategoryId)
          );
          subCategoryName = foundSubCategory ? foundSubCategory.name : "-";
        }

        const quantity = material.quantity || 0;
        let stockStatus = "In Stock";
        if (quantity === 0) stockStatus = "Out of Stock";
        else if (quantity < 50) stockStatus = "Low Stock";

        const apiStatus = material.status || "active";
        const price = material.sellDetails?.sellingPrice || material.sellingPrice || 0;

        return {
          id: material._id,
          name: material.materialName || "Unnamed",
          category: categoryName,
          categoryId: material.categoryId,
          subCategory: subCategoryName,
          subCategoryId: material.subCategoryId,
          unit: material.unit || "units",
          quantity: quantity,
          price: price,
          supplier: material.supplierName || "Unknown",
          location: material.addressLine || "Not specified",
          stockStatus: stockStatus,
          status: apiStatus,
          description: material.description || "",
          listingType: material.listingType || "sell",
          photos: material.photos || [],
          coordinates: material.coordinates || "",
          createdAt: material.createdAt
            ? new Date(material.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
        };
      });

      setMaterials(transformedMaterials);
    } catch (error) {
      console.error("Error loading materials:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UPDATE MATERIAL STATUS (PATCH - Only status change)
  // =========================
  const updateMaterialStatus = async (materialId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await axiosInstance.patch(
        `/material/status/${materialId}`,
        { status: newStatus }
      );

      if (response.data && response.data.success !== false) {
        toast.success(`Status updated to ${newStatus === "active" ? "Active" : "Blocked"}`);
        await loadMaterials();
      } else {
        toast.error(response.data?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Toggle status between active and blocked
  const toggleStatus = (materialId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    updateMaterialStatus(materialId, newStatus);
  };

  // =========================
  // PERMANENT DELETE MATERIAL (DELETE API - No status change)
  // =========================
  const handlePermanentDelete = async () => {
    if (!materialToDelete) return;

    setDeleting(true);
    try {
      // PERMANENT DELETE - Material completely removed from database
      const response = await axiosInstance.delete(`/material/${materialToDelete.id}`);

      if (response.data && response.data.success !== false) {
        toast.success(`"${materialToDelete.name}" permanently deleted successfully!`);
        setShowDeleteModal(false);
        setMaterialToDelete(null);
        await loadMaterials(); // Refresh the list
      } else {
        toast.error(response.data?.message || "Failed to delete material");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      if (error.response?.status === 404) {
        toast.error("Material not found");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to delete this material");
      } else {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    } finally {
      setDeleting(false);
    }
  };

  // =========================
  // UPDATE MATERIAL (PUT - Update material details)
  // =========================
  const handleUpdateMaterial = async () => {
    if (!selectedMaterial) return;

    if (!formData.materialName) {
      toast.error("Material name required");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Category required");
      return;
    }

    if (!formData.sellingPrice) {
      toast.error("Selling price required");
      return;
    }

    setUpdating(true);
    try {
      const formDataToSend = new FormData();

      formDataToSend.append("materialName", formData.materialName);
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("sellingPrice", formData.sellingPrice);

      if (formData.subCategoryId)
        formDataToSend.append("subCategoryId", formData.subCategoryId);
      if (formData.unit) formDataToSend.append("unit", formData.unit);
      if (formData.quantity)
        formDataToSend.append("quantity", formData.quantity);
      if (formData.supplierName)
        formDataToSend.append("supplierName", formData.supplierName);
      if (formData.addressLine)
        formDataToSend.append("addressLine", formData.addressLine);
      if (formData.description)
        formDataToSend.append("description", formData.description);
      if (formData.listingType)
        formDataToSend.append("listingType", formData.listingType);
      if (formData.coordinates)
        formDataToSend.append("coordinates", formData.coordinates);

      const newPhotos = formData.photos.filter((p) => p instanceof File);
      newPhotos.forEach((photo) => {
        formDataToSend.append("photos", photo);
      });

      const response = await axiosInstance.put(
        `/material/${selectedMaterial.id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.success !== false) {
        toast.success("Material updated successfully");
        setShowEditModal(false);
        resetForm();
        await loadMaterials();
      } else {
        toast.error(response.data?.message || "Failed to update material");
      }
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  // =========================
  // ADD MATERIAL
  // =========================

  const handleAddMaterial = async () => {
    try {
      if (!formData.materialName) {
        toast.error("Material name required");
        return;
      }

      if (!formData.categoryId) {
        toast.error("Category required");
        return;
      }

      if (!formData.sellingPrice) {
        toast.error("Selling price required");
        return;
      }

      if (!formData.quantity && formData.quantity !== 0) {
        toast.error("Quantity required");
        return;
      }

      if (formData.quantity < 0) {
        toast.error("Quantity cannot be negative");
        return;
      }

      let coordinatesToSend = "";
      if (formData.coordinates && formData.coordinates.trim()) {
        const trimmedCoordinates = formData.coordinates.trim();
        const coordinatePattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

        if (!coordinatePattern.test(trimmedCoordinates)) {
          toast.error(
            "Coordinates format should be: longitude,latitude (Example: 80.9462,26.8467)"
          );
          return;
        }
        coordinatesToSend = trimmedCoordinates;
      }

      const formDataToSend = new FormData();

      formDataToSend.append("materialName", formData.materialName);
      formDataToSend.append("categoryId", formData.categoryId);
      if (formData.subCategoryId)
        formDataToSend.append("subCategoryId", formData.subCategoryId);
      if (formData.unit) formDataToSend.append("unit", formData.unit);
      if (formData.quantity)
        formDataToSend.append("quantity", formData.quantity);
      formDataToSend.append("sellingPrice", formData.sellingPrice);
      if (formData.supplierName)
        formDataToSend.append("supplierName", formData.supplierName);
      if (formData.addressLine)
        formDataToSend.append("addressLine", formData.addressLine);
      if (formData.description)
        formDataToSend.append("description", formData.description);
      formDataToSend.append("listingType", formData.listingType);
      if (coordinatesToSend)
        formDataToSend.append("coordinates", coordinatesToSend);

      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach((photo) => {
          if (photo instanceof File) {
            formDataToSend.append("photos", photo);
          }
        });
      }

      const response = await axiosInstance.post(
        "/material/create",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.success !== false) {
        toast.success("Material Added Successfully");
        setShowAddModal(false);
        resetForm();
        await loadMaterials();
      } else {
        toast.error(response.data?.message || "Failed to add material");
      }
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setFormData({
      materialName: "",
      categoryId: "",
      subCategoryId: "",
      unit: "",
      quantity: "",
      sellingPrice: "",
      supplierName: "",
      addressLine: "",
      description: "",
      listingType: "sell",
      coordinates: "",
      photos: [],
    });
  };

  // =========================
  // GET SUBCATEGORIES FOR A CATEGORY
  // =========================

  const getSubCategoriesByCategory = (categoryId) => {
    if (!categoryId) return [];

    return subCategories.filter((sub) => {
      const subCategoryId =
        typeof sub.categoryId === "object"
          ? sub.categoryId?._id
          : sub.categoryId;
      return String(subCategoryId) === String(categoryId);
    });
  };

  // =========================
  // CATEGORY CHANGE
  // =========================

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setFormData({
      ...formData,
      categoryId,
      subCategoryId: "",
    });
  };

  // =========================
  // PHOTO UPLOAD
  // =========================

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));
  };

  // =========================
  // REMOVE PHOTO
  // =========================

  const removePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const openEditModal = (material) => {
    setSelectedMaterial(material);
    setFormData({
      materialName: material.name,
      categoryId:
        typeof material.categoryId === "object"
          ? material.categoryId?._id
          : material.categoryId || "",
      subCategoryId:
        typeof material.subCategoryId === "object"
          ? material.subCategoryId?._id
          : material.subCategoryId || "",
      quantity: material.quantity || "",
      unit: material.unit || "",
      sellingPrice: material.price || "",
      supplierName: material.supplier || "",
      addressLine: material.location || "",
      description: material.description || "",
      listingType: material.listingType || "sell",
      coordinates: material.coordinates || "",
      photos: material.photos?.filter((p) => typeof p === "string") || [],
    });
    setShowEditModal(true);
  };

  // =========================
  // GET STOCK STATUS BADGE
  // =========================

  const getStockStatusBadge = (stockStatus) => {
    switch (stockStatus) {
      case "In Stock":
        return (
          <span className="badge-status badge-success">
            <FaCheckCircle /> In Stock
          </span>
        );
      case "Low Stock":
        return (
          <span className="badge-status badge-warning">
            <FaExclamationTriangle /> Low Stock
          </span>
        );
      case "Out of Stock":
        return (
          <span className="badge-status badge-danger">
            <FaTimesCircle /> Out of Stock
          </span>
        );
      default:
        return (
          <span className="badge-status badge-secondary">
            <FaInfoCircle /> {stockStatus}
          </span>
        );
    }
  };

  // =========================
  // GET API STATUS BADGE
  // =========================

  const getApiStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="badge-status badge-success">
            <FaCheckCircle /> Active
          </span>
        );
      case "inactive":
        return (
          <span className="badge-status badge-warning">
            <FaExclamationTriangle /> Inactive
          </span>
        );
      case "blocked":
        return (
          <span className="badge-status badge-danger">
            <FaBan /> Blocked
          </span>
        );
      case "deleted":
        return (
          <span className="badge-status badge-danger">
            <FaTimesCircle /> Deleted
          </span>
        );
      default:
        return (
          <span className="badge-status badge-secondary">
            <FaInfoCircle /> {status}
          </span>
        );
    }
  };

  // =========================
  // FILTERS & PAGINATION
  // =========================

  const materialCategories = [
    "all",
    ...new Set(materials.map((m) => m.category).filter((c) => c !== "-")),
  ];
  const statuses = ["all", "active", "inactive", "blocked", "deleted"];

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || material.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || material.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMaterials.length / perPage);
  const currentMaterials = filteredMaterials.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Stats
  const totalValue = materials.reduce(
    (sum, m) => sum + (m.quantity || 0) * (m.price || 0),
    0
  );
  const lowStockCount = materials.filter(
    (m) => m.stockStatus === "Low Stock"
  ).length;
  const inStockCount = materials.filter(
    (m) => m.stockStatus === "In Stock"
  ).length;

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    const init = async () => {
      await loadCategories();
      await loadAllSubCategories();
      await loadMaterials();
    };
    init();
  }, []);

  return (
    <div className="material-page">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Material Inventory</h1>
          <p className="page-subtitle">
            Manage and track all construction materials
          </p>
        </div>
        <div className="header-right">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn-add"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FaPlus /> Add Material
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {materialCategories
              .filter((c) => c !== "all")
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>
        </div>
        <div className="filter-group">
          <FaSortAmountDown className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading materials...</p>
          </div>
        ) : (
          <>
            <table className="material-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Sub Category</th>
                  <th>Supplier</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentMaterials.length > 0 ? (
                  currentMaterials.map((material) => (
                    <tr key={material.id}>
                      <td>
                        <div className="material-name">{material.name}</div>
                      </td>
                      <td>
                        <span className="category-tag">
                          {material.category}
                        </span>
                      </td>
                      <td>{material.subCategory}</td>
                      <td>{material.supplier}</td>
                      <td>{material.price ? `₹${material.price}` : "-"}</td>
                      <td>{material.location}</td>
                      <td>{getApiStatusBadge(material.status)}</td>
                      <td>
                        <div className="action-group">
                          <button
                            className="action-icon view"
                            onClick={() => {
                              setSelectedMaterial(material);
                              setShowViewModal(true);
                            }}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="action-icon edit"
                            onClick={() => openEditModal(material)}
                            title="Edit Material"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-icon delete"
                            onClick={() => {
                              setMaterialToDelete(material);
                              setShowDeleteModal(true);
                            }}
                            title="Permanently Delete Material"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        {/* Toggle Switch for Active/Blocked Status */}
                        <div className="status-toggle-container">
                          <button
                            className={`small-toggle-btn ${material.status === "active" ? "active" : "blocked"}`}
                            onClick={() => toggleStatus(material.id, material.status)}
                            disabled={updatingStatus}
                            title={
                              material.status === "active"
                                ? "Click to Block"
                                : "Click to Activate"
                            }
                          >
                            {material.status === "active" ? (
                              <FaToggleOn className="small-toggle-icon" />
                            ) : material.status === "blocked" ? (
                              <FaToggleOff className="small-toggle-icon" />
                            ) : (
                              <FaTimesCircle className="small-toggle-icon" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <FaBoxes className="empty-icon" />
                      <p>No materials found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={currentPage === i + 1 ? "active" : ""}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <FaPlus /> Add Material
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="input-group">
                  <label>Material Name *</label>
                  <input
                    type="text"
                    value={formData.materialName}
                    onChange={(e) =>
                      setFormData({ ...formData, materialName: e.target.value })
                    }
                    placeholder="Enter material name"
                  />
                </div>
                <div className="input-group">
                  <label>Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={handleCategoryChange}
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
                </div>
                <div className="input-group">
                  <label>Sub Category</label>
                  <select
                    value={formData.subCategoryId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subCategoryId: e.target.value,
                      })
                    }
                    disabled={!formData.categoryId}
                  >
                    <option value="">Select Sub Category</option>
                    {getSubCategoriesByCategory(formData.categoryId).map(
                      (sub) => (
                        <option
                          key={sub._id || sub.id}
                          value={sub._id || sub.id}
                        >
                          {sub.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className="input-group">
                  <label>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  >
                    <option value="">Select Unit</option>
                    <option value="kg">kg</option>
                    <option value="bags">bags</option>
                    <option value="tons">tons</option>
                    <option value="pieces">pieces</option>
                    <option value="cubic ft">cubic ft</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="input-group">
                  <label>Selling Price *</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: e.target.value })
                    }
                    placeholder="Enter price"
                  />
                </div>
                <div className="input-group">
                  <label>Supplier Name</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierName: e.target.value })
                    }
                    placeholder="Supplier name"
                  />
                </div>
                <div className="input-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) =>
                      setFormData({ ...formData, addressLine: e.target.value })
                    }
                    placeholder="Address"
                  />
                </div>
                <div className="input-group">
                  <label>Listing Type</label>
                  <select
                    value={formData.listingType}
                    onChange={(e) =>
                      setFormData({ ...formData, listingType: e.target.value })
                    }
                  >
                    <option value="sell">Sell</option>
                    <option value="rent">Rent</option>
                    <option value="lease">Lease</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Coordinates (longitude,latitude)</label>
                  <input
                    type="text"
                    placeholder="Enter coordinates (e.g., 80.9462,26.8467)"
                    value={formData.coordinates}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinates: e.target.value })
                    }
                  />
                </div>
                <div className="input-group full-width">
                  <label>Photos</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  {formData.photos.length > 0 && (
                    <div className="photo-preview">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="photo-preview-item">
                          <img
                            src={
                              photo instanceof File
                                ? URL.createObjectURL(photo)
                                : photo
                            }
                            alt="Preview"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="input-group full-width">
                  <label>Description</label>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Material description"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddMaterial}>
                Add Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMaterial && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <FaEdit /> Edit Material
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="input-group">
                  <label>Material Name *</label>
                  <input
                    type="text"
                    value={formData.materialName}
                    onChange={(e) =>
                      setFormData({ ...formData, materialName: e.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={handleCategoryChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Sub Category</label>
                  <select
                    value={formData.subCategoryId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subCategoryId: e.target.value,
                      })
                    }
                    disabled={!formData.categoryId}
                  >
                    <option value="">Select Sub Category</option>
                    {getSubCategoriesByCategory(formData.categoryId).map(
                      (sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className="input-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  >
                    <option value="">Select Unit</option>
                    <option value="bags">bags</option>
                    <option value="kg">kg</option>
                    <option value="pieces">pieces</option>
                    <option value="cubic ft">cubic ft</option>
                    <option value="liters">liters</option>
                    <option value="tons">tons</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: e.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Supplier Name</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierName: e.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Address / Location</label>
                  <input
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) =>
                      setFormData({ ...formData, addressLine: e.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Listing Type</label>
                  <select
                    value={formData.listingType}
                    onChange={(e) =>
                      setFormData({ ...formData, listingType: e.target.value })
                    }
                  >
                    <option value="sell">Sell</option>
                    <option value="rent">Rent</option>
                    <option value="lease">Lease</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Coordinates</label>
                  <input
                    type="text"
                    placeholder="longitude,latitude"
                    value={formData.coordinates}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinates: e.target.value })
                    }
                  />
                </div>
                <div className="input-group full-width">
                  <label>Photos</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  {formData.photos.length > 0 && (
                    <div className="photo-preview">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="photo-preview-item">
                          <img
                            src={
                              photo instanceof File
                                ? URL.createObjectURL(photo)
                                : photo
                            }
                            alt="Preview"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="input-group full-width">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowEditModal(false)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleUpdateMaterial}
                disabled={updating}
              >
                {updating ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedMaterial && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
          >
            <div className="modal-header">
              <h3>
                <FaInfoCircle /> Material Details
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowViewModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div
                className="detail-header"
                style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "20px",
                  alignItems: "center",
                }}
              >
                {selectedMaterial.photos?.[0] ? (
                  <img
                    src={selectedMaterial.photos[0]}
                    alt={selectedMaterial.name}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <div
                    className="detail-avatar"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: "#007bff",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "12px",
                      fontSize: "32px",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedMaterial.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0 }}>{selectedMaterial.name}</h2>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    ID: {selectedMaterial.id}
                  </p>
                </div>
              </div>

              {selectedMaterial.photos?.length > 0 && (
                <div className="photo-gallery" style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      marginBottom: "10px",
                      display: "block",
                    }}
                  >
                    Photos
                  </label>
                  <div
                    className="photo-list"
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    {selectedMaterial.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt="Material"
                        className="material-photo"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                        }}
                        onClick={() => window.open(photo, "_blank")}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                className="detail-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "15px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Category
                  </label>
                  <p style={{ margin: 0 }}>{selectedMaterial.category}</p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Sub Category
                  </label>
                  <p style={{ margin: 0 }}>{selectedMaterial.subCategory}</p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Quantity
                  </label>
                  <p style={{ margin: 0 }}>
                    {selectedMaterial.quantity} {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Unit Price
                  </label>
                  <p style={{ margin: 0 }}>
                    ₹{selectedMaterial.price?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Supplier
                  </label>
                  <p style={{ margin: 0 }}>{selectedMaterial.supplier}</p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Location
                  </label>
                  <p style={{ margin: 0 }}>{selectedMaterial.location}</p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Stock Status
                  </label>
                  <p style={{ margin: 0 }}>
                    {getStockStatusBadge(selectedMaterial.stockStatus)}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    API Status
                  </label>
                  <p style={{ margin: 0 }}>
                    {getApiStatusBadge(selectedMaterial.status)}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Listing Type
                  </label>
                  <p style={{ margin: 0 }}>
                    {selectedMaterial.listingType || "Sell"}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Coordinates
                  </label>
                  <p style={{ margin: 0 }}>
                    {selectedMaterial.coordinates || "Not provided"}
                  </p>
                </div>
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#555",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Created
                  </label>
                  <p style={{ margin: 0 }}>{selectedMaterial.createdAt}</p>
                </div>
                {selectedMaterial.description && (
                  <div className="full-width" style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#555",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      Description
                    </label>
                    <p style={{ margin: 0, lineHeight: "1.5" }}>
                      {selectedMaterial.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowViewModal(false)}
                style={{
                  padding: "8px 20px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {showDeleteModal && materialToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-danger">
                <FaTrash /> Permanently Delete Material
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body text-center">
              <FaTimesCircle className="delete-warning" style={{ fontSize: "48px", color: "#dc3545", marginBottom: "16px" }} />
              <p>
                Are you sure you want to <strong style={{ color: "#dc3545" }}>PERMANENTLY DELETE</strong>{" "}
                <strong>{materialToDelete.name}</strong>?
              </p>
              <p className="text-muted" style={{ color: "#6c757d", marginTop: "8px" }}>
                This action cannot be undone. The material will be completely removed from the database.
              </p>
              <div style={{ 
                background: "#fff3cd", 
                padding: "10px", 
                borderRadius: "6px", 
                marginTop: "16px",
                fontSize: "12px",
                color: "#856404"
              }}>
                ⚠️ Warning: This is permanent deletion, not just status change.
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handlePermanentDelete}
                disabled={deleting}
                style={{
                  background: "#dc3545",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1
                }}
              >
                {deleting ? "Deleting..." : "Yes, Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}