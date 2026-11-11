import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PagesList from "./pages/PagesList.jsx";
import PageForm from "./pages/PageForm.jsx";
import Menus from "./pages/Menus.jsx";
import Account from "./pages/Account.jsx";
import CarouselCMS from "./pages/CarouselCMS.jsx";
import ReviewsAdmin from "./pages/Review/Reviews.jsx";
import FAQ from "./pages/faq/FAQ.jsx";
import ProjectsAdmin from "./pages/ProjectsAdmin/ProjectsAdmin.jsx";
import DesignGalleryAdmin from "./pages/DesignGalleryAdmin/DesignGalleryAdmin.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Account />} />
        <Route path="/pages" element={<PagesList />} />
        <Route path="/hero" element={<CarouselCMS />} />
        <Route path="/pages/new" element={<PageForm />} />
        <Route path="/pages/:id" element={<PageForm />} />
        <Route path="/menus" element={<Menus />} />
        <Route path="/account" element={<Account />} />
        <Route path="/review" element={<ReviewsAdmin />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/projects" element={<ProjectsAdmin />} />
        <Route path="/design" element={<DesignGalleryAdmin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
