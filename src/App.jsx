import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import UserList from "./pages/UserManagement/UserList/UserList";
import AddMaterial from "./pages/Configuration/AddMaterial/AddMaterial.jsx";
import Category from "./pages/Configuration/Category/ListingCategoey.jsx";
import MaterialCategory from "./pages/Configuration/AddMaterial/MaterialCategory.jsx";

import Vechicles from "./pages/Configuration/Vechicles/Vechicles.jsx";
import StaticContent from "./pages/StaticContent/StaticContent.jsx";
import Faq from "./pages/Faq/Faq.jsx";
import Requirements from "./pages/Requirements/Requirements.jsx";
import OrderManagement from "./pages/Orders/OrderManagement.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Login />} />

        {/* PROTECTED */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users/list" element={<UserList />} />
            <Route
              path="/configuration/add-material"
              element={<AddMaterial />}
            />
            <Route path="/configuration/category" element={<Category />} />
            <Route
              path="/configuration/material-category"
              element={<MaterialCategory />}
            />
            <Route path="/configuration/vechicles" element={<Vechicles />} />
            <Route path="/static-content" element={<StaticContent />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/requirements" element={<Requirements />} />
            <Route path="/order-management" element={<OrderManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
