import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import axios from "axios";
import Loader from "../components/Loader";
import { bufferToBase64Image } from "../Utils/helper";
import { getDealer } from "../Utils/helper";

import {
  IconButton,
  Modal,
  Button,
  TextField,
  Popover,
  Pagination,
  Autocomplete,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterListIcon from "@mui/icons-material/FilterList";
import GetAppIcon from "@mui/icons-material/GetApp";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

/* ------------------ Filter Popover ------------------ */
const FilterContent = ({
  tempFilters,
  setTempFilters,
  onApply,
  onClear,
  usersOpts,
}) => {
  return (
    <div
      style={{
        padding: 12,
        width: "26vw",
        maxWidth: 350,
        backgroundColor: "#fffbe6", // light yellow bg
        borderRadius: 8,
      }}
    >
      <TextField
        fullWidth
        label="Customer Name"
        value={tempFilters.customerName}
        onChange={(e) =>
          setTempFilters((prev) => ({ ...prev, customerName: e.target.value }))
        }
        sx={{ mb: 1.5 }}
      />

      {/* Multi-select user list (by name) */}
      <Autocomplete
        multiple
        options={usersOpts}
        getOptionLabel={(option) => option.label}
        value={
          usersOpts.filter((u) =>
            tempFilters.collectedBy?.includes(u.label)
          ) || []
        }
        onChange={(e, value) =>
          setTempFilters((prev) => ({
            ...prev,
            collectedBy: value.map((v) => v.label),
          }))
        }
        renderInput={(params) => (
          <TextField {...params} label="Collected By" sx={{ mb: 1.5 }} />
        )}
      />

      <TextField
        fullWidth
        label="Start Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={tempFilters.startDate || ""}
        onChange={(e) =>
          setTempFilters((prev) => ({
            ...prev,
            startDate: e.target.value || null,
          }))
        }
        sx={{ mb: 1.5 }}
        inputProps={{
          max: tempFilters.endDate || undefined,
        }}
      />

      <TextField
        fullWidth
        label="End Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={tempFilters.endDate || ""}
        onChange={(e) =>
          setTempFilters((prev) => ({
            ...prev,
            endDate: e.target.value || null,
          }))
        }
        sx={{ mb: 2 }}
        inputProps={{
          min: tempFilters.startDate || undefined,
        }}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button onClick={onClear} variant="outlined" size="small">
          Clear
        </Button>
        <Button onClick={onApply} variant="contained" size="small">
          Apply
        </Button>
      </div>
    </div>
  );
};

/* ------------------ Main Component ------------------ */
const PaymentsList = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [usersOpts, setUsersOpts] = useState([]);

  const [selectedImage, setSelectedImage] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    customerName: "",
    collectedBy: [],
    startDate: null,
    endDate: null,
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [tempFilters, setTempFilters] = useState(filters);
  //const dealer = localStorage.getItem("dealer");
  /* === Fetch Users === */
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await axios.get(`${BACKEND_BASE_URL}/getUsers`);
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        const opts = list.map((u) => ({
          id: u.id,
          label: u.name || `User #${u.id}`,
        }));
        if (!ignore) setUsersOpts(opts);
      } catch (e) {
        toast.error("Failed to fetch users");
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  /* === Modal === */
  const handleOpenModal = (imgUrl) => {
    setSelectedImage(imgUrl);
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setSelectedImage(null);
    setOpenModal(false);
  };

  /* === Popover === */
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setTempFilters(filters);
  };
  const handleClose = () => setAnchorEl(null);
  const handleApply = () => {
    setFilters(tempFilters);
    handleClose();
  };
  const handleClear = () => {
    const cleared = {
      page: 1,
      limit: 10,
      customerName: "",
      collectedBy: [],
      startDate: null,
      endDate: null,
    };
    setTempFilters(cleared);
    setFilters(cleared);
    handleClose();
  };

  /* === Fetch Payments === */
  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = `?page=${filters.page}&limit=${filters.limit}&partner=${getDealer()}`;
      if (filters.customerName)
        query += `&customerName=${encodeURIComponent(filters.customerName)}`;
      if (filters.collectedBy?.length)
        query += `&collectedBy=${encodeURIComponent(
          filters.collectedBy.join(",")
        )}`;
      if (filters.startDate) query += `&startDate=${filters.startDate}`;
      if (filters.endDate) query += `&endDate=${filters.endDate}`;

      const res = await axios.get(`${BACKEND_BASE_URL}/web/collection${query}`);
      const data = res.data.data || [];

      const formattedData = data.map((item) => ({
        ...item,
        vehicleNumber:
          item.vehicleNumber && item.vehicleNumber.trim() !== ""
            ? item.vehicleNumber
            : "NA",
        image1Url: bufferToBase64Image(item.image1),
        image2Url: bufferToBase64Image(item.image2),
      }));

      const total = res.data.total || formattedData.length;
      const totalPages =
        res.data.totalPages || Math.ceil(total / filters.limit) || 1;

      setPayments(formattedData);
      setPagination({ total, totalPages });
    } catch (err) {
      console.error("Error loading payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [
    filters.customerName,
    filters.collectedBy,
    filters.startDate,
    filters.endDate,
    filters.page,
  ]);

  /* === Excel Export === */
  /* === Excel Export === */
  const exportToExcel = () => {
    if (!payments.length) {
      toast.warn("No data to export!");
      return;
    }

    // Explicitly include only relevant fields
    const cleanData = payments.map((p) => ({
      "Customer Name": p.customerName || "",
      "Vehicle No.": p.vehicleNumber || "",
      Contact: p.contactNumber || "",
      "Payment Date": p.paymentDate
        ? new Date(p.paymentDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "",
      Mode: p.paymentMode || "",
      "Transaction ID": p.paymentRef || "",
      Amount: p.amount ? parseFloat(p.amount).toLocaleString("en-IN") : "",
      "Collected By": p.collectedBy || "",
      Status: p.status || "",
    }));

    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");

    XLSX.writeFile(wb, "payments_filtered.xlsx");
    toast.success("Excel exported successfully!");
  };


  /* === Table Columns === */
  const columns = [
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
    { key: "paymentRef", label: "TRANSACTION ID" },
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
  ];

  const open = Boolean(anchorEl);

  return (
    <div className="p-2 flex-1 w-full">
      {/* Header + Filter + Export */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Payments List</h2>
        <div className="flex gap-2">
          <Button
            variant="contained"
            sx={{ backgroundColor: "#1e40af", color: "white" }}
            startIcon={<FilterListIcon />}
            onClick={handleClick}
          >
            Filter
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<GetAppIcon />}
            onClick={exportToExcel}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <FilterContent
          tempFilters={tempFilters}
          setTempFilters={setTempFilters}
          onApply={handleApply}
          onClear={handleClear}
          usersOpts={usersOpts}
        />
      </Popover>

      {/* Table or Loader */}
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

          {/* Pagination with light yellow bg */}
          {pagination.totalPages >= 1 && (
            <div className="flex justify-end mt-2 pr-4">
              <div className="px-3 py-2">
                <Pagination
                  shape="rounded"
                  count={pagination.totalPages}
                  page={filters.page}
                  onChange={(event, value) =>
                    setFilters((prev) => ({ ...prev, page: value }))
                  }
                  sx={{
                    "& .MuiPaginationItem-root.Mui-selected": {
                      backgroundColor: "#facc15",
                      color: "white",
                    },
                    "& .MuiPaginationItem-root.Mui-selected:hover": {
                      backgroundColor: "#fbbf24",
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* Image Preview Modal */}
          <Modal open={openModal} onClose={handleCloseModal}>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "white",
                boxShadow: 24,
                padding: 6,
                borderRadius: 8,
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
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default PaymentsList;
