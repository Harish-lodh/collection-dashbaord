import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import axios from "axios";
import Loader from "../components/Loader";
import { bufferToBase64Image } from "../Utils/helper";
import { IconButton, Modal, Box } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";



const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const PaymentsList = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  const [selectedImage, setSelectedImage] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = (imgUrl) => {
    setSelectedImage(imgUrl);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setOpenModal(false);
  };


  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get(`${BACKEND_BASE_URL}/loanDetails/collection`);
        console.log(res.data);

        const formattedData = (res.data || []).map((item, index) => ({
          ...item,
          id: index + 1,
          vehicleNumber:
            item.vehicleNumber && item.vehicleNumber.trim() !== ""
              ? item.vehicleNumber
              : "NA",
          // ✅ Convert BLOBs to Base64 URLs
          image1Url: bufferToBase64Image(item.image1),
          image2Url: bufferToBase64Image(item.image2),
        }));

        setPayments(formattedData);
      } catch (err) {
        console.error("Error loading payments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const columns = [
    { key: "id", label: "ID" },
    { key: "customerName", label: "Customer Name" },
    { key: "vehicleNumber", label: "Vehicle No." },
    { key: "contactNumber", label: "Contact" },
    {
      key: "paymentDate",
      label: "Payment Date",
      render: (v) =>
        v
          ? new Date(v).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "-",
    },
    { key: "paymentMode", label: "Mode" },
    {
      key: "amount",
      label: "Amount (₹)",
      render: (v) => (v ? parseFloat(v).toLocaleString("en-IN") : "-"),
    },
    { key: "collectedBy", label: "Collected By" },
    { key: "status", label: "Status" },
    {
      key: "image1Url",
      label: "Image 1",
      render: (v) =>
        v ? (
          <IconButton color="primary" onClick={() => handleOpenModal(v)}>
            <VisibilityIcon />
          </IconButton>
        ) : (
          "-"
        ),
    },
    {
      key: "image2Url",
      label: "Image 2",
      render: (v) =>
        v ? (
          <IconButton color="secondary" onClick={() => handleOpenModal(v)}>
            <VisibilityIcon />
          </IconButton>
        ) : (
          "-"
        ),
    },

    {
      key: "createdAt",
      label: "Created On",
      render: (v) =>
        new Date(v).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];


  return (
    <div className="p-2 flex-1 w-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Payments List
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <Loader />
        </div>
      ) : (
        <div className="w-full">
          <Table
            columns={columns}
            data={payments}
            onRowClick={(row) => console.log("Clicked row:", row)}
          />
          <Modal open={openModal} onClose={handleCloseModal}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                bgcolor: "background.paper",
                boxShadow: 24,
                p: 2,
                borderRadius: 2,
                maxWidth: "80vw",
                maxHeight: "90vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Full View"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    borderRadius: 8,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <p>No image available</p>
              )}
            </Box>
          </Modal>

        </div>
      )}
    </div>
  );
};

export default PaymentsList;
