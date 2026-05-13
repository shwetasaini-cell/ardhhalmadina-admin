import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaEye,
  FaTimes,
  FaInfoCircle,
  FaEdit,
  FaBoxes,
  FaCheckCircle,
  FaTruck,
  FaExclamationTriangle,
  FaFilter,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCog,
  FaGasPump,
  FaRoad,
  FaWeightHanging,
  FaRulerCombined,
  FaIdCard,
  FaCalendarWeek,
  FaShieldAlt,
  FaWrench,
  FaBolt,
  FaTachometerAlt,
  FaDatabase,
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    addressLine: "",
    companyName: "",
    uniqueCode: "",
    categoryId: "",
    listingType: "rent",
    dailyRate: "",
    weeklyRate: "",
    monthlyRate: "",
    sellingPrice: "",
    latitude: "28.7041",
    longitude: "77.1025",
    photos: [],
    listingCategory: "equipment",
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      let url = `/listings/admin/listings?`;
      const params = new URLSearchParams();

      if (categoryFilter !== "all") {
        params.append("listingCategory", categoryFilter);
      }

      if (listingTypeFilter !== "all") {
        params.append("listingType", listingTypeFilter);
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      url += params.toString();

      const response = await axiosInstance.get(url);
      const result = response.data;

      if (result.success) {
        let allItems = [];

        if (categoryFilter === "all") {
          allItems = [
            ...(result.data?.vehicle || []),
            ...(result.data?.machinery || []),
            ...(result.data?.equipment || []),
          ];
        } else if (result.data && result.data[categoryFilter]) {
          allItems = result.data[categoryFilter];
        }

        const transformedListings = allItems.map((listing) => {
          let dailyRate = 0,
            weeklyRate = 0,
            monthlyRate = 0,
            sellingPrice = 0;

          if (listing.listingType === "rent") {
            dailyRate = listing.rentDetails?.dailyRate || 0;
            weeklyRate = listing.rentDetails?.weeklyRate || 0;
            monthlyRate = listing.rentDetails?.monthlyRate || 0;
          } else if (listing.listingType === "sell") {
            sellingPrice = listing.sellDetails?.sellingPrice || 0;
          }

          let lat = 28.7041,
            lng = 77.1025;
          if (listing.location?.coordinates) {
            lng = listing.location.coordinates[0];
            lat = listing.location.coordinates[1];
          }

          let categorySpecificData = {};
          if (listing.listingCategory === "vehicle" && listing.vehicleData) {
            categorySpecificData = {
              brand: listing.vehicleData.brand,
              model: listing.vehicleData.model,
              variant: listing.vehicleData.variant,
              manufacturingYear: listing.vehicleData.manufacturingYear,
              condition: listing.vehicleData.condition,
              color: listing.vehicleData.color,
              vehicleType: listing.vehicleData.vehicleType,
              registration: listing.vehicleData.registration,
              technicalSpecifications:
                listing.vehicleData.technicalSpecifications,
              features: listing.vehicleData.features,
              availability: listing.vehicleData.availability,
              delivery: listing.vehicleData.delivery,
            };
          } else if (
            listing.listingCategory === "machinery" &&
            listing.machineryData
          ) {
            categorySpecificData = {
              brand: listing.machineryData.brand,
              model: listing.machineryData.model,
              variant: listing.machineryData.variant,
              manufacturingYear: listing.machineryData.manufacturingYear,
              condition: listing.machineryData.condition,
              machineType: listing.machineryData.machineType,
              serialNumber: listing.machineryData.serialNumber,
              technicalSpecifications:
                listing.machineryData.technicalSpecifications,
              features: listing.machineryData.features,
              maintenance: listing.machineryData.maintenance,
            };
          } else if (
            listing.listingCategory === "equipment" &&
            listing.equipmentData
          ) {
            categorySpecificData = {
              brand: listing.equipmentData.brand,
              model: listing.equipmentData.model,
              condition: listing.equipmentData.condition,
              equipmentType: listing.equipmentData.equipmentType,
              specifications: listing.equipmentData.specifications,
              features: listing.equipmentData.features,
              quantity: listing.equipmentData.quantity,
            };
          }

          return {
            id: listing._id,
            name: listing.name,
            description: listing.description,
            registrationNo: listing.uniqueCode || listing.vehicleRC || "N/A",
            status: listing.status,
            dailyRate: dailyRate,
            weeklyRate: weeklyRate,
            monthlyRate: monthlyRate,
            sellingPrice: sellingPrice,
            location: listing.addressLine,
            createdAt: new Date(listing.createdAt).toLocaleDateString(),
            companyName: listing.companyName,
            listingType: listing.listingType,
            photos: listing.photos || [],
            coordinates: [lng, lat],
            listingCategory: listing.listingCategory || "equipment",
            categoryId:
              typeof listing.categoryId === "object"
                ? listing.categoryId._id
                : listing.categoryId,
            categoryName:
              typeof listing.categoryId === "object"
                ? listing.categoryId.name
                : "",
            userId: listing.userId,
            ...categorySpecificData,
          };
        });

        setItems(transformedListings);
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error("Error loading listings");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditListing = async () => {
    if (!formData.name) {
      toast.error("Equipment name is required");
      return;
    }

    setUploading(true);
    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("addressLine", formData.addressLine);
      formDataToSend.append("companyName", formData.companyName);
      formDataToSend.append("uniqueCode", formData.uniqueCode);
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("listingType", formData.listingType);

      if (formData.listingType === "rent") {
        formDataToSend.append("dailyRate", formData.dailyRate);
        formDataToSend.append("weeklyRate", formData.weeklyRate);
        formDataToSend.append("monthlyRate", formData.monthlyRate);
      } else {
        formDataToSend.append("sellingPrice", formData.sellingPrice);
      }

      selectedFiles.forEach((file) => {
        formDataToSend.append("photos", file);
      });

      const response = await axiosInstance.put(
        `/listings/update/${selectedItem.id}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data?.success) {
        toast.success("Equipment updated successfully!");
        fetchVehicles();
        setShowEditModal(false);
        resetForm();
        setSelectedFiles([]);
      }
    } catch (error) {
      toast.error("Error updating equipment");
      console.error("Update error:", error);
    } finally {
      setUploading(false);
    }
  };

  const updateListingStatus = async (listingId, newStatus) => {
    try {
      const response = await axiosInstance.patch(
        `/listings/updateStatus/${listingId}`,
        {
          status: newStatus,
        },
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      addressLine: "",
      companyName: "",
      uniqueCode: "",
      categoryId: "",
      listingType: "rent",
      dailyRate: "",
      weeklyRate: "",
      monthlyRate: "",
      sellingPrice: "",
      latitude: "28.7041",
      longitude: "77.1025",
      photos: [],
      listingCategory: "equipment",
    });
    setSelectedItem(null);
    setSelectedFiles([]);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      status: item.status,
      addressLine: item.location || "",
      companyName: item.companyName || "",
      uniqueCode: item.registrationNo || "",
      categoryId: item.categoryId || "",
      listingType: item.listingType || "rent",
      dailyRate: item.dailyRate?.toString() || "",
      weeklyRate: item.weeklyRate?.toString() || "",
      monthlyRate: item.monthlyRate?.toString() || "",
      sellingPrice: item.sellingPrice?.toString() || "",
      latitude: item.coordinates?.[1]?.toString() || "28.7041",
      longitude: item.coordinates?.[0]?.toString() || "77.1025",
      photos: item.photos || [],
      listingCategory: item.listingCategory || "equipment",
    });
    setSelectedFiles([]);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const icon =
      status === "active" ? (
        <FaCheckCircle />
      ) : status === "inactive" ? (
        <FaTimes />
      ) : (
        <FaExclamationTriangle />
      );
    return (
      <span className={`badge-status ${getStatusClass(status)}`}>
        {icon} {getStatusDisplay(status)}
      </span>
    );
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setListingTypeFilter("all");
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setCurrentPage(1);
  };

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

  const renderCategoryDetails = (item) => {
    if (item.listingCategory === "vehicle") {
      return (
        <>
          {(item.brand || item.model || item.variant) && (
            <div className="details-section">
              <h4>
                <FaCog /> Vehicle Information
              </h4>
              <div className="details-grid">
                {item.brand && (
                  <div>
                    <strong>Brand:</strong> {item.brand}
                  </div>
                )}
                {item.model && (
                  <div>
                    <strong>Model:</strong> {item.model}
                  </div>
                )}
                {item.variant && (
                  <div>
                    <strong>Variant:</strong> {item.variant}
                  </div>
                )}
                {item.manufacturingYear && (
                  <div>
                    <strong>Year:</strong> {item.manufacturingYear}
                  </div>
                )}
                {item.condition && (
                  <div>
                    <strong>Condition:</strong> {item.condition}
                  </div>
                )}
                {item.color && (
                  <div>
                    <strong>Color:</strong> {item.color}
                  </div>
                )}
                {item.vehicleType && (
                  <div>
                    <strong>Vehicle Type:</strong> {item.vehicleType}
                  </div>
                )}
              </div>
            </div>
          )}

          {item.technicalSpecifications &&
            Object.keys(item.technicalSpecifications).length > 0 && (
              <div className="details-section">
                <h4>
                  <FaTachometerAlt /> Technical Specifications
                </h4>
                <div className="details-grid">
                  {item.technicalSpecifications.fuelType && (
                    <div>
                      <FaGasPump /> <strong>Fuel Type:</strong>{" "}
                      {item.technicalSpecifications.fuelType}
                    </div>
                  )}
                  {item.technicalSpecifications.engineCapacity && (
                    <div>
                      <FaCog /> <strong>Engine Capacity:</strong>{" "}
                      {item.technicalSpecifications.engineCapacity}
                    </div>
                  )}
                  {item.technicalSpecifications.horsepower && (
                    <div>
                      <FaBolt /> <strong>Horsepower:</strong>{" "}
                      {item.technicalSpecifications.horsepower}
                    </div>
                  )}
                  {item.technicalSpecifications.transmission && (
                    <div>
                      <FaCog /> <strong>Transmission:</strong>{" "}
                      {item.technicalSpecifications.transmission}
                    </div>
                  )}
                  {item.technicalSpecifications.driveType && (
                    <div>
                      <FaRoad /> <strong>Drive Type:</strong>{" "}
                      {item.technicalSpecifications.driveType}
                    </div>
                  )}
                  {item.technicalSpecifications.mileage && (
                    <div>
                      <FaTachometerAlt /> <strong>Mileage:</strong>{" "}
                      {Number(
                        item.technicalSpecifications.mileage,
                      ).toLocaleString()}{" "}
                      km
                    </div>
                  )}
                  {item.technicalSpecifications.loadCapacity && (
                    <div>
                      <FaWeightHanging /> <strong>Load Capacity:</strong>{" "}
                      {item.technicalSpecifications.loadCapacity}
                    </div>
                  )}
                  {item.technicalSpecifications.seatingCapacity && (
                    <div>
                      <strong>Seating Capacity:</strong>{" "}
                      {item.technicalSpecifications.seatingCapacity}
                    </div>
                  )}
                </div>
              </div>
            )}

          {item.registration && Object.keys(item.registration).length > 0 && (
            <div className="details-section">
              <h4>
                <FaIdCard /> Registration Details
              </h4>
              <div className="details-grid">
                {item.registration.plateNumber && (
                  <div>
                    <strong>Plate Number:</strong>{" "}
                    {item.registration.plateNumber}
                  </div>
                )}
                {item.registration.registrationNumber && (
                  <div>
                    <strong>Registration No:</strong>{" "}
                    {item.registration.registrationNumber}
                  </div>
                )}
                {item.registration.mulkiyaExpiryDate && (
                  <div>
                    <FaCalendarAlt /> <strong>Mulkiya Expiry:</strong>{" "}
                    {new Date(
                      item.registration.mulkiyaExpiryDate,
                    ).toLocaleDateString()}
                  </div>
                )}
                {item.registration.insuranceExpiryDate && (
                  <div>
                    <FaShieldAlt /> <strong>Insurance Expiry:</strong>{" "}
                    {new Date(
                      item.registration.insuranceExpiryDate,
                    ).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {item.features && Object.keys(item.features).length > 0 && (
            <div className="details-section">
              <h4>
                <FaCheckCircle /> Features
              </h4>
              <div className="features-list">
                {item.features.airConditioning && (
                  <span className="feature-tag">❄️ Air Conditioning</span>
                )}
                {item.features.gpsTracking && (
                  <span className="feature-tag">📍 GPS Tracking</span>
                )}
                {item.features.reverseCamera && (
                  <span className="feature-tag">📹 Reverse Camera</span>
                )}
                {item.features.bluetooth && (
                  <span className="feature-tag">🎵 Bluetooth</span>
                )}
                {item.features.fuelIncluded && (
                  <span className="feature-tag">⛽ Fuel Included</span>
                )}
                {item.features.operatorIncluded && (
                  <span className="feature-tag">👨‍✈️ Operator Included</span>
                )}
              </div>
            </div>
          )}
        </>
      );
    } else if (item.listingCategory === "machinery") {
      return (
        <>
          {(item.brand || item.model || item.machineType) && (
            <div className="details-section">
              <h4>
                <FaCog /> Machinery Information
              </h4>
              <div className="details-grid">
                {item.brand && (
                  <div>
                    <strong>Brand:</strong> {item.brand}
                  </div>
                )}
                {item.model && (
                  <div>
                    <strong>Model:</strong> {item.model}
                  </div>
                )}
                {item.variant && (
                  <div>
                    <strong>Variant:</strong> {item.variant}
                  </div>
                )}
                {item.manufacturingYear && (
                  <div>
                    <strong>Year:</strong> {item.manufacturingYear}
                  </div>
                )}
                {item.condition && (
                  <div>
                    <strong>Condition:</strong> {item.condition}
                  </div>
                )}
                {item.machineType && (
                  <div>
                    <strong>Machine Type:</strong> {item.machineType}
                  </div>
                )}
                {item.serialNumber && (
                  <div>
                    <strong>Serial No:</strong> {item.serialNumber}
                  </div>
                )}
              </div>
            </div>
          )}

          {item.technicalSpecifications &&
            Object.keys(item.technicalSpecifications).length > 0 && (
              <div className="details-section">
                <h4>
                  <FaTachometerAlt /> Technical Specifications
                </h4>
                <div className="details-grid">
                  {item.technicalSpecifications.enginePower && (
                    <div>
                      <FaBolt /> <strong>Engine Power:</strong>{" "}
                      {item.technicalSpecifications.enginePower}
                    </div>
                  )}
                  {item.technicalSpecifications.operatingWeight && (
                    <div>
                      <FaWeightHanging /> <strong>Operating Weight:</strong>{" "}
                      {item.technicalSpecifications.operatingWeight}
                    </div>
                  )}
                  {item.technicalSpecifications.bucketCapacity && (
                    <div>
                      <strong>Bucket Capacity:</strong>{" "}
                      {item.technicalSpecifications.bucketCapacity}
                    </div>
                  )}
                  {item.technicalSpecifications.workingHeight && (
                    <div>
                      <FaRulerCombined /> <strong>Working Height:</strong>{" "}
                      {item.technicalSpecifications.workingHeight}
                    </div>
                  )}
                  {item.technicalSpecifications.workingDepth && (
                    <div>
                      <strong>Working Depth:</strong>{" "}
                      {item.technicalSpecifications.workingDepth}
                    </div>
                  )}
                  {item.technicalSpecifications.loadCapacity && (
                    <div>
                      <FaWeightHanging /> <strong>Load Capacity:</strong>{" "}
                      {item.technicalSpecifications.loadCapacity}
                    </div>
                  )}
                </div>
              </div>
            )}

          {item.maintenance && Object.keys(item.maintenance).length > 0 && (
            <div className="details-section">
              <h4>
                <FaWrench /> Maintenance Details
              </h4>
              <div className="details-grid">
                {item.maintenance.workingHoursUsed && (
                  <div>
                    <strong>Working Hours:</strong>{" "}
                    {Number(item.maintenance.workingHoursUsed).toLocaleString()}{" "}
                    hrs
                  </div>
                )}
                {item.maintenance.lastServiceDate && (
                  <div>
                    <FaCalendarWeek /> <strong>Last Service:</strong>{" "}
                    {new Date(
                      item.maintenance.lastServiceDate,
                    ).toLocaleDateString()}
                  </div>
                )}
                {item.maintenance.nextServiceDate && (
                  <div>
                    <FaCalendarAlt /> <strong>Next Service:</strong>{" "}
                    {new Date(
                      item.maintenance.nextServiceDate,
                    ).toLocaleDateString()}
                  </div>
                )}
                {item.maintenance.maintenanceStatus && (
                  <div>
                    <strong>Status:</strong>{" "}
                    {item.maintenance.maintenanceStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      );
    } else if (item.listingCategory === "equipment") {
      return (
        <>
          {(item.brand || item.model || item.equipmentType) && (
            <div className="details-section">
              <h4>
                <FaCog /> Equipment Information
              </h4>
              <div className="details-grid">
                {item.brand && (
                  <div>
                    <strong>Brand:</strong> {item.brand}
                  </div>
                )}
                {item.model && (
                  <div>
                    <strong>Model:</strong> {item.model}
                  </div>
                )}
                {item.condition && (
                  <div>
                    <strong>Condition:</strong> {item.condition}
                  </div>
                )}
                {item.equipmentType && (
                  <div>
                    <strong>Equipment Type:</strong> {item.equipmentType}
                  </div>
                )}
              </div>
            </div>
          )}

          {item.specifications &&
            Object.keys(item.specifications).length > 0 && (
              <div className="details-section">
                <h4>
                  <FaDatabase /> Specifications
                </h4>
                <div className="details-grid">
                  {item.specifications.power && (
                    <div>
                      <FaBolt /> <strong>Power:</strong>{" "}
                      {item.specifications.power}
                    </div>
                  )}
                  {item.specifications.capacity && (
                    <div>
                      <strong>Capacity:</strong> {item.specifications.capacity}
                    </div>
                  )}
                  {item.specifications.weight && (
                    <div>
                      <FaWeightHanging /> <strong>Weight:</strong>{" "}
                      {item.specifications.weight}
                    </div>
                  )}
                </div>
              </div>
            )}

          {item.quantity && item.quantity.availableUnits && (
            <div className="details-section">
              <h4>
                <FaBoxes /> Inventory
              </h4>
              <div className="details-grid">
                <div>
                  <strong>Available Units:</strong>{" "}
                  {item.quantity.availableUnits}
                </div>
              </div>
            </div>
          )}
        </>
      );
    }
    return null;
  };

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
  };

  return (
    <div className="material-page">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="page-header headers-section">
        <div className="header-left">
          <h1 className="page-title">Listings Management</h1>
          <p className="page-subtitle">Manage and track all user listings</p>
        </div>
        <div className="header-right">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FaBoxes />
          </div>
          <div className="stat-info">
            <h3>{totalItems}</h3>
            <p>Total Listings</p>
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
      </div> */}

      <div className="filters-containers">
        <div className="filters-header">
          <div className="filters-title">
            <FaFilter /> <span>Filters</span>
          </div>
          {(statusFilter !== "all" ||
            categoryFilter !== "all" ||
            listingTypeFilter !== "all" ||
            searchTerm) && (
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              <FaTimes /> Clear All
            </button>
          )}
        </div>
        <div className="filters-grids">
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
            <option value="sell">For Sale</option>
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
      </div>

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
                  <th>Product Name</th>
                  <th>Listing Type</th>
                  <th>Type/Model</th>
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
                            {item.brand && (
                              <div style={{ fontSize: "11px", color: "#666" }}>
                                {item.brand} {item.model}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">
                          {item.listingCategory?.charAt(0).toUpperCase() +
                            item.listingCategory?.slice(1) || "Equipment"}
                        </span>
                      </td>
                      <td>
                        <div>
                          {item.vehicleType ||
                            item.machineType ||
                            item.equipmentType ||
                            "N/A"}
                        </div>
                        {item.model && (
                          <div style={{ fontSize: "11px", color: "#666" }}>
                            {item.model}
                          </div>
                        )}
                      </td>
                      <td>
                        {item.listingType === "rent"
                          ? `₹${item.dailyRate.toLocaleString()}/day`
                          : `₹${item.sellingPrice.toLocaleString()}`}
                        {item.listingType === "rent" && item.weeklyRate > 0 && (
                          <div style={{ fontSize: "11px", color: "#666" }}>
                            Week: ₹{item.weeklyRate.toLocaleString()}
                          </div>
                        )}
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
                            updateListingStatus(item.id, e.target.value)
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
            className="modal-content large"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "900px",
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
                position: "sticky",
                top: 0,
                background: "white",
                zIndex: 1,
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
                  flexWrap: "wrap",
                }}
              >
                {selectedItem.photos?.[0] ? (
                  <img
                    src={selectedItem.photos[0]}
                    alt={selectedItem.name}
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "48px",
                      fontWeight: "bold",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  >
                    {selectedItem.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, color: "#333" }}>
                    {selectedItem.name}
                  </h2>
                  <p style={{ margin: "8px 0", color: "#666" }}>
                    <strong>ID:</strong> {selectedItem.id}
                  </p>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    <strong>Code:</strong> {selectedItem.registrationNo}
                  </p>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    <strong>Company:</strong>{" "}
                    {selectedItem.companyName || "N/A"}
                  </p>
                  {selectedItem.userId?.email && (
                    <p style={{ margin: "5px 0", color: "#666" }}>
                      <strong>Listed By:</strong> {selectedItem.userId.email}
                    </p>
                  )}
                </div>
                <div>{getStatusBadge(selectedItem.status)}</div>
              </div>

              <div className="details-section">
                <h4>
                  <FaInfoCircle /> Basic Information
                </h4>
                <div className="details-grid">
                  <div>
                    <strong>Category:</strong>{" "}
                    {selectedItem.listingCategory?.charAt(0).toUpperCase() +
                      selectedItem.listingCategory?.slice(1)}
                  </div>
                  <div>
                    <strong>Listing Type:</strong>{" "}
                    {selectedItem.listingType === "rent"
                      ? "For Rent"
                      : "For Sale"}
                  </div>
                  <div>
                    <strong>Location:</strong> <FaMapMarkerAlt />{" "}
                    {selectedItem.location || "N/A"}
                  </div>
                  <div>
                    <strong>Created:</strong> <FaCalendarAlt />{" "}
                    {selectedItem.createdAt}
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>💰 Pricing Details</h4>
                <div className="details-grid">
                  {selectedItem.listingType === "rent" ? (
                    <>
                      <div>
                        <strong>Daily Rate:</strong> ₹
                        {selectedItem.dailyRate?.toLocaleString()}/day
                      </div>
                      {selectedItem.weeklyRate > 0 && (
                        <div>
                          <strong>Weekly Rate:</strong> ₹
                          {selectedItem.weeklyRate?.toLocaleString()}/week
                        </div>
                      )}
                      {selectedItem.monthlyRate > 0 && (
                        <div>
                          <strong>Monthly Rate:</strong> ₹
                          {selectedItem.monthlyRate?.toLocaleString()}/month
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <strong>Selling Price:</strong> ₹
                      {selectedItem.sellingPrice?.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {selectedItem.description && (
                <div className="details-section">
                  <h4>Description</h4>
                  <p style={{ lineHeight: "1.6", color: "#555" }}>
                    {selectedItem.description}
                  </p>
                </div>
              )}

              {renderCategoryDetails(selectedItem)}

              {selectedItem.photos?.length > 0 && (
                <div className="details-section">
                  <h4>Image Gallery</h4>
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
                        alt={`Gallery ${i + 1}`}
                        style={imageStyles.gallery}
                        onClick={() => window.open(p)}
                      />
                    ))}
                  </div>
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

      <style>{`
        .details-section {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }
        .details-section h4 {
          margin: 0 0 12px 0;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }
        .details-grid div {
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .feature-tag {
          padding: 4px 12px;
          background: #e8f5e9;
          border-radius: 20px;
          font-size: 12px;
          color: #2e7d32;
        }
        .category-tag {
          background: #e0e7ff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .clear-filters-btn {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
