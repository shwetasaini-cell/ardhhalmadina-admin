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
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaFilter,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Vechicles.css";
import axiosInstance from "../../../utils/axiosInstance";

const vehicleStatuses = ["active", "inactive", "blocked", "deleted"];



const getStatusDisplay = (status) => {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "In Active";
    case "blocked":
      return "Blocked";
    case "deleted":
      return "Deleted";
    default:
      return status;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case "active":
      return "badge-success";
    case "inactive":
      return "badge-secondary";
    case "blocked":
      return "badge-danger";
    case "deleted":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
};

export default function VehicleManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all"); // New: vehicle, machinery, equipment
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [categories, setCategories] = useState([]);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState({
    vehicleName: "",
    description: "",
    status: "active",
    addressLine: "",
    companyName: "",
    vehicleRC: "",
    categoryId: "",
    listingType: "rent",
    dailyRate: "",
    weeklyRate: "",
    monthlyRate: "",
    latitude: "28.7041",
    longitude: "77.1025",
    photos: [],
    equipmentCategory: "equipment", // vehicle, machinery, equipment
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  // Debounce search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await axiosInstance.get("/category");
      let categoriesData = [];
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // Fetch vehicles with filters
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      let url = `/listings/?listingCategory=${categoryFilter === "all" ? "equipment" : categoryFilter}`;

      if (listingTypeFilter !== "all")
        url += `&listingType=${listingTypeFilter}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (debouncedSearchTerm)
        url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;

      const response = await axiosInstance.get(url);
      const result = response.data;

      if (result.success) {
        let allItems = [];

        if (categoryFilter === "all") {
          // Fetch all categories
          const [vehicleRes, machineryRes, equipmentRes] = await Promise.all([
            axiosInstance.get(
              `/listings/?listingCategory=vehicle&listingType=${listingTypeFilter !== "all" ? listingTypeFilter : ""}&status=${statusFilter !== "all" ? statusFilter : ""}&search=${debouncedSearchTerm ? encodeURIComponent(debouncedSearchTerm) : ""}`,
            ),
            axiosInstance.get(
              `/listings/?listingCategory=machinery&listingType=${listingTypeFilter !== "all" ? listingTypeFilter : ""}&status=${statusFilter !== "all" ? statusFilter : ""}&search=${debouncedSearchTerm ? encodeURIComponent(debouncedSearchTerm) : ""}`,
            ),
            axiosInstance.get(
              `/listings/?listingCategory=equipment&listingType=${listingTypeFilter !== "all" ? listingTypeFilter : ""}&status=${statusFilter !== "all" ? statusFilter : ""}&search=${debouncedSearchTerm ? encodeURIComponent(debouncedSearchTerm) : ""}`,
            ),
          ]);
          allItems = [
            ...(vehicleRes.data?.data?.vehicle || vehicleRes.data?.data || []),
            ...(machineryRes.data?.data?.machinery ||
              machineryRes.data?.data ||
              []),
            ...(equipmentRes.data?.data?.equipment ||
              equipmentRes.data?.data ||
              []),
          ];
        } else {
          // Fetch specific category
          if (result.data && result.data[categoryFilter]) {
            allItems = result.data[categoryFilter];
          } else if (Array.isArray(result.data)) {
            allItems = result.data;
          }
        }

        const transformedVehicles = allItems.map((vehicle) => {
          let categoryName = "Equipment";
          if (vehicle.categoryId?.name) categoryName = vehicle.categoryId.name;

          let lat = 28.7041,
            lng = 77.1025;
          if (vehicle.location?.coordinates) {
            lng = vehicle.location.coordinates[0];
            lat = vehicle.location.coordinates[1];
          }

          return {
            id: vehicle._id,
            name: vehicle.name,
            vehicleType: categoryName,
            registrationNo: vehicle.uniqueCode || "N/A",
            status: vehicle.status,
            dailyRate: vehicle.rentDetails?.dailyRate || 0,
            weeklyRate: vehicle.rentDetails?.weeklyRate || 0,
            monthlyRate: vehicle.rentDetails?.monthlyRate || 0,
            location: vehicle.addressLine,
            description: vehicle.description,
            createdAt: new Date(vehicle.createdAt).toLocaleDateString(),
            companyName: vehicle.companyName,
            listingType: vehicle.listingType,
            photos: vehicle.photos || [],
            coordinates: [lng, lat],
            equipmentCategory: vehicle.listingCategory || "equipment",
            categoryId:
              typeof vehicle.categoryId === "object"
                ? vehicle.categoryId._id
                : vehicle.categoryId,
          };
        });

        setItems(transformedVehicles);
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error("Error loading vehicles");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add vehicle
  const handleAddVehicle = async () => {
    if (!formData.vehicleName || !formData.dailyRate) {
      toast.error("Vehicle name and daily rate are required");
      return;
    }

    setUploading(true);
    try {
      const vehicleData = {
        name: formData.vehicleName,
        companyName: formData.companyName,
        categoryId: formData.categoryId,
        uniqueCode: formData.vehicleRC,
        description: formData.description,
        addressLine: formData.addressLine,
        listingType: formData.listingType,
        status: "active",
        listingCategory: formData.equipmentCategory,
        rentDetails: {
          dailyRate: parseFloat(formData.dailyRate) || 0,
          weeklyRate: parseFloat(formData.weeklyRate) || 0,
          monthlyRate: parseFloat(formData.monthlyRate) || 0,
        },
        location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.longitude) || 77.1025,
            parseFloat(formData.latitude) || 28.7041,
          ],
        },
      };

      const response = await axiosInstance.post(
        "/listings/create",
        vehicleData,
      );

      if (response.data?.success) {
        const newVehicleId = response.data.data?.listing?._id;

        if (newVehicleId && selectedFiles.length > 0) {
          const photoFormData = new FormData();
          selectedFiles.forEach((file) => photoFormData.append("photos", file));
          await axiosInstance.post(
            `/listings/${newVehicleId}/upload-photos`,
            photoFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        }

        toast.success("Vehicle added successfully!");
        fetchVehicles();
        setShowAddModal(false);
        resetForm();
        setSelectedFiles([]);
      }
    } catch (error) {
      toast.error("Error adding vehicle");
      console.error("Add error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Edit vehicle
  const handleEditVehicle = async () => {
    if (!formData.vehicleName) {
      toast.error("Vehicle name is required");
      return;
    }

    setUploading(true);
    try {
      const vehicleData = {
        name: formData.vehicleName,
        companyName: formData.companyName,
        categoryId: formData.categoryId,
        uniqueCode: formData.vehicleRC,
        description: formData.description,
        addressLine: formData.addressLine,
        listingType: formData.listingType,
        status: formData.status,
        listingCategory: formData.equipmentCategory,
        rentDetails: {
          dailyRate: parseFloat(formData.dailyRate) || 0,
          weeklyRate: parseFloat(formData.weeklyRate) || 0,
          monthlyRate: parseFloat(formData.monthlyRate) || 0,
        },
        location: {
          type: "Point",
          coordinates: [
            parseFloat(formData.longitude) || 77.1025,
            parseFloat(formData.latitude) || 28.7041,
          ],
        },
      };

      const response = await axiosInstance.put(
        `/listings/${selectedItem.id}`,
        vehicleData,
      );

      if (response.data?.success) {
        if (selectedFiles.length > 0) {
          const photoFormData = new FormData();
          selectedFiles.forEach((file) => photoFormData.append("photos", file));
          await axiosInstance.post(
            `/listings/${selectedItem.id}/upload-photos`,
            photoFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        }
        toast.success("Vehicle updated successfully!");
        fetchVehicles();
        setShowEditModal(false);
        resetForm();
        setSelectedFiles([]);
      }
    } catch (error) {
      toast.error("Error updating vehicle");
      console.error("Update error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Update status
  const updateVehicleStatus = async (vehicleId, newStatus) => {
    try {
      const response = await axiosInstance.patch(
        `/listings/updateStatus/${vehicleId}`,
        { status: newStatus },
      );
      if (response.data?.success) {
        toast.success(`Status updated to ${getStatusDisplay(newStatus)}`);
        fetchVehicles();
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error("Status update error:", error);
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async () => {
    try {
      const response = await axiosInstance.delete(
        `/listings/${itemToDelete.id}`,
      );
      if (response.data?.success) {
        toast.success("Vehicle deleted successfully!");
        fetchVehicles();
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    } catch (error) {
      toast.error("Error deleting vehicle");
      console.error("Delete error:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      vehicleName: "",
      description: "",
      status: "active",
      addressLine: "",
      companyName: "",
      vehicleRC: "",
      categoryId: "",
      listingType: "rent",
      dailyRate: "",
      weeklyRate: "",
      monthlyRate: "",
      latitude: "28.7041",
      longitude: "77.1025",
      photos: [],
      equipmentCategory: "equipment",
    });
    setSelectedItem(null);
    setSelectedFiles([]);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      vehicleName: item.name,
      description: item.description || "",
      status: item.status,
      addressLine: item.location || "",
      companyName: item.companyName || "",
      vehicleRC: item.registrationNo || "",
      categoryId: item.categoryId || "",
      listingType: item.listingType || "rent",
      dailyRate: item.dailyRate || "",
      weeklyRate: item.weeklyRate || "",
      monthlyRate: item.monthlyRate || "",
      latitude: item.coordinates?.[1] || "28.7041",
      longitude: item.coordinates?.[0] || "77.1025",
      photos: item.photos || [],
      equipmentCategory: item.equipmentCategory || "equipment",
    });
    setSelectedFiles([]);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const icon =
      status === "active" ? (
        <FaCheckCircle />
      ) : status === "inactive" ? (
        <FaTimesCircle />
      ) : (
        <FaExclamationTriangle />
      );
    return (
      <span className={`badge-status ${getStatusClass(status)}`}>
        {icon} {getStatusDisplay(status)}
      </span>
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setListingTypeFilter("all");
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setCurrentPage(1);
  };

  // Stats
  const filteredItems = items.filter(
    (item) => statusFilter === "all" || item.status === statusFilter,
  );
  const totalItems = filteredItems.length;
  const availableCount = filteredItems.filter(
    (v) => v.status === "active",
  ).length;
  const inUseCount = filteredItems.filter(
    (v) => v.status === "inactive",
  ).length;
  const blockedCount = filteredItems.filter(
    (v) => v.status === "blocked",
  ).length;

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / perPage);
  const currentItems = filteredItems.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [categoryFilter, listingTypeFilter, statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, listingTypeFilter, debouncedSearchTerm]);

  // Styles for images
  const imageStyles = {
    thumbnail: {
      width: "50px",
      height: "50px",
      objectFit: "cover",
      borderRadius: "8px",
      marginRight: "12px",
    },
    avatar: {
      width: "80px",
      height: "80px",
      objectFit: "cover",
      borderRadius: "12px",
    },
    gallery: {
      width: "100px",
      height: "100px",
      objectFit: "cover",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "transform 0.2s",
    },
    preview: {
      width: "80px",
      height: "80px",
      objectFit: "cover",
      borderRadius: "8px",
    },
  };

  return (
    <div className="material-page">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="page-header headers-section">
        <div className="header-left">
          <h1 className="page-title">Vehicle & Equipment Management</h1>
          <p className="page-subtitle">
            Manage and track all construction equipment
          </p>
        </div>
        <div className="header-right">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FaBoxes />
          </div>
          <div className="stat-info">
            <h3>{totalItems}</h3>
            <p>Total Equipment</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{availableCount}</h3>
            <p>Available</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <FaTruck />
          </div>
          <div className="stat-info">
            <h3>{inUseCount}</h3>
            <p>In Use</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <FaExclamationTriangle />
          </div>
          <div className="stat-info">
            <h3>{blockedCount}</h3>
            <p>Blocked</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-header">
          <div className="filters-title">
            <FaFilter /> <span>Filters</span>
          </div>
          {(statusFilter !== "all" ||
            categoryFilter !== "all" ||
            listingTypeFilter !== "all" ||
            searchTerm) && (
            <button
              className="clear-filters-btn"
              onClick={clearAllFilters}
              style={{
                background: "none",
                border: "none",
                color: "#dc3545",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaTimes /> Clear All
            </button>
          )}
        </div>
        <div className="filters-grid">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="vehicle">Vehicles</option>
            <option value="machinery">Machinery</option>
            <option value="equipment">Equipment</option>
          </select>
          <select
            value={listingTypeFilter}
            onChange={(e) => setListingTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="rent">For Rent</option>
            <option value="sale">For Sale</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            {vehicleStatuses.map((s) => (
              <option key={s} value={s}>
                {getStatusDisplay(s)}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Display */}
        <div
          className="active-filters"
          style={{
            marginTop: "12px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {categoryFilter !== "all" && (
            <span
              className="filter-tag"
              style={{
                background: "#f0f0f0",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Category:{" "}
              {categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
              <FaTimes
                onClick={() => setCategoryFilter("all")}
                style={{ cursor: "pointer" }}
              />
            </span>
          )}
          {listingTypeFilter !== "all" && (
            <span
              className="filter-tag"
              style={{
                background: "#f0f0f0",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Type: {listingTypeFilter === "rent" ? "For Rent" : "For Sale"}
              <FaTimes
                onClick={() => setListingTypeFilter("all")}
                style={{ cursor: "pointer" }}
              />
            </span>
          )}
          {statusFilter !== "all" && (
            <span
              className="filter-tag"
              style={{
                background: "#f0f0f0",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Status: {getStatusDisplay(statusFilter)}
              <FaTimes
                onClick={() => setStatusFilter("all")}
                style={{ cursor: "pointer" }}
              />
            </span>
          )}
          {searchTerm && (
            <span
              className="filter-tag"
              style={{
                background: "#f0f0f0",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Search: {searchTerm}
              <FaTimes
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                }}
                style={{ cursor: "pointer" }}
              />
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            <table className="material-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Code</th>
                  <th>Rate</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {item.photos?.[0] && (
                            <img
                              src={item.photos[0]}
                              alt={item.name}
                              style={imageStyles.thumbnail}
                            />
                          )}
                          <div>
                            <div className="material-name">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="category-tag"
                          style={{
                            background: "#e0e7ff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          {item.equipmentCategory?.charAt(0).toUpperCase() +
                            item.equipmentCategory?.slice(1) || "Equipment"}
                        </span>
                      </td>
                      <td>
                        <span className="category-tag">{item.vehicleType}</span>
                      </td>
                      <td>{item.registrationNo}</td>
                      <td>
                        {item.listingType === "rent"
                          ? `₹${item.dailyRate}/day`
                          : `₹${item.dailyRate}`}
                      </td>
                      <td>{item.companyName || "N/A"}</td>
                      <td>{item.location || "N/A"}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <div className="action-group">
                          <button
                            className="action-icon view"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowViewModal(true);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              marginRight: "8px",
                            }}
                          >
                            <FaEye />
                          </button>
                        </div>
                        <select
                          onChange={(e) =>
                            updateVehicleStatus(item.id, e.target.value)
                          }
                          value={item.status}
                          className="status-select"
                          style={{
                            marginTop: "8px",
                            width: "100%",
                            padding: "4px",
                            fontSize: "12px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        >
                          {vehicleStatuses.map((s) => (
                            <option key={s} value={s}>
                              {getStatusDisplay(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      No equipment found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div
                className="pagination"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "20px",
                }}
              >
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={currentPage === i + 1 ? "active" : ""}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      background: currentPage === i + 1 ? "#2c8769" : "white",
                      color: currentPage === i + 1 ? "white" : "black",
                      cursor: "pointer",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    background: "white",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal - Equipment Category Selection */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "800px",
              width: "90%",
              background: "white",
              borderRadius: "12px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #eee",
              }}
            >
              <h3>
                <FaPlus /> Add Equipment
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "15px",
                }}
              >
                <input
                  type="text"
                  placeholder="Equipment Name *"
                  value={formData.vehicleName}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleName: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <select
                  value={formData.equipmentCategory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      equipmentCategory: e.target.value,
                    })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                >
                  <option value="vehicle">Vehicle</option>
                  <option value="machinery">Machinery</option>
                  <option value="equipment">Equipment</option>
                </select>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Unique Code"
                  value={formData.vehicleRC}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleRC: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <select
                  value={formData.listingType}
                  onChange={(e) =>
                    setFormData({ ...formData, listingType: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                >
                  <option value="rent">For Rent</option>
                  <option value="sale">For Sale</option>
                </select>
                <input
                  type="number"
                  placeholder="Daily Rate *"
                  value={formData.dailyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyRate: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="number"
                  placeholder="Weekly Rate"
                  value={formData.weeklyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, weeklyRate: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="number"
                  placeholder="Monthly Rate"
                  value={formData.monthlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyRate: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.addressLine}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  style={{ gridColumn: "span 2", padding: "10px" }}
                />
                <textarea
                  rows="3"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  style={{
                    gridColumn: "span 2",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
              </div>
              {selectedFiles.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  {selectedFiles.map((f, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(f)}
                      alt="Preview"
                      style={imageStyles.preview}
                    />
                  ))}
                </div>
              )}
            </div>
            <div
              className="modal-footer"
              style={{
                padding: "20px",
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: "8px 16px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddVehicle}
                disabled={uploading}
                style={{
                  padding: "8px 16px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? "Adding..." : "Add Equipment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => setShowViewModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "700px",
              width: "90%",
              background: "white",
              borderRadius: "12px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #eee",
              }}
            >
              <h3>
                <FaInfoCircle /> Equipment Details
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowViewModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "20px",
                  alignItems: "center",
                }}
              >
                {selectedItem.photos?.[0] ? (
                  <img
                    src={selectedItem.photos[0]}
                    alt={selectedItem.name}
                    style={imageStyles.avatar}
                  />
                ) : (
                  <div
                    style={{
                      ...imageStyles.avatar,
                      background: "#e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedItem.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0 }}>{selectedItem.name}</h2>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    ID: {selectedItem.id}
                  </p>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    Code: {selectedItem.registrationNo}
                  </p>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    Company: {selectedItem.companyName || "N/A"}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "15px",
                }}
              >
                <div>
                  <label style={{ fontWeight: "bold", color: "#555" }}>
                    Category
                  </label>
                  <p>
                    {selectedItem.equipmentCategory?.charAt(0).toUpperCase() +
                      selectedItem.equipmentCategory?.slice(1) || "Equipment"}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: "bold", color: "#555" }}>
                    Type
                  </label>
                  <p>{selectedItem.vehicleType}</p>
                </div>
                <div>
                  <label style={{ fontWeight: "bold", color: "#555" }}>
                    Listing Type
                  </label>
                  <p>
                    {selectedItem.listingType === "rent"
                      ? "For Rent"
                      : "For Sale"}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: "bold", color: "#555" }}>
                    Daily Rate
                  </label>
                  <p>₹{selectedItem.dailyRate}/day</p>
                </div>
                {selectedItem.listingType === "rent" && (
                  <div>
                    <label style={{ fontWeight: "bold", color: "#555" }}>
                      Weekly/Monthly
                    </label>
                    <p>
                      ₹{selectedItem.weeklyRate}/week | ₹
                      {selectedItem.monthlyRate}/month
                    </p>
                  </div>
                )}
                <div>
                  <label style={{ fontWeight: "bold", color: "#555" }}>
                    Location
                  </label>
                  <p>
                    <FaMapMarkerAlt /> {selectedItem.location || "N/A"}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: "bold", color: "#555" }}>
                    Status
                  </label>
                  <p>{getStatusBadge(selectedItem.status)}</p>
                </div>
                <div>
                  <label style={{ fontWeight: "bold", color: "#555" }}>
                    Created
                  </label>
                  <p>
                    <FaCalendarAlt /> {selectedItem.createdAt}
                  </p>
                </div>
                {selectedItem.description && (
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontWeight: "bold", color: "#555" }}>
                      Description
                    </label>
                    <p>{selectedItem.description}</p>
                  </div>
                )}
                {selectedItem.photos?.length > 0 && (
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontWeight: "bold", color: "#555" }}>
                      Gallery
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "10px",
                      }}
                    >
                      {selectedItem.photos.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          alt="Gallery"
                          style={imageStyles.gallery}
                          onClick={() => window.open(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className="modal-footer"
              style={{
                padding: "20px",
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowViewModal(false)}
                style={{
                  padding: "8px 16px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "800px",
              width: "90%",
              background: "white",
              borderRadius: "12px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #eee",
              }}
            >
              <h3>
                <FaEdit /> Edit Equipment
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "15px",
                }}
              >
                <input
                  type="text"
                  placeholder="Equipment Name *"
                  value={formData.vehicleName}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleName: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <select
                  value={formData.equipmentCategory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      equipmentCategory: e.target.value,
                    })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                >
                  <option value="vehicle">Vehicle</option>
                  <option value="machinery">Machinery</option>
                  <option value="equipment">Equipment</option>
                </select>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Unique Code"
                  value={formData.vehicleRC}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleRC: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <select
                  value={formData.listingType}
                  onChange={(e) =>
                    setFormData({ ...formData, listingType: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                >
                  <option value="rent">For Rent</option>
                  <option value="sale">For Sale</option>
                </select>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                >
                  {vehicleStatuses.map((s) => (
                    <option key={s} value={s}>
                      {getStatusDisplay(s)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Daily Rate *"
                  value={formData.dailyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyRate: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="number"
                  placeholder="Weekly Rate"
                  value={formData.weeklyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, weeklyRate: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="number"
                  placeholder="Monthly Rate"
                  value={formData.monthlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyRate: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.addressLine}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  style={{ gridColumn: "span 2", padding: "10px" }}
                />
                <textarea
                  rows="3"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  style={{
                    gridColumn: "span 2",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                />
              </div>
              {selectedFiles.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  {selectedFiles.map((f, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(f)}
                      alt="Preview"
                      style={imageStyles.preview}
                    />
                  ))}
                </div>
              )}
              {formData.photos?.length > 0 && !selectedFiles.length && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  {formData.photos.map((p, i) => (
                    <img
                      key={i}
                      src={p}
                      alt="Current"
                      style={imageStyles.preview}
                    />
                  ))}
                </div>
              )}
            </div>
            <div
              className="modal-footer"
              style={{
                padding: "20px",
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: "8px 16px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleEditVehicle}
                disabled={uploading}
                style={{
                  padding: "8px 16px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? "Updating..." : "Update Equipment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "400px",
              width: "90%",
              background: "white",
              borderRadius: "12px",
            }}
          >
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #eee",
              }}
            >
              <h3>
                <FaTrash /> Delete Equipment
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <p>Are you sure you want to delete "{itemToDelete.name}"?</p>
              <p style={{ color: "#dc3545", fontSize: "14px" }}>
                This action cannot be undone.
              </p>
            </div>
            <div
              className="modal-footer"
              style={{
                padding: "20px",
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "8px 16px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteVehicle}
                style={{
                  padding: "8px 16px",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
