import React, { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaEye,
  FaTimes,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaPlus,
  FaBoxes,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaFilter,
  FaSortAmountDown,
  FaToggleOn,
  FaToggleOff,
  FaBan,
  FaMapMarkerAlt,
  FaLocationArrow,
  FaImage,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Addmaterial.css";
import axiosInstance from "../../../utils/axiosInstance";

// Load Google Maps API script
const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector("#google-maps-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function MaterialList() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categories, setCategories] = useState([]);
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
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const perPage = 5;

  // Refs for Google Maps autocomplete
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [formData, setFormData] = useState({
    materialName: "",
    categoryId: "",
    price: "", // Changed from sellingPrice to price
    priceUnit: "perUnit",
    supplierName: "",
    addressLine: "",
    description: "",
    listingType: "sell",
    coordinates: "",
    photos: [],
  });

  // =========================
  // LOAD GOOGLE MAPS
  // =========================
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMapsScript(apiKey)
        .then(() => {
          setMapsLoaded(true);
        })
        .catch((error) => {
          console.error("Failed to load Google Maps:", error);
          toast.warning(
            "Address autocomplete not available. Please enter coordinates manually.",
          );
        });
    } else {
      console.warn("Google Maps API key not found");
      toast.warning(
        "Address autocomplete not configured. Please enter coordinates manually.",
      );
    }
  }, []);

  // Initialize autocomplete when maps are loaded and modal opens
  useEffect(() => {
    if (
      mapsLoaded &&
      (showAddModal || showEditModal) &&
      addressInputRef.current
    ) {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      autocompleteRef.current = new google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "in" },
        },
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const coordinates = `${lng},${lat}`;

          setFormData((prev) => ({
            ...prev,
            addressLine:
              place.formatted_address || addressInputRef.current.value,
            coordinates: coordinates,
          }));

          toast.success(`Location found: ${coordinates}`);
        } else {
          toast.warning("Please select a location from the dropdown");
        }
      });
    }
  }, [mapsLoaded, showAddModal, showEditModal]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = `${longitude},${latitude}`;

        setFormData((prev) => ({
          ...prev,
          coordinates: coordinates,
        }));

        // Reverse geocoding to get address
        if (mapsLoaded) {
          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results[0]) {
              setFormData((prev) => ({
                ...prev,
                addressLine: results[0].formatted_address,
              }));
            }
          });
        }

        toast.success(`Current location: ${coordinates}`);
        setFetchingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Please allow location access to use this feature");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information is unavailable");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out");
            break;
          default:
            toast.error("Failed to get current location");
        }
        setFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  // =========================
  // LOAD CATEGORIES
  // =========================

  const loadCategories = async () => {
    try {
      const response = await axiosInstance.get("/materialCategory/all");

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

      if (allCategories.length === 0) {
        allCategories = await loadCategories();
      }

      const transformedMaterials = materialsData.map((material) => {
        let categoryName = "-";
        const categoryId = material.categoryId;
        if (categoryId) {
          const foundCategory = allCategories.find(
            (c) =>
              (c._id || c.id) ===
              (typeof categoryId === "object" ? categoryId._id : categoryId),
          );
          categoryName = foundCategory ? foundCategory.name : "-";
        }

        const apiStatus = material.status || "active";
        const price = material.price || material.sellingPrice || 0; // Support both field names
        const priceUnit = material.priceUnit || "perUnit";

        let coordinates = "";
        if (material.location?.coordinates) {
          coordinates = `${material.location.coordinates[0]},${material.location.coordinates[1]}`;
        } else if (material.coordinates) {
          coordinates = material.coordinates;
        }

        return {
          id: material._id,
          name: material.materialName || "Unnamed",
          category: categoryName,
          categoryId: material.categoryId,
          price: price,
          priceUnit: priceUnit,
          supplier: material.supplierName || "Unknown",
          location: material.addressLine || "Not specified",
          status: apiStatus,
          description: material.description || "",
          listingType: material.listingType || "sell",
          photos: material.photos || [],
          coordinates: coordinates,
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
  // UPDATE MATERIAL STATUS
  // =========================
  const updateMaterialStatus = async (materialId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await axiosInstance.patch(
        `/material/status/${materialId}`,
        { status: newStatus },
      );

      if (response.data && response.data.success !== false) {
        toast.success(
          `Status updated to ${newStatus === "active" ? "Active" : "Blocked"}`,
        );
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

  const toggleStatus = (materialId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    updateMaterialStatus(materialId, newStatus);
  };

  // =========================
  // PERMANENT DELETE MATERIAL
  // =========================
  const handlePermanentDelete = async () => {
    if (!materialToDelete) return;

    setDeleting(true);
    try {
      const response = await axiosInstance.delete(
        `/material/${materialToDelete.id}`,
      );

      if (response.data && response.data.success !== false) {
        toast.success(
          `"${materialToDelete.name}" permanently deleted successfully!`,
        );
        setShowDeleteModal(false);
        setMaterialToDelete(null);
        await loadMaterials();
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
  // UPDATE MATERIAL
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

    if (!formData.price) {
      toast.error("Price required");
      return;
    }

    if (!formData.coordinates) {
      toast.error("Coordinates required. Please add location coordinates.");
      return;
    }

    // Validate coordinates format
    const coords = formData.coordinates.split(",");
    if (coords.length !== 2) {
      toast.error("Coordinates format should be: longitude,latitude");
      return;
    }

    setUpdating(true);
    try {
      const formDataToSend = new FormData();

      formDataToSend.append("materialName", formData.materialName);
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("price", formData.price); // Changed from sellingPrice to price
      formDataToSend.append("priceUnit", formData.priceUnit);

      if (formData.supplierName)
        formDataToSend.append("supplierName", formData.supplierName);
      if (formData.addressLine)
        formDataToSend.append("addressLine", formData.addressLine);
      if (formData.description)
        formDataToSend.append("description", formData.description);
      if (formData.listingType)
        formDataToSend.append("listingType", formData.listingType);

      if (formData.coordinates) {
        formDataToSend.append("coordinates", formData.coordinates);
      }

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
        },
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

      if (!formData.price) {
        toast.error("Price required");
        return;
      }

      if (!formData.coordinates) {
        toast.error("Coordinates required. Please add location coordinates.");
        return;
      }

      // Validate coordinates format
      const coords = formData.coordinates.split(",");
      if (coords.length !== 2) {
        toast.error("Coordinates format should be: longitude,latitude");
        return;
      }

      const longitude = parseFloat(coords[0].trim());
      const latitude = parseFloat(coords[1].trim());

      if (isNaN(longitude) || isNaN(latitude)) {
        toast.error("Invalid coordinates. Please enter valid numbers.");
        return;
      }

      if (latitude < -90 || latitude > 90) {
        toast.error("Latitude must be between -90 and 90");
        return;
      }

      if (longitude < -180 || longitude > 180) {
        toast.error("Longitude must be between -180 and 180");
        return;
      }

      const formDataToSend = new FormData();

      formDataToSend.append("materialName", formData.materialName);
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("price", formData.price); // Changed from sellingPrice to price
      formDataToSend.append("priceUnit", formData.priceUnit);

      if (formData.supplierName) {
        formDataToSend.append("supplierName", formData.supplierName);
      }

      if (formData.addressLine) {
        formDataToSend.append("addressLine", formData.addressLine);
      }

      if (formData.description) {
        formDataToSend.append("description", formData.description);
      }

      formDataToSend.append("listingType", formData.listingType);

      if (formData.coordinates) {
        formDataToSend.append("coordinates", formData.coordinates);
      }

      // Photos
      if (formData.photos?.length > 0) {
        formData.photos.forEach((photo) => {
          if (photo instanceof File) {
            formDataToSend.append("photos", photo);
          }
        });
      }

      console.log("Sending data:", [...formDataToSend.entries()]);

      const response = await axiosInstance.post(
        "/material/create",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Response:", response.data);

      if (response.data?.success !== false) {
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
      price: "",
      priceUnit: "perUnit",
      supplierName: "",
      addressLine: "",
      description: "",
      listingType: "sell",
      coordinates: "",
      photos: [],
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
      price: material.price || "",
      priceUnit: material.priceUnit || "perUnit",
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
  // GET PRICE UNIT LABEL
  // =========================

  const getPriceUnitLabel = (unit) => {
    switch (unit) {
      case "perUnit":
        return "Per Unit";
      case "perKg":
        return "Per Kg";
      case "perMeter":
        return "Per Meter";
      case "perSquareFoot":
        return "Per Sq Ft";
      default:
        return unit;
    }
  };

  // =========================
  // FILTERS & PAGINATION
  // =========================

  const materialCategories = [
    "all",
    ...new Set(materials.map((m) => m.category).filter((c) => c !== "-")),
  ];

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
    currentPage * perPage,
  );

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    const init = async () => {
      await loadCategories();
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
                      <td>{material.supplier}</td>
                      <td>
                        ₹{material.price}{" "}
                        <span style={{ fontSize: "11px", color: "#666" }}>
                          ({getPriceUnitLabel(material.priceUnit)})
                        </span>
                      </td>
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
                            onClick={() =>
                              toggleStatus(material.id, material.status)
                            }
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
                    <td colSpan="7" className="empty-state">
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

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <h3>
                  <FaPlus className="icon" /> Add Material
                </h3>
                <p className="modal-subtitle">
                  Fill in the details to list a new material
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <form className="material-form">
                {/* Section 1: Basic Information */}
                <div className="form-section">
                  <h4 className="section-title">Basic Information</h4>
                  <div className="form-grid">
                    <div className="input-group">
                      <label htmlFor="materialName">Material Name *</label>
                      <input
                        id="materialName"
                        type="text"
                        value={formData.materialName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            materialName: e.target.value,
                          })
                        }
                        placeholder="e.g., Steel Rod, Cement Bag"
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="categoryId">Category *</label>
                      <select
                        id="categoryId"
                        value={formData.categoryId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categoryId: e.target.value,
                          })
                        }
                        required
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
                  </div>
                </div>

                {/* Section 2: Pricing */}
                <div className="form-section">
                  <h4 className="section-title">Pricing</h4>
                  <div className="form-grid">
                    <div className="input-group">
                      <label htmlFor="price">Price *</label>
                      <div className="price-input-wrapper">
                        <span className="currency-symbol">₹</span>
                        <input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="priceUnit">Price Unit *</label>
                      <select
                        id="priceUnit"
                        value={formData.priceUnit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priceUnit: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="perUnit">Per Unit</option>
                        <option value="perKg">Per Kg</option>
                        <option value="perMeter">Per Meter</option>
                        <option value="perSquareFoot">Per Square Foot</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Supplier Information */}
                <div className="form-section">
                  <h4 className="section-title">Supplier Information</h4>
                  <div className="input-group full-width">
                    <label htmlFor="supplierName">Supplier Name</label>
                    <input
                      id="supplierName"
                      type="text"
                      value={formData.supplierName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          supplierName: e.target.value,
                        })
                      }
                      placeholder="Your company or name"
                    />
                  </div>
                </div>

                {/* Section 4: Location */}
                <div className="form-section">
                  <h4 className="section-title">Location Details</h4>

                  {/* Address Input with Get Location Button */}
                  <div className="input-group full-width">
                    <div className="label-wrapper">
                      <label htmlFor="addressLine">
                        <FaMapMarkerAlt className="icon" /> Address / Location
                      </label>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={fetchingLocation}
                        className="btn-get-location"
                      >
                        <FaLocationArrow />
                        {fetchingLocation ? "Getting..." : "Auto-detect"}
                      </button>
                    </div>
                    <input
                      id="addressLine"
                      ref={addressInputRef}
                      type="text"
                      value={formData.addressLine}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressLine: e.target.value,
                        })
                      }
                      placeholder="Type address or use auto-detect button"
                    />
                    <small className="form-hint">
                      💡 Start typing to see suggestions from Google Maps
                    </small>
                  </div>

                  {/* Coordinates Input */}
                  <div className="input-group full-width">
                    <label htmlFor="coordinates">Coordinates * (lon,lat)</label>
                    <input
                      id="coordinates"
                      type="text"
                      placeholder="80.9462,26.8467"
                      value={formData.coordinates}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinates: e.target.value,
                        })
                      }
                      required
                    />
                    <small className="form-hint">
                      Format: longitude,latitude (auto-filled when you select
                      address)
                    </small>
                  </div>
                </div>

                {/* Section 5: Listing Type */}
                <div className="form-section">
                  <h4 className="section-title">Listing Details</h4>
                  <div className="input-group">
                    <label htmlFor="listingType">Listing Type</label>
                    <div className="radio-group">
                      <div className="radio-option">
                        <input
                          id="listingTypeSell"
                          type="radio"
                          name="listingType"
                          value="sell"
                          checked={formData.listingType === "sell"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              listingType: e.target.value,
                            })
                          }
                        />
                        <label htmlFor="listingTypeSell">Sell</label>
                      </div>
                      <div className="radio-option">
                        <input
                          id="listingTypeRent"
                          type="radio"
                          name="listingType"
                          value="rent"
                          checked={formData.listingType === "rent"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              listingType: e.target.value,
                            })
                          }
                        />
                        <label htmlFor="listingTypeRent">Rent</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 6: Photos */}
                <div className="form-section">
                  <h4 className="section-title">Photos</h4>
                  <div className="input-group full-width">
                    <label htmlFor="photos" className="file-upload-label">
                      <FaImage className="icon" /> Click to upload photos
                    </label>
                    <input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="file-input-hidden"
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
                              alt={`Preview ${idx + 1}`}
                            />
                            <button
                              type="button"
                              className="remove-photo-btn"
                              onClick={() => removePhoto(idx)}
                              aria-label="Remove photo"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 7: Description */}
                <div className="form-section">
                  <h4 className="section-title">Additional Information</h4>
                  <div className="input-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      rows="4"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the material, quality, condition, etc."
                    />
                    <small className="form-hint">
                      {formData.description.length}/500 characters
                    </small>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                <FaTimes /> Cancel
              </button>
              <button className="btn-primary" onClick={handleAddMaterial}>
                <FaPlus /> Add Material
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
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
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
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Price Unit *</label>
                  <select
                    value={formData.priceUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, priceUnit: e.target.value })
                    }
                  >
                    <option value="perUnit">Per Unit</option>
                    <option value="perKg">Per Kg</option>
                    <option value="perMeter">Per Meter</option>
                    <option value="perSquareFoot">Per Square Foot</option>
                  </select>
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

                {/* Address with Google Maps Autocomplete - Edit Mode */}
                <div className="input-group full-width">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <FaMapMarkerAlt /> Address / Location
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={fetchingLocation}
                      style={{
                        marginLeft: "auto",
                        padding: "4px 12px",
                        fontSize: "12px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: fetchingLocation ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <FaLocationArrow />
                      {fetchingLocation ? "Getting..." : "Get My Location"}
                    </button>
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) =>
                      setFormData({ ...formData, addressLine: e.target.value })
                    }
                    placeholder="Start typing address or use 'Get My Location' button"
                    style={{ marginBottom: "8px" }}
                  />
                  <small style={{ color: "#6c757d", fontSize: "11px" }}>
                    💡 Tip: Start typing address and select from dropdown to
                    auto-fill coordinates
                  </small>
                </div>

                <div className="input-group">
                  <label>Coordinates * (longitude,latitude)</label>
                  <input
                    type="text"
                    placeholder="longitude,latitude"
                    value={formData.coordinates}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinates: e.target.value })
                    }
                    required
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
                  </select>
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
                    Price
                  </label>
                  <p style={{ margin: 0 }}>
                    ₹{selectedMaterial.price}{" "}
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      ({getPriceUnitLabel(selectedMaterial.priceUnit)})
                    </span>
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
                    Status
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && materialToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-content small"
            onClick={(e) => e.stopPropagation()}
          >
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
              <FaTimesCircle
                className="delete-warning"
                style={{
                  fontSize: "48px",
                  color: "#dc3545",
                  marginBottom: "16px",
                }}
              />
              <p>
                Are you sure you want to{" "}
                <strong style={{ color: "#dc3545" }}>PERMANENTLY DELETE</strong>{" "}
                <strong>{materialToDelete.name}</strong>?
              </p>
              <p
                className="text-muted"
                style={{ color: "#6c757d", marginTop: "8px" }}
              >
                This action cannot be undone. The material will be completely
                removed from the database.
              </p>
              <div
                style={{
                  background: "#fff3cd",
                  padding: "10px",
                  borderRadius: "6px",
                  marginTop: "16px",
                  fontSize: "12px",
                  color: "#856404",
                }}
              >
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
                  opacity: deleting ? 0.7 : 1,
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
