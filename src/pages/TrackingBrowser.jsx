// src/pages/TrackingBrowser.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import LeafletMap from "../components/LeafletMap";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Popover,
  TextField,
  Autocomplete,
  Typography,
  IconButton,
  Paper,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  MyLocation as LocationIcon,
} from "@mui/icons-material";

const BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const TrackingBrowser = () => {
  const [usersOpts, setUsersOpts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userOption, setUserOption] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedUserId, setAppliedUserId] = useState(null);
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const open = Boolean(anchorEl);
  const hasActiveFilters = appliedUserId || appliedFrom || appliedTo;

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BACKEND_URL}/getUsers`);
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
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const applyFilters = () => {
    if (!userOption?.id) {
      toast.warn("Please select a user");
      return;
    }
    setAppliedUserId(userOption.id);
    setAppliedFrom(from || "");
    setAppliedTo(to || "");
    setAnchorEl(null);
    toast.success("Filters applied");
  };

  const clearFilters = () => {
    setUserOption(null);
    setFrom("");
    setTo("");
    setAppliedUserId(null);
    setAppliedFrom("");
    setAppliedTo("");
    toast.info("Filters cleared");
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f5f7fa",
      }}
    >
      {/* Compact Header */}
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "white",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <LocationIcon sx={{ color: "#1e40af", fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Location Tracker
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {hasActiveFilters && (
              <>
                <Stack direction="row" spacing={0.75} mr={1}>
                  {appliedUserId && (
                    <Chip
                      label={
                        usersOpts.find((u) => u.id === appliedUserId)?.label ||
                        `User #${appliedUserId}`
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {appliedFrom && (
                    <Chip
                      label={appliedFrom}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {appliedTo && (
                    <Chip
                      label={appliedTo}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <IconButton
                  size="small"
                  onClick={clearFilters}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "error.main" },
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              </>
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<FilterIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
sx={{
  textTransform: "none",
  px: 2,
  py: 0.75,
  background: "#1e40af", // Tailwind text-blue-800
  boxShadow: "0 2px 8px rgba(30, 64, 175, 0.25)",
  "&:hover": {
    background: "#1e3a8a", // darker blue on hover
    boxShadow: "0 4px 12px rgba(30, 64, 175, 0.35)",
  },
}}

            >
              Filter
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Filter Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              mt: 1,
              borderRadius: 2,
              width: 380,
              maxWidth: "90vw",
              overflow: "hidden",
            },
          },
        }}
      >


<Box sx={{ p: 2.5, position: "relative" }}>
  {/* Fixed close icon in top-right corner */}
  <IconButton
    size="small"
    onClick={() => setAnchorEl(null)}
    sx={{
      color: "text.secondary",
      position: "absolute",
      top: 8,
      right: 8,
      
    }}
  >
    <CloseIcon />
  </IconButton>

  <Stack spacing={2.5} mt={3}>
    <Autocomplete
      options={usersOpts}
      value={userOption}
      onChange={(e, newValue) => setUserOption(newValue)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label="User"
          variant="outlined"
          placeholder="Select user..."
          size="small"
        />
      )}
    />

    <Stack spacing={2}>
      <TextField
        label="From"
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        InputLabelProps={{ shrink: true }}
        size="small"
        fullWidth
      />
      <TextField
        label="To"
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        InputLabelProps={{ shrink: true }}
        size="small"
        fullWidth
      />
    </Stack>
  </Stack>

  <Stack direction="row" spacing={1.5} mt={3} justifyContent="flex-end">
    <Button
      variant="text"
      onClick={() => setAnchorEl(null)}
      sx={{ textTransform: "none", color: "text.secondary" }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={applyFilters}
      sx={{
        textTransform: "none",
        background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",

        px: 3,
      }}
    >
      Apply
    </Button>
  </Stack>
</Box>

      </Popover>

      {/* Map Container */}
      <Box sx={{ flex: 1, p: 2, minHeight: 0 }}>
        <Paper
          elevation={2}
          sx={{
            height: "100%",
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <LeafletMap userId={appliedUserId} from={appliedFrom} to={appliedTo} />
        </Paper>
      </Box>
    </Box>
  );
};

export default TrackingBrowser;