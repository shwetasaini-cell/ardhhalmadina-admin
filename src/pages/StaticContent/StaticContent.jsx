import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaInfoCircle,
  FaFileAlt,
  FaGavel,
  FaShieldAlt,
  FaHome,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DOMPurify from "dompurify";
import "./StaticContent.css";
import axiosInstance from "../../utils/axiosInstance";

export default function StaticContent() {
  const [activeKey, setActiveKey] = useState("about");
  const [aboutUs, setAboutUs] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const CMS_SECTIONS = [
    {
      key: "about",
      title: "About Us",
      icon: <FaHome />,
      color: "primary",
      apiKey: "aboutUs",
      state: aboutUs,
      setState: setAboutUs,
    },
    {
      key: "privacy",
      title: "Privacy Policy",
      icon: <FaShieldAlt />,
      color: "success",
      apiKey: "privacyPolicy",
      state: privacyPolicy,
      setState: setPrivacyPolicy,
    },
    {
      key: "terms",
      title: "Terms & Conditions",
      icon: <FaGavel />,
      color: "secondary",
      apiKey: "termsAndConditions",
      state: termsConditions,
      setState: setTermsConditions,
    },
  ];

  const currentSection = CMS_SECTIONS.find((s) => s.key === activeKey);

  const loadContent = async () => {
    if (!currentSection) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/staticContent/get/${currentSection.apiKey}`,
      );
      currentSection.setState(response.data?.data?.content || "");
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error(`Failed to load ${currentSection.title}`);
      }
      currentSection.setState("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [activeKey]);

  const handleSave = async () => {
    if (!currentSection) return;

    const content = DOMPurify.sanitize(currentSection.state || "");
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post("/staticContent/create", {
        section: currentSection.apiKey,
        content: content,
      });
      toast.success(`${currentSection.title} saved successfully!`);
      await loadContent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="static-content-page">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="stats-grid">
        {CMS_SECTIONS.map((section) => (
          <div
            key={section.key}
            className={`stat-card cms-nav-card ${activeKey === section.key ? "active" : ""}`}
            onClick={() => setActiveKey(section.key)}
            style={{ cursor: "pointer" }}
          >
            <div className={`stat-icon ${section.color}`}>{section.icon}</div>
            <div className="stat-info">
              <h3>{section.title}</h3>
              <p>Click to edit</p>
            </div>
          </div>
        ))}
      </div>

      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <FaFileAlt className="title-icon" />
            {currentSection?.title || "Content Management"}
          </h1>
          <p className="page-subtitle">
            Manage {currentSection?.title?.toLowerCase() || "content"} for your
            website
          </p>
        </div>
        <div className="header-right">
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <FaSave /> Save Content
              </>
            )}
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading content...</p>
          </div>
        ) : (
          <div className="editor-container">
            <textarea
              className="content-editor"
              value={currentSection?.state || ""}
              onChange={(e) => currentSection?.setState(e.target.value)}
              placeholder={`Edit ${currentSection?.title?.toLowerCase()} content here...`}
              rows={20}
              style={{
                width: "100%",
                padding: "16px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontFamily: "inherit",
                fontSize: "14px",
                lineHeight: "1.6",
                resize: "vertical",
              }}
            />
          </div>
        )}
      </div>

      <div className="info-footer">
        <div className="info-text">
          <FaInfoCircle className="info-icon" />
          <span>
            Content is saved to the server. HTML formatting is supported.
          </span>
        </div>
      </div>
    </div>
  );
}
