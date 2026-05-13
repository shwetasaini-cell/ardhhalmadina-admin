import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaSearch,
  FaFilter,
  FaUndo,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
  FaBoxOpen,
  FaSpinner,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaClipboardList,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaSync,
  FaBuilding,
  FaCreditCard,
  FaMoneyBillWave,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./OrderManagement.css";
import axiosInstance from "../../utils/axiosInstance";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  const orderStatuses = [
    {
      value: "pending",
      label: "Pending",
      color: "#ff9800",
      icon: <FaSpinner />,
    },
    {
      value: "confirmed",
      label: "Confirmed",
      color: "#2196f3",
      icon: <FaCheckCircle />,
    },
    {
      value: "processing",
      label: "Processing",
      color: "#9c27b0",
      icon: <FaSync />,
    },
    { value: "shipped", label: "Shipped", color: "#00bcd4", icon: <FaTruck /> },
    {
      value: "delivered",
      label: "Delivered",
      color: "#4caf50",
      icon: <FaBoxOpen />,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "#f44336",
      icon: <FaTimesCircle />,
    },
  ];

  const getOrderStatusConfig = (status) =>
    orderStatuses.find((s) => s.value === status) || orderStatuses[0];

  const getStatusBadge = (status) => {
    const config = getOrderStatusConfig(status);
    return (
      <span className={`order-status-badge status-${status}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  const formatDateTime = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const showSuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const showErrorMessage = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/material/admin/orders");
      let ordersData = [];
      if (response.data.data && Array.isArray(response.data.data))
        ordersData = response.data.data;
      else if (Array.isArray(response.data)) ordersData = response.data;
      else if (response.data.orders && Array.isArray(response.data.orders))
        ordersData = response.data.orders;

      const formattedOrders = ordersData.map((order) => ({
        id: order._id,
        userId: order.userId,
        materialId: order.materialId,
        quantity: order.quantity,
        pricePerUnit: order.pricePerUnit,
        totalAmount: order.totalAmount,
        addressLine: order.addressLine,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }));

      setOrders(formattedOrders);
      setFilteredOrders(formattedOrders);
      showSuccessMessage(
        `Loaded ${formattedOrders.length} orders successfully`,
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        showErrorMessage("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        showErrorMessage(
          `Failed to load orders: ${error.response?.data?.message || error.message}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const response = await axiosInstance.patch(
        `/material/admin/updateStatus/${orderId}`,
        { orderStatus: newStatus },
      );

      if (response.data.success) {
        showSuccessMessage(
          `Order status updated to ${newStatus.toUpperCase()}`,
        );
        fetchOrders(); 
      } else {
        showErrorMessage("Failed to update order status");
      }
    } catch (error) {
      showErrorMessage(
        error.response?.data?.message || "Failed to update order status",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.materialId?.materialName?.toLowerCase().includes(search) ||
          order.userId?.email?.toLowerCase().includes(search) ||
          order.addressLine?.toLowerCase().includes(search) ||
          order.id?.toLowerCase().includes(search) ||
          order.materialId?.supplierName?.toLowerCase().includes(search),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.orderStatus === statusFilter);
    }

    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.paymentMethod === paymentMethodFilter,
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(
        (order) => new Date(order.createdAt) >= new Date(dateRange.start),
      );
    }

    if (dateRange.end) {
      filtered = filtered.filter(
        (order) => new Date(order.createdAt) <= new Date(dateRange.end),
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentMethodFilter, dateRange, orders]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentMethodFilter("all");
    setDateRange({ start: "", end: "" });
    setFiltersVisible(false);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / itemsPerPage),
  );

  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentStatus === "cancelled" || currentStatus === "delivered")
      return [];
    return statusFlow.slice(currentIndex + 1);
  };

  return (
    <div className="order-management-container">
      {successMessage && (
        <div className="success-toast">
          <FaCheckCircle className="toast-icon" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="error-toast">
          <FaExclamationTriangle className="toast-icon" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="header-section">
        <div>
          <h3 className="page-title">
            <FaClipboardList /> Order Management
          </h3>
          <p className="page-subtitle">Manage and track all customer orders</p>
        </div>
        <div className="header-actions">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by order ID, material, customer..."
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
          <button className="btn-refresh" onClick={fetchOrders}>
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {filtersVisible && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filters-groups">
              <label>Order Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                {orderStatuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filters-groups">
              <label>Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Methods</option>
                <option value="COD">Cash on Delivery</option>
                <option value="online">Online Payment</option>
              </select>
            </div>
            <div className="filters-groups">
              <label>From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="filter-input"
              />
            </div>
            <div className="filters-groups">
              <label>To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="filter-input"
              />
            </div>
            <div className="filter-actions">
              <button className="btn-reset" onClick={resetFilters}>
                <FaUndo /> Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-cards">
        {[
          {
            label: "Total Orders",
            value: orders.length,
            icon: <FaClipboardList />,
            color: "total-orders",
          },
          {
            label: "Pending",
            value: orders.filter((o) => o.orderStatus === "pending").length,
            icon: <FaSpinner />,
            color: "pending-orders",
          },
          {
            label: "Confirmed",
            value: orders.filter((o) => o.orderStatus === "confirmed").length,
            icon: <FaCheckCircle />,
            color: "confirmed-orders",
          },
          {
            label: "Processing",
            value: orders.filter((o) => o.orderStatus === "processing").length,
            icon: <FaSync />,
            color: "processing-orders",
          },
          {
            label: "Shipped",
            value: orders.filter((o) => o.orderStatus === "shipped").length,
            icon: <FaTruck />,
            color: "shipped-orders",
          },
          {
            label: "Delivered",
            value: orders.filter((o) => o.orderStatus === "delivered").length,
            icon: <FaBoxOpen />,
            color: "delivered-orders",
          },
        ].map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-info">
              <h4>{stat.label}</h4>
              <p>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-wrapper">
        <div className="table-responsive">
          {loading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : (
            <>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Material</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Location</th>
                    <th>Order Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length ? (
                    currentItems.map((order, index) => (
                      <tr key={order.id}>
                        <td data-label="Order ID">
                          <span className="order-id">{index + 1}</span>
                        </td>

                        <td data-label="Customer">
                          <div className="customer-info">
                            <span className="customer-email">
                              {order.userId?.email || "N/A"}
                            </span>
                          </div>
                        </td>

                        <td data-label="Material">
                          <div className="material-info">
                            <strong className="material-name">
                              {order.materialId?.materialName || "N/A"}
                            </strong>
                            <div className="material-meta">
                              {/* <span>
                                <FaBuilding />{" "}
                                {order.materialId?.supplierName || "N/A"}
                              </span> */}
                            </div>
                          </div>
                        </td>
                        <td data-label="Total">
                          <strong className="total-amount">
                            {formatPrice(order.totalAmount)}
                          </strong>
                        </td>

                        <td data-label="Payment">
                          <span
                            className={`payment-badge payment-${order.paymentMethod?.toLowerCase() || "cod"}`}
                          >
                            {order.paymentMethod === "COD" ? (
                              <FaMoneyBillWave />
                            ) : (
                              <FaCreditCard />
                            )}
                            {order.paymentMethod || "COD"}
                          </span>
                        </td>

                        <td data-label="Location">
                          <div className="location-info">
                            <span className="address-line">
                              {order.addressLine?.substring(0, 30) || "N/A"}
                            </span>
                          </div>
                        </td>

                        <td data-label="Order Date">
                          <div className="date-info">
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </td>

                        <td data-label="Status">
                          {getStatusBadge(order.orderStatus)}
                        </td>

                        <td data-label="Actions">
                          <div className="action-buttons">
                            <button
                              className="action-btn view-btn"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <FaEye />
                            </button>

                            <select
                              className="status-update-select"
                              value={order.orderStatus}
                              onChange={(e) =>
                                updateOrderStatus(order.id, e.target.value)
                              }
                              disabled={updatingOrderId === order.id}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10">
                        <div className="empty-state">
                          <FaExclamationTriangle className="empty-icon" />
                          <p>No orders found</p>

                          <button
                            className="btn-refresh-empty"
                            onClick={fetchOrders}
                          >
                            <FaSync /> Refresh Orders
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredOrders.length > 0 && (
                <div className="pagination-container">
                  <div className="pagination-controls">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      <FaChevronLeft /> Previous
                    </button>
                    <div className="page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (number) =>
                          number === 1 ||
                          number === totalPages ||
                          (number >= currentPage - 1 &&
                            number <= currentPage + 1) ? (
                            <button
                              key={number}
                              onClick={() => setCurrentPage(number)}
                              className={`page-number ${currentPage === number ? "active" : ""}`}
                            >
                              {number}
                            </button>
                          ) : number === currentPage - 2 ||
                            number === currentPage + 2 ? (
                            <span key={number} className="page-ellipsis">
                              ...
                            </span>
                          ) : null,
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next <FaChevronRight />
                    </button>
                  </div>
                  <div className="pagination-info">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredOrders.length)} of{" "}
                    {filteredOrders.length} orders
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-box order-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5>
                <FaClipboardList /> Order Details
              </h5>
              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                <FaTimesCircle />
              </button>
            </div>
            <div className="modal-body">
              <div className="order-summary">
                <div className="summary-header">
                  <h6>
                    Order ID:{" "}
                    <span className="order-id-full">{selectedOrder.id}</span>
                  </h6>
                  {getStatusBadge(selectedOrder.orderStatus)}
                </div>
              </div>
              <div className="details-grid">
                <div className="details-section">
                  <h6>Customer Information</h6>
                  <div className="detail-item">
                    <FaEnvelope className="detail-icon" />
                    <strong>Email:</strong>
                    <span>{selectedOrder.userId?.email || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <FaUser className="detail-icon" />
                    <strong>User ID:</strong>
                    <span>{selectedOrder.userId?._id || "N/A"}</span>
                  </div>
                </div>
                <div className="details-section">
                  <h6>Order Timeline</h6>
                  <div className="detail-item">
                    <FaCalendarAlt className="detail-icon" />
                    <strong>Ordered:</strong>
                    <span>{formatDateTime(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <FaCalendarAlt className="detail-icon" />
                    <strong>Last Updated:</strong>
                    <span>{formatDateTime(selectedOrder.updatedAt)}</span>
                  </div>
                </div>
                <div className="details-section">
                  <h6>Material Details</h6>
                  <div className="detail-item">
                    <strong>Material:</strong>
                    <span>
                      {selectedOrder.materialId?.materialName || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Supplier:</strong>
                    <span>
                      {selectedOrder.materialId?.supplierName || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Category:</strong>
                    <span>
                      {selectedOrder.materialId?.categoryId?.name || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Category Image</strong>
                    <div className="category-info">
                      {selectedOrder.materialId?.categoryId ? (
                        <>
                          <img
                            src={selectedOrder.materialId.categoryId.image}
                            className="category-image"
                          />
                        </>
                      ) : (
                        <span>N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <strong>Quantity:</strong>
                    <span>
                      {selectedOrder.quantity}{" "}
                      {selectedOrder.materialId?.priceUnit || "units"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Price/Unit:</strong>
                    <span>{formatPrice(selectedOrder.pricePerUnit)}</span>
                  </div>
                  <div className="detail-item total-amount">
                    <strong>Total:</strong>
                    <span>{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
                <div className="details-section">
                  <h6>Delivery & Payment</h6>
                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <strong>Address:</strong>
                    <span>{selectedOrder.addressLine || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Payment:</strong>
                    <span>{selectedOrder.paymentMethod || "COD"}</span>
                  </div>
                </div>
                {selectedOrder.materialId?.photos?.length > 0 && (
                  <div className="details-section">
                    <h6>Material Images</h6>
                    <div className="material-images">
                      {selectedOrder.materialId.photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Material ${idx + 1}`}
                          className="material-thumbnail"
                          onClick={() => window.open(photo, "_blank")}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {getAvailableStatuses(selectedOrder.orderStatus).length > 0 && (
                <div className="status-update-buttons">
                  {getAvailableStatuses(selectedOrder.orderStatus).map(
                    (status) => (
                      <button
                        key={status}
                        className={`btn-update-status status-${status}`}
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, status);
                          setSelectedOrder(null);
                        }}
                        disabled={updatingOrderId === selectedOrder.id}
                      >
                        {getOrderStatusConfig(status).icon} Mark as{" "}
                        {getOrderStatusConfig(status).label}
                      </button>
                    ),
                  )}
                  {selectedOrder.orderStatus !== "cancelled" && (
                    <button
                      className="btn-update-status status-cancelled"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, "cancelled");
                        setSelectedOrder(null);
                      }}
                    >
                      <FaTimesCircle /> Cancel Order
                    </button>
                  )}
                </div>
              )}
              <button
                className="btn-close"
                onClick={() => setSelectedOrder(null)}
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
