import React, { useEffect, useState } from "react";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import { getDealer } from "../../Utils/helper";

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
import apiClient from "../../server/apiClient";

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
        backgroundColor: "#fffbe6",
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

      <Autocomplete
        multiple
        options={usersOpts}
        getOptionLabel={(option) => option.label}
        value={usersOpts.filter((u) =>
          tempFilters.collectedBy?.includes(u.label)
        )}
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
        inputProps={{ max: tempFilters.endDate || undefined }}
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
        inputProps={{ min: tempFilters.startDate || undefined }}
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

/* ---------------------------------------------------- */
/* ------------------ Main Component ------------------ */
/* ---------------------------------------------------- */
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

  /* ------------------ Helper: Build Query ------------------ */
  const buildQueryString = (baseFilters, override = {}) => {
    const merged = { ...baseFilters, ...override };
    const { page, limit, customerName, collectedBy, startDate, endDate } =
      merged;

    let query = `?page=${page}&limit=${limit}&partner=${getDealer()}`;

    if (customerName)
      query += `&customerName=${encodeURIComponent(customerName)}`;

    if (collectedBy?.length)
      query += `&collectedBy=${encodeURIComponent(collectedBy.join(","))}`;

    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;

    return query;
  };

  /* ------------------ Load Users ------------------ */
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/getUsers");
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];

        setUsersOpts(
          list.map((u) => ({
            id: u.id,
            label: u.name || `User #${u.id}`,
          }))
        );
      } catch {
        toast.error("Failed to fetch users");
      }
    })();
  }, []);

  /* ------------------ Image Loader ------------------ */
  const loadAndShowImage = async (id, type) => {
    try {
      const res = await apiClient.get(
        `/web/collection/${id}/images?partner=${getDealer()}&type=${type}`
      );

      const base64 = res.data.image;

      if (base64) {
        setSelectedImage(`data:image/jpeg;base64,${base64}`);
        setOpenModal(true);
      } else {
        toast.warn("No image available");
      }
    } catch (err) {
      console.error("Image load error:", err);
      toast.error("Failed to load image");
    }
  };

  /* ------------------ Modal ------------------ */
  const handleCloseModal = () => {
    setSelectedImage(null);
    setOpenModal(false);
  };

  /* ------------------ Popover Filters ------------------ */
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setTempFilters(filters);
  };

  const handleClose = () => setAnchorEl(null);

  const handleApply = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1, // reset page when applying new filters
      customerName: tempFilters.customerName,
      collectedBy: tempFilters.collectedBy,
      startDate: tempFilters.startDate,
      endDate: tempFilters.endDate,
    }));
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

  /* ------------------ Fetch Payments ------------------ */
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const query = buildQueryString(filters);
        const res = await apiClient.get(`/web/collection${query}`);

        const formatted = res.data.data.map((item) => ({
          ...item,
          loanId: item.loanId || "",
          vehicleNumber:
            item.vehicleNumber?.trim() !== "" ? item.vehicleNumber : "NA",
        }));

        setPayments(formatted);
        setPagination({
          total: res.data.total,
          totalPages: res.data.totalPages,
        });
      } catch (err) {
        console.error("Fetch Payments Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [filters]); // single dependency

  /* ------------------ Excel Export (ALL DATA, EXCLUDING IMAGE COLUMNS) ------------------ */
  const exportToExcel = async () => {
    try {
      if (!pagination.total) {
        toast.warn("No data to export!");
        return;
      }

      // Build same filter query, but force page=1 and limit = total
      const query = buildQueryString(filters, {
        page: 1,
        limit: pagination.total,
      });

      // Fetch ALL filtered records, not just current page
      const res = await apiClient.get(`/web/collection${query}`);

      const allData = res.data.data.map((item) => ({
        ...item,
        loanId: item.loanId || "",
        vehicleNumber:
          item.vehicleNumber?.trim() !== "" ? item.vehicleNumber : "NA",
      }));

      // Dynamically filter exportable columns (exclude those with IconButton renders, i.e., images)
      const exportColumns = columns.filter(
        (col) =>
          !col.render ||
          !col.render.toString().includes("IconButton")
      );

      // Prepare headers from exportable columns
      const headers = exportColumns.map((col) => col.label);

      // Prepare data rows: apply render functions where available for formatting
      const cleanData = allData.map((row) =>
        exportColumns.reduce((acc, col) => {
          const value =
            col.render
              ? col.render(row[col.key], row)
              : row[col.key] ?? "-";
          acc[col.label] = value;
          return acc;
        }, {})
      );

      const ws = XLSX.utils.json_to_sheet(cleanData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payments");

      XLSX.writeFile(wb, "payments_all_filtered.xlsx");
      toast.success("Excel exported successfully!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      toast.error("Failed to export Excel");
    }
  };

  /* ------------------ Table Columns ------------------ */
  const columns = [
    { key: "loanId", label: "Loan Id" },
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
    { key: "paymentRef", label: "Transaction ID" },
    {
      key: "amount",
      label: "Amount (₹)",
      render: (v) => (v ? Number(v).toLocaleString("en-IN") : "-"),
    },
    { key: "collectedBy", label: "Collected By" },
    { key: "status", label: "Status" },

    // Image 1
    {
      key: "image1Present",
      label: "Image 1",
      render: (v, row) =>
        row.image1Present ? (
          <IconButton onClick={() => loadAndShowImage(row.id, "image1")}>
            <VisibilityIcon />
          </IconButton>
        ) : (
          "-"
        ),
    },

    // Image 2
    {
      key: "image2Present",
      label: "Image 2",
      render: (v, row) =>
        row.image2Present ? (
          <IconButton onClick={() => loadAndShowImage(row.id, "image2")}>
            <VisibilityIcon />
          </IconButton>
        ) : (
          "-"
        ),
    },

    // Selfie Image
    {
      key: "selfiePresent",
      label: "Selfie",
      render: (v, row) =>
        row.selfiePresent ? (
          <IconButton onClick={() => loadAndShowImage(row.id, "selfie")}>
            <VisibilityIcon />
          </IconButton>
        ) : (
          "-"
        ),
    },
  ];

  const open = Boolean(anchorEl);

  /* ------------------ Render ------------------ */
  return (
    <div className="p-2 flex-1 w-full">
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

      {/* Filters Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <FilterContent
          tempFilters={tempFilters}
          setTempFilters={setTempFilters}
          onApply={handleApply}
          onClear={handleClear}
          usersOpts={usersOpts}
        />
      </Popover>

      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <Loader />
        </div>
      ) : (
        <>
          <Table columns={columns} data={payments} />

          {/* Pagination */}
          {pagination.totalPages >= 1 && (
            <div className="flex justify-end mt-2 pr-4">
              <Pagination
                shape="rounded"
                count={pagination.totalPages}
                page={filters.page}
                onChange={(e, value) =>
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
          )}

          {/* Image Modal */}
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
        </>
      )}
    </div>
  );
};

export default PaymentsList;