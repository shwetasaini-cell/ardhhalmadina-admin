import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Contacts from "./pages/Contacts/Contacts";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import UserList from "./pages/UserManagement/UserList/UserList";
import AddMaterial from "./pages/Configuration/AddMaterial/AddMaterial.jsx";
import AddType from "./pages/Configuration/AddType/AddType.jsx";
import Category from "./pages/Configuration/Category/Categoey.jsx";
import Subcategory from "./pages/Configuration/Subcategory/Subcategory.jsx";
import Vechicles from "./pages/Configuration/Vechicles/Vechicles.jsx";
import StaticContent from "./pages/StaticContent/StaticContent.jsx";
import Faq from "./pages/Faq/Faq.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}

        {/* PROTECTED */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users/list" element={<UserList />} />
            <Route
              path="/configuration/add-material"
              element={<AddMaterial />}
            />
            <Route path="/configuration/add-type" element={<AddType />} />
            <Route path="/configuration/category" element={<Category />} />
            <Route
              path="/configuration/subcategory"
              element={<Subcategory />}
            />
            <Route path="/configuration/vechicles" element={<Vechicles />} />
            <Route path="/static-content" element={<StaticContent />} />
            <Route path="/faq" element={<Faq />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
