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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterListIcon from "@mui/icons-material/FilterList";
import GetAppIcon from "@mui/icons-material/GetApp";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import apiClient from "../../server/apiClient"; // axios instance with baseURL, interceptors, etc.
import { handleGenerateReceipt } from "../../Utils/helper";
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
const ApprovePayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [usersOpts, setUsersOpts] = useState([]);
  const [bankUtr, setBankUtr] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // 👇 Add approved flag (false = pending-approval only)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    customerName: "",
    collectedBy: [],
    startDate: null,
    endDate: null,
    approved: false, // show NON-approved payments by default
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [tempFilters, setTempFilters] = useState(filters);

  // 👇 New states for approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRowForApprove, setSelectedRowForApprove] = useState(null);
  const [bankDate, setBankDate] = useState("");

  /* ------------------ Helper: Build Query ------------------ */
  const buildQueryString = (baseFilters, override = {}) => {
    const merged = { ...baseFilters, ...override };
    const {
      page,
      limit,
      customerName,
      collectedBy,
      startDate,
      endDate,
      approved,
    } = merged;

    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    params.set("partner", getDealer());

    if (customerName) params.set("customerName", customerName);
    if (collectedBy?.length) params.set("collectedBy", collectedBy.join(","));
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    // 👇 very important: only non-approved by default
    if (approved !== undefined) {
      params.set("approved", approved); // "false" / "true"
    }

    return `?${params.toString()}`;
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
      } catch (err) {
        console.error("Fetch Users Error:", err);
        toast.error("Failed to fetch users");
      }
    })();
  }, []);

  /* ------------------ Image Loader ------------------ */
  const loadAndShowImage = async (id, partner, type) => {
    try {
      const res = await apiClient.get(`/web/collection/${id}/images`, {
        params: {
          partner,//here send partner which is click on receipt 
          type,
        },
      });

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
      page: 1, // reset page
      customerName: tempFilters.customerName,
      collectedBy: tempFilters.collectedBy,
      startDate: tempFilters.startDate,
      endDate: tempFilters.endDate,
      // keep approved: false → still only pending approvals
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
      approved: false, // reset back to "only non-approved"
    };
    setTempFilters(cleared);
    setFilters(cleared);
    handleClose();
  };

  /* ------------------ Approve Dialog Helpers ------------------ */
  const handleOpenApproveDialog = (row) => {
    const defaultBankDate = row.paymentDate
      ? new Date(row.paymentDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    setSelectedRowForApprove(row);
    setBankDate(defaultBankDate);
    setApproveDialogOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!bankDate) {
      toast.error("Please select a bank date");
      return;
    }

    if (!bankUtr?.trim()) {
      toast.error("Please enter Bank UTR");
      return;
    }

    try {
      const res = await apiClient.post(
        `/web/collection/${selectedRowForApprove.id}/approve`,
        {
          partner: selectedRowForApprove.partner,
          bankDate,
          bankUtr,  // <<< NEW FIELD SEND TO API
        }
      );

      toast.success("Payment approved");

      // Update UI instantly
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedRowForApprove.id
            ? {
              ...p,
              approved: true,
              approved_by: res.data?.approved_by || "You",
              bankDate,
              bankUtr,
            }
            : p
        )
      );
    } catch (err) {
      console.error("Approve payment error:", err);

      const data = err.response?.data;

      // Safely extract the first row error reason if present
      const rowErrorReason =
        data?.lmsResponse?.row_errors?.[0]?.reason || null;

      const reason =
        rowErrorReason ||
        data?.message || // "LMS did not approve this payment"
        err.message ||
        "Failed to approve payment";

      toast.error(reason);
    } finally {
      setApproveDialogOpen(false);
      setSelectedRowForApprove(null);
      setBankDate("");
      setBankUtr(""); // reset
    }
  };



  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setSelectedRowForApprove(null);
    setBankDate("");
  };

  /* ------------------ Fetch Payments ------------------ */
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const query = buildQueryString(filters);
        const res = await apiClient.get(`/web/collection${query}`);

        const formatted = (res.data?.data || []).map((item) => ({
          ...item,
          loanId: item.loanId || "",
          vehicleNumber:
            item.vehicleNumber?.trim() !== "" ? item.vehicleNumber : "NA",
          approved: item.approved ?? false,
          approved_by: item.approved_by ?? null,
        }));

        setPayments(formatted);
        setPagination({
          total: res.data.total ?? 0,
          totalPages: res.data.totalPages ?? 0,
        });
      } catch (err) {
        console.error("Fetch Payments Error:", err);
        toast.error("Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [filters]);

  /* ------------------ Excel Export (ALL PENDING DATA) ------------------ */
  // const exportToExcel = async () => {
  //   try {
  //     if (!payments.length) {
  //       toast.warn("No data to export!");
  //       return;
  //     }

  //     const excludeKeys = [
  //       "image1Present",
  //       "image2Present",
  //       "selfiePresent",
  //       "approved_by",
  //     ];

  //     const formatDate = (date) => {
  //       if (!date) return "-";
  //       const d = new Date(date);
  //       if (isNaN(d)) return "-";

  //       const dd = String(d.getDate()).padStart(2, "0");
  //       const mm = String(d.getMonth() + 1).padStart(2, "0");
  //       const yyyy = d.getFullYear();

  //       return `${dd}-${mm}-${yyyy}`;
  //     };

  //     const dateKeys = ["paymentDate", "createdAt"];

  //     // ✅ Use CURRENT PAGE data only
  //     const cleanData = payments.map((item) =>
  //       Object.fromEntries(
  //         Object.entries(item)
  //           .filter(([key]) => !excludeKeys.includes(key))
  //           .map(([key, value]) => {
  //             if (dateKeys.includes(key)) {
  //               return [key, formatDate(value)];
  //             }
  //             return [key, value ?? "-"];
  //           })
  //       )
  //     );

  //     const ws = XLSX.utils.json_to_sheet(cleanData);
  //     const wb = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(wb, ws, "Payments");

  //     XLSX.writeFile(wb, "payments_current_page.xlsx");
  //     toast.success("Current page exported successfully!");
  //   } catch (err) {
  //     console.error("Export Excel Error:", err);
  //     toast.error("Failed to export Excel");
  //   }
  // };

const exportToExcel = async () => {
  try {
    // Step 1: Check if data exists
    if (!payments.length) {
      toast.warn("No data to export!");
      return;
    }

    // Step 2: Fetch all data based on current filters
    setLoading(true);
    const query = buildQueryString(filters, { page: 1, limit: pagination.total });
    const res = await apiClient.get(`/web/collection${query}`);
    
    const allPayments = res.data?.data || [];
    
    if (!allPayments.length) {
      toast.warn("No payments found for the selected filters!");
      return;
    }

    // Step 3: Process data to exclude certain keys and format dates
    const excludeKeys = [
      "image1Present", "image2Present", "selfiePresent", "status", "approved"
    ];

    const formatDate = (date) => {
      if (!date) return "-";
      const d = new Date(date);
      if (isNaN(d)) return "-";
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    const dateKeys = ["paymentDate", "createdAt"];

    // Step 4: Clean data for export
    const cleanData = allPayments.map((item) =>
      Object.fromEntries(
        Object.entries(item)
          .filter(([key]) => !excludeKeys.includes(key))
          .map(([key, value]) => {
            if (dateKeys.includes(key)) {
              return [key, formatDate(value)];
            }
            return [key, value ?? "-"];
          })
      )
    );

    // Step 5: Generate Excel file
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");

    // Step 6: Download the file
    XLSX.writeFile(wb, "payments_all_data.xlsx");

    toast.success("All data exported successfully!");
  } catch (err) {
    console.error("Export Excel Error:", err);
    toast.error("Failed to export Excel");
  } finally {
    setLoading(false);
  }
};




  /* ------------------ Table Columns ------------------ */
  const columns = [
    { key: "loanId", label: "Loan Id", exportable: true },
    { key: "customerName", label: "Customer Name", exportable: true },
    { key: "vehicleNumber", label: "Vehicle No.", exportable: true },
    { key: "contactNumber", label: "Contact", exportable: true },
    {
      key: "paymentDate",
      label: "Payment Date",
      exportable: true,
      render: (v) =>
        v
          ? new Date(v).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "-",
    },
    { key: "partner", label: "Partners", exportable: true },
    { key: "paymentMode", label: "Mode", exportable: true },
    { key: "paymentRef", label: "Transaction ID", exportable: true },
    {
      key: "amount",
      label: "Amount (₹)",
      exportable: true,
      render: (v) => (v ? Number(v).toLocaleString("en-IN") : "-"),
    },
    { key:"insurance",label:"insurance"},
    { key:"remark",label:"remarks"},
    { key: "collectedBy", label: "Collected By", exportable: true },
    { key: "status", label: "Status", exportable: true },

    // 👇 Approval column
    {
      key: "approved",
      label: "Approval",
      exportable: false, // don't send buttons/HTML to Excel
      render: (v, row) =>
        v ? (
          <span style={{ color: "green", fontWeight: 600 }}>Approved</span>
        ) : (
          <Button
            size="small"
            variant="contained"
            onClick={() => handleOpenApproveDialog(row)}
          >
            Approve
          </Button>

        ),
    },

    // Optional display: who approved (for when you later show approved list)
    {
      key: "approved_by",
      label: "Approved By",
      exportable: true,
      render: (v) => v || "-",
    },

    // Image 1
    {
      key: "image1Present",
      label: "Image 1",
      exportable: false,
      render: (v, row) =>
        row.image1Present ? (
          <IconButton onClick={() => loadAndShowImage(row.id, row.partner, "image1")}>
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
      exportable: false,
      render: (v, row) =>
        row.image2Present ? (
          <IconButton onClick={() => loadAndShowImage(row.id, row.partner, "image2")}>
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
      exportable: false,
      render: (v, row) =>
        row.selfiePresent ? (
          <IconButton onClick={() => loadAndShowImage(row.id, row.partner, "selfie")}>
            <VisibilityIcon />
          </IconButton>
        ) : (
          "-"
        ),
    },
    // 👇 NEW: Receipt column
    {
      key: "receipt",
      label: "Receipt",
      exportable: false,
      render: (v, row) =>
      // row.approved ?
      (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleGenerateReceipt(row)}
        >
          Receipt
        </Button>
      )
      // : (
      //   <span style={{ fontSize: 12, color: "#9ca3af" }}>Pending</span>
      // ),
    },
  ];

  const open = Boolean(anchorEl);

  /* ------------------ Render ------------------ */
  return (
    <div className="p-2 flex-1 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Payments List (Pending Approval)
        </h2>

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

          {/* 👇 New Approve Dialog */}
          <Dialog
            open={approveDialogOpen}
            onClose={handleCloseApproveDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Approve Payment - Set Bank Date</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Bank Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={bankDate}
                onChange={(e) => setBankDate(e.target.value)}
                sx={{ mt: 1, mb: 2 }}
              />

              <TextField
                fullWidth
                label="Bank UTR No."
                placeholder="Enter UTR"
                value={bankUtr}
                onChange={(e) => setBankUtr(e.target.value)}
              />
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseApproveDialog}>Cancel</Button>
              <Button onClick={handleConfirmApprove} variant="contained">
                Approve
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ApprovePayments;