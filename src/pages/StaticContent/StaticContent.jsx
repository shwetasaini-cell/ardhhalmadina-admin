import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaSave,
  FaInfoCircle,
  FaFileAlt,
  FaGavel,
  FaShieldAlt,
  FaHome,
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaHeading,
  FaParagraph,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DOMPurify from "dompurify";
import "./StaticContent.css";
import axiosInstance from "../../utils/axiosInstance";

// TIPTAP
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
// import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {TextStyle} from "@tiptap/extension-text-style";
import  Color from "@tiptap/extension-color";

export default function StaticContent() {
  const [activeKey, setActiveKey] = useState("about");
  const [aboutUs, setAboutUs] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

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

  // Load content function
const loadContent = useCallback(async () => {
  const section = CMS_SECTIONS.find((s) => s.key === activeKey);

  if (!section) return;

  setLoading(true);

  try {
    console.log("Fetching:", section.apiKey);

    const response = await axiosInstance.get(
      `/staticContent/get/${section.apiKey}`,
    );

    console.log("Response:", response.data);

    const content = response.data?.data?.content || "";

    section.setState(content);
  } catch (error) {
    console.error("LOAD ERROR:", error);

    if (error.response?.status !== 404) {
      toast.error(`Failed to load ${section.title}`);
    }

    section.setState("<p>Start editing your content here...</p>");
  } finally {
    setLoading(false);
  }
}, [activeKey]);

useEffect(() => {
  loadContent();
}, [loadContent]);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content:
      currentSection?.state || "<p>Start editing your content here...</p>",
    editable: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      currentSection?.setState(html);
    },
    editorProps: {
      attributes: {
        class: "prose-mirror-editor",
      },
    },
  });

  // Update editor content when section changes
  useEffect(() => {
    if (editor && currentSection?.state !== undefined && !loading) {
      const currentContent = editor.getHTML();
      const newContent =
        currentSection.state || "<p>Start editing your content here...</p>";

      if (currentContent !== newContent) {
        editor.commands.setContent(newContent);
      }
      setEditorReady(true);
    }
  }, [editor, currentSection?.state, loading, activeKey]);

  // Handle save
  const handleSave = async () => {
    if (!currentSection) return;

    const content = DOMPurify.sanitize(currentSection.state || "");

    if (!content.trim() || content === "<p></p>" || content === "<p><br></p>") {
      toast.error("Content cannot be empty");
      return;
    }

    setSaving(true);

    try {
      await axiosInstance.post("/staticContent/create", {
        section: currentSection.apiKey,
        content,
      });

      toast.success(`${currentSection.title} saved successfully!`);
      await loadContent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  // Toolbar button styles
  const toolbarBtnStyle = (isActive = false) => ({
    padding: "8px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    background: isActive ? "#e3f2fd" : "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: isActive ? "#1976d2" : "#333",
    transition: "all 0.2s",
  });

  if (!editor) {
    return (
      <div className="static-content-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Initializing editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="static-content-page">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Navigation Cards */}
      <div className="stats-grid">
        {CMS_SECTIONS.map((section) => (
          <div
            key={section.key}
            className={`stat-card cms-nav-card ${
              activeKey === section.key ? "active" : ""
            }`}
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

      {/* Page Header */}
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

      {/* Editor Section */}
      <div className="editor-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading content...</p>
          </div>
        ) : (
          <div className="editor-container">
            <div className="editor-main-card">
              {/* Toolbar */}
              <div className="editor-toolbar">
                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    style={toolbarBtnStyle(editor.isActive("bold"))}
                    title="Bold"
                  >
                    <FaBold /> B
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    style={toolbarBtnStyle(editor.isActive("italic"))}
                    title="Italic"
                  >
                    <FaItalic /> I
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    style={toolbarBtnStyle(editor.isActive("strike"))}
                    title="Strike"
                  >
                    <FaStrikethrough /> S
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleUnderline().run()
                    }
                    style={toolbarBtnStyle(editor.isActive("underline"))}
                    title="Underline"
                  >
                    U
                  </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    style={toolbarBtnStyle(
                      editor.isActive("heading", { level: 1 }),
                    )}
                  >
                    <FaHeading /> H1
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    style={toolbarBtnStyle(
                      editor.isActive("heading", { level: 2 }),
                    )}
                  >
                    <FaHeading /> H2
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    style={toolbarBtnStyle(
                      editor.isActive("heading", { level: 3 }),
                    )}
                  >
                    <FaHeading /> H3
                  </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    style={toolbarBtnStyle(editor.isActive("bulletList"))}
                  >
                    <FaListUl /> Bullet
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    style={toolbarBtnStyle(editor.isActive("orderedList"))}
                  >
                    <FaListOl /> Numbered
                  </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    style={toolbarBtnStyle(editor.isActive("paragraph"))}
                  >
                    <FaParagraph /> Normal
                  </button>
                </div>
              </div>

              {/* Editor Content Area */}
              <div className="editor-content-area">
                <EditorContent key={activeKey} editor={editor} />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Footer Info */}
      <div className="info-footer">
        <div className="info-text">
          <FaInfoCircle className="info-icon" />
          <span>
            Content is saved to the server. Rich text formatting is supported.
          </span>
        </div>
      </div>
    </div>
  );
}
