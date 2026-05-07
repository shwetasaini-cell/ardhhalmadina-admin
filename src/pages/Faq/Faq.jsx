import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaInfoCircle,
  FaEye,
  FaPlus,
  FaQuestionCircle,
  FaTrash,
  FaComments,
  FaRegListAlt,
  FaTag,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./FAQSection.css";
import axiosInstance from "../../utils/axiosInstance";

const FAQ_TYPES = [
  { value: "registration", label: "Registration", color: "primary" },
  { value: "general", label: "General", color: "success" },
  { value: "security", label: "Security", color: "danger" },
  { value: "vehicleAuction", label: "Vehicle Auction", color: "warning" },
  { value: "premiumpackage", label: "Premium Package", color: "info" },
  { value: "directSales", label: "Direct Sales", color: "secondary" },
];

export default function FAQManagement() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    type: "general",
    question: "",
    answer: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedType, setSelectedType] = useState("all");

  // Load FAQs using axiosInstance
  const loadFAQs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/faq/");

      // Handle different response structures
      let faqsData = [];

      if (response.data && response.data.success && response.data.data) {
        // If response has data in grouped format: { data: [ { type, faqs: [...] } ] }
        if (Array.isArray(response.data.data)) {
          // Check if it's grouped format
          if (response.data.data[0] && response.data.data[0].faqs) {
            // Grouped format
            faqsData = response.data.data.flatMap((group) =>
              (group.faqs || []).map((faq) => ({
                id: faq._id || faq.id,
                _id: faq._id || faq.id,
                type: group.type,
                question: faq.question,
                answer: faq.answer,
              })),
            );
          } else {
            // Direct array format
            faqsData = response.data.data.map((faq) => ({
              id: faq._id || faq.id,
              _id: faq._id || faq.id,
              type: faq.type,
              question: faq.question,
              answer: faq.answer,
            }));
          }
        } else if (Array.isArray(response.data)) {
          // Response itself is array
          faqsData = response.data.map((faq) => ({
            id: faq._id || faq.id,
            _id: faq._id || faq.id,
            type: faq.type,
            question: faq.question,
            answer: faq.answer,
          }));
        }
      }

      setFaqs(faqsData);
    } catch (error) {
      console.error("Error loading FAQs:", error);
      toast.error(
        "Failed to load FAQs: " +
          (error.response?.data?.message || error.message),
      );
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        type: faq.type || "general",
        question: faq.question || "",
        answer: faq.answer || "",
      });
    } else {
      setEditingFaq(null);
      setFormData({ type: "general", question: "", answer: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFaq(null);
    setFormData({ type: "general", question: "", answer: "" });
  };

  // Create FAQ
  const createFAQ = async (faqData) => {
    try {
      const response = await axiosInstance.post("/faq/create", {
        type: faqData.type,
        question: faqData.question,
        answer: faqData.answer,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating FAQ:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create FAQ",
      };
    }
  };

  // Update FAQ
  const updateFAQ = async (id, faqData) => {
    try {
      const response = await axiosInstance.put(`/faq/${id}`, {
        type: faqData.type,
        question: faqData.question,
        answer: faqData.answer,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating FAQ:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update FAQ",
      };
    }
  };

  // Delete FAQ
  const deleteFAQ = async (id) => {
    try {
      await axiosInstance.delete(`/faq/${id}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete FAQ",
      };
    }
  };

  const handleSave = async () => {
    if (!formData.type) {
      toast.error("Please select a FAQ type");
      return;
    }
    if (!formData.question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    if (!formData.answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    setSubmitting(true);

    const faqId = editingFaq?.id || editingFaq?._id;
    const result = faqId
      ? await updateFAQ(faqId, formData)
      : await createFAQ(formData);

    if (result.success) {
      toast.success(
        faqId ? "FAQ updated successfully!" : "FAQ created successfully!",
      );
      closeModal();
      loadFAQs();
    } else {
      toast.error("Failed to save FAQ: " + (result.error || "Unknown error"));
    }
    setSubmitting(false);
  };

  const handleDelete = async (faq) => {
    const faqId = faq.id || faq._id;
    if (
      window.confirm(
        `Are you sure you want to delete this FAQ?\n\nQuestion: ${faq.question}`,
      )
    ) {
      const result = await deleteFAQ(faqId);
      if (result.success) {
        toast.success("FAQ deleted successfully!");
        loadFAQs();
        if (expandedRow === faqId) setExpandedRow(null);
      } else {
        toast.error(
          "Failed to delete FAQ: " + (result.error || "Unknown error"),
        );
      }
    }
  };

  const toggleExpand = (id) => setExpandedRow(expandedRow === id ? null : id);

  const filteredFaqs =
    selectedType === "all"
      ? faqs
      : faqs.filter((faq) => faq.type === selectedType);

  const getTypeColor = (type) =>
    FAQ_TYPES.find((t) => t.value === type)?.color || "secondary";

  const getTypeLabel = (type) =>
    FAQ_TYPES.find((t) => t.value === type)?.label || type;

  const totalFAQs = faqs.length;

  const typeStats = FAQ_TYPES.reduce((acc, type) => {
    acc[type.value] = faqs.filter((faq) => faq.type === type.value).length;
    return acc;
  }, {});

  return (
    <div className="static-content-page">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <FaQuestionCircle className="title-icon" />
            FAQ Management
          </h1>
          <p className="page-subtitle">
            Manage frequently asked questions and answers for your website
          </p>
        </div>
        <div className="header-right">
          <button className="btn-save" onClick={() => openModal()}>
            <FaPlus /> Add New FAQ
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="faq-filter-tabs">
        <button
          className={`filter-tab ${selectedType === "all" ? "active" : ""}`}
          onClick={() => setSelectedType("all")}
        >
          <FaRegListAlt /> All ({totalFAQs})
        </button>
        {FAQ_TYPES.map((type) => (
          <button
            key={type.value}
            className={`filter-tab ${selectedType === type.value ? "active" : ""} ${type.color}`}
            onClick={() => setSelectedType(type.value)}
          >
            <FaTag /> {type.label} ({typeStats[type.value] || 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="faq-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading FAQs...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="empty-state">
            <FaQuestionCircle className="empty-icon" />
            <h3>No FAQs found</h3>
            <p>
              {selectedType === "all"
                ? "Click the 'Add New FAQ' button to create your first FAQ."
                : `No FAQs found for ${FAQ_TYPES.find((t) => t.value === selectedType)?.label} type.`}
            </p>
          </div>
        ) : (
          <table className="faq-table">
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th className="col-type">Type</th>
                <th className="col-question">Question</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaqs.map((faq, index) => {
                const id = faq.id || faq._id;
                const isExpanded = expandedRow === id;
                return (
                  <React.Fragment key={id}>
                    <tr className={`faq-row ${isExpanded ? "expanded" : ""}`}>
                      <td className="col-num">
                        <span className="row-num">{index + 1}</span>
                      </td>
                      <td className="col-type">
                        <span
                          className={`type-badge ${getTypeColor(faq.type)}`}
                        >
                          <FaTag className="type-icon" />
                          {getTypeLabel(faq.type)}
                        </span>
                      </td>
                      <td className="col-question">
                        <span className="question-text">{faq.question}</span>
                      </td>
                      <td className="col-actions">
                        <div className="faq-actions">
                          <button
                            className="action-btn view"
                            onClick={() => toggleExpand(id)}
                            title={isExpanded ? "Hide Answer" : "View Answer"}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={() => openModal(faq)}
                            title="Edit FAQ"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(faq)}
                            title="Delete FAQ"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="answer-row">
                        <td colSpan="4">
                          <div className="faq-answer">
                            <div className="answer-label">
                              <FaComments /> Answer:
                            </div>
                            <div className="answer-content">{faq.answer}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFaq ? "Edit FAQ" : "Create New FAQ"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="type">
                  FAQ Type <span className="required">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  {FAQ_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="question">
                  Question <span className="required">*</span>
                </label>
                <textarea
                  id="question"
                  name="question"
                  rows="3"
                  value={formData.question}
                  onChange={handleInputChange}
                  placeholder="Enter the frequently asked question..."
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="answer">
                  Answer <span className="required">*</span>
                </label>
                <textarea
                  id="answer"
                  name="answer"
                  rows="6"
                  value={formData.answer}
                  onChange={handleInputChange}
                  placeholder="Enter the answer to the question..."
                  className="form-control"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>
                <FaTimes /> Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="spinner-small"></div>Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> {editingFaq ? "Update" : "Create"} FAQ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="info-footer">
        <div className="info-text">
          <FaInfoCircle className="info-icon" />
          <span>
            Manage your FAQ content here. Each FAQ consists of a type, question,
            and answer pair. Changes will be reflected immediately on the
            frontend.
          </span>
        </div>
      </div>
    </div>
  );
}
