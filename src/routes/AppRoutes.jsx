import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/login";
import Layout from "../layout/Layout";
import PaymentsList from '../pages/PaymentsList';
import UserList from '../pages/usersList';
import CollectionsDashboard from '../pages/dashboard'
// Import other page components as needed, e.g.:
// import Dashboard from "../pages/Dashboard";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={
                 <CollectionsDashboard/>
                } />
                <Route path="/collection/list" element={<PaymentsList />} />
                  <Route path="/users/rm" element={<UserList />} />
                  <Route path="/reports/daily" element={<h1>working on reports</h1>} />
                  <Route path="/repossession" element={<h1>working on repossession</h1>} />
                  <Route path="/users/dealers" element={<h1>working on dealers</h1>} />
                {/* Add more nested routes here, e.g.: */}
                {/* <Route path="profile" element={<Profile />} /> */}
            </Route>
        </Routes>
    );
};

export default AppRoutes;