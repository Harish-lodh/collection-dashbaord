import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import axios from "axios";
import Loader from "../components/Loader";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const UserList = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get(`${BACKEND_BASE_URL}/getUsers`);
        // Add a sequential id for display only
        const usersWithIndex = (res.data || []).map((user, index) => ({
          ...user,
          id: index + 1, // 👈 This creates an incrementing ID (1, 2, 3, ...)
        }));
        setPayments(usersWithIndex);
      } catch (err) {
        console.error("Error loading payments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const columns = [
    { key: "id", label: "SN" },
    { key: "name", label: "Names" },
    { key: "email", label: "Emails" },
    { key: "role", label: "Roles" },
    {
      key: "createdAt",
      label: "Date & Time",
      render: (v) =>
        new Date(v).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Collectors & RM
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <Loader />
        </div>
      ) : (
        <Table
          columns={columns}
          data={payments}
          onRowClick={(row) => console.log("Clicked row:", row)}
        />
      )}
    </div>
  );
};

export default UserList;
