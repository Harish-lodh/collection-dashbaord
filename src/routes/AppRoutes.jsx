import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/login";
import Layout from "../layout/Layout";
import PaymentsList from '../pages/dealer/PaymentsList';
import UserList from '../pages/usersList';
import CollectionsDashboard from '../pages/dealer/dashboard';
import TrackingBrowser from '../pages/TrackingBrowser'
// Import other page components as needed, e.g.:
// import Dashboard from "../pages/Dashboard";
import ApprovePayments from "../pages/admin/ApprovePayments"
// Simple ProtectedRoute component (move to its own file if preferred)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<CollectionsDashboard />} />
                <Route path="/collection/list" element={<PaymentsList />} />
                <Route path="/collections" element={<ApprovePayments/>}/>
                <Route path="/users/rm" element={<UserList />} />
                <Route path="/reports/daily" element={<h1>working on reports</h1>} />
                <Route path="/repossession" element={<h1>working on repossession</h1>} />
                <Route path="/users/dealers" element={<h1>working on dealers</h1>} />
                <Route path="/users/map" element={<TrackingBrowser/>}/>
            </Route>
        </Routes>
    );
};

export default AppRoutes;