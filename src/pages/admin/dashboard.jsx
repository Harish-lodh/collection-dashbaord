// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import "chart.js/auto";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Autocomplete,
  TextField,
  Stack,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Badge,
} from "@mui/material";

import Loader from "../../components/Loader";
import FilterListIcon from "@mui/icons-material/FilterList";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import GroupsIcon from "@mui/icons-material/Groups";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";


import { fetchCollections } from "../../server/api";

// ------------------------------
// Helpers
// ------------------------------
const fmtINRShort = (n) => {
  if (!n) return "₹0";
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

const numberStr = (n) => (n ?? 0).toLocaleString("en-IN");

const toISODate = (d) => (d ? d.toISOString().slice(0, 10) : null);

// ------------------------------
// Stat Card Component
// ------------------------------
const StatCard = ({ title, value, change, icon: Icon, bgColor, iconColor }) => (
  <Card
    elevation={2}
    sx={{
      height: "100%",
      transition: "0.3s",
      "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
    }}
  >
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>

          {typeof change === "number" && (
            <Stack direction="row" spacing={0.5} alignItems="center" mt={1}>
              {change >= 0 ? (
                <TrendingUpIcon sx={{ color: "success.main" }} fontSize="small" />
              ) : (
                <TrendingDownIcon sx={{ color: "error.main" }} fontSize="small" />
              )}
              <Typography
                variant="body2"
                color={change >= 0 ? "success.main" : "error.main"}
              >
                {Math.abs(change)}%
              </Typography>
            </Stack>
          )}
        </Box>

        <Box
          sx={{
            backgroundColor: bgColor,
            p: 1.5,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: 32, color: iconColor }} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function Dashboard() {
  // Final applied filters (these trigger API)
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [selectedDealers, setSelectedDealers] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);


  // Final applied date range (these trigger API)
  const [startDate, setStartDate] = useState(null); // string: "YYYY-MM-DD" or null
  const [endDate, setEndDate] = useState(null); // string

  // Draft filters (used only inside modal, do NOT trigger API)
  const [draftPartners, setDraftPartners] = useState([]);
  const [draftDealers, setDraftDealers] = useState([]);
  const [draftDistricts, setDraftDistricts] = useState([]);
  const [draftAgents, setDraftAgents] = useState([]);
  const [draftDateRange, setDraftDateRange] = useState([null, null]); // [Date | null, Date | null]

  // Filter Modal visibility
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Data & API state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rawData, setRawData] = useState(null);

  const [allHierarchy, setAllHierarchy] = useState(null);
  const [totalCollections, setTotalCollections] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);

  const [trend, setTrend] = useState({ labels: [], data: [] });
  const [modes, setModes] = useState({ labels: [], data: [] });
  const [agentsChart, setAgentsChart] = useState({ labels: [], data: [] });

  // ------------------------------
  // Fetch options (hierarchy) once
  // ------------------------------
  useEffect(() => {
    (async () => {
      try {
        const full = await fetchCollections({ period: "all" });
        setAllHierarchy(full?.hierarchy || []);
      } catch (e) {
        console.error("Failed to load hierarchy", e);
      }
    })();
  }, []);

  // ------------------------------
  // Build dropdown options
  // ------------------------------
  const { dealerOptions, districtOptions, agentOptions } = useMemo(() => {
    if (!allHierarchy) {
      return { dealerOptions: [], districtOptions: [], agentOptions: [] };
    }

    const dealers = new Set();
    const districts = new Set();
    const agentSet = new Set();

    allHierarchy.forEach((d) => {
      dealers.add(d.dealer);
      d.districts?.forEach((dist) => {
        districts.add(dist.district);
        dist.collectionAgents?.forEach((a) => agentSet.add(a.collectedBy));
      });
    });

    return {
      dealerOptions: Array.from(dealers).sort(),
      districtOptions: Array.from(districts).sort(),
      agentOptions: Array.from(agentSet).sort(),
    };
  }, [allHierarchy]);


  const dealerDistrictTable = useMemo(() => {
    if (!rawData?.hierarchy) return [];

    return rawData.hierarchy.map((dealerObj) => {
      const dealer = dealerObj.dealer;

      const districts = dealerObj.districts.map((dist) => ({
        district: dist.district,
        amount: dist.totalCollection,
      }));

      return {
        dealer,
        districts,
        rowSpan: districts.length, // needed for table merging
      };
    });
  }, [rawData]);


  // ------------------------------
  // Fetch Dashboard Data
  // Triggers ONLY when applied filters / applied date range change
  // ------------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const payload = {
          dealers: selectedDealers,
          districts: selectedDistricts,
          agents: selectedAgents,
          partners: selectedPartners,
        };

        if (startDate && endDate) {
          payload.startDate = startDate;
          payload.endDate = endDate;
        } else {
          // if no date range, you can send period: "all" or leave date out
          payload.period = "all";
        }

        const data = await fetchCollections(payload);

        setRawData(data || {});
        setTotalCollections(data?.grandTotalCollection ?? 0);
        setActiveLoans(data?.activeLoans ?? 0);
        setActiveAgents(data?.activeAgents ?? 0);

        setTrend(data?.charts?.trend || { labels: [], data: [] });
        setModes(data?.charts?.paymentModes || { labels: [], data: [] });
        setAgentsChart(data?.charts?.agentPerformance || { labels: [], data: [] });
      } catch (e) {
        console.error(e);
        setErr("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedDealers, selectedDistricts, selectedAgents, selectedPartners, startDate, endDate]);

  // ------------------------------
  // Filter Modal open
  // Load current applied filters into drafts
  // ------------------------------
  const openFilterDialog = () => {
    setDraftPartners(selectedPartners);
    setDraftDealers(selectedDealers);
    setDraftDistricts(selectedDistricts);
    setDraftAgents(selectedAgents);

    // convert current start/end string to Date for picker
    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;
    setDraftDateRange([s, e]);

    setFilterDialogOpen(true);
  };

  // ------------------------------
  // Apply Filters (commit drafts → applied filters)
  // Triggers API via useEffect
  // ------------------------------
  const applyFilters = () => {
    setSelectedPartners(draftPartners);
    setSelectedDealers(draftDealers);
    setSelectedDistricts(draftDistricts);
    setSelectedAgents(draftAgents);

    const [s, e] = draftDateRange || [];
    setStartDate(s ? toISODate(s) : null);
    setEndDate(e ? toISODate(e) : null);

    setFilterDialogOpen(false);
  };

  const totalFilterCount =
    selectedPartners.length +
    selectedDealers.length +
    selectedDistricts.length +
    selectedAgents.length +
    (startDate && endDate ? 1 : 0);

  const chartOptions = { responsive: true, maintainAspectRatio: false };

  const lineData = {
    labels: trend.labels,
    datasets: [
      {
        label: "Collections",
        data: trend.data,
        borderColor: "#1976d2",
        backgroundColor: "rgba(25, 118, 210, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const pieData = {
    labels: modes.labels,
    datasets: [
      {
        data: modes.data,
        backgroundColor: [
          "#1976d2",
          "#2e7d32",
          "#ed6c02",
          "#d32f2f",
          "#9c27b0",
          "#0288d1",
        ],
      },
    ],
  };

  const barData = {
    labels: agentsChart.labels,
    datasets: [
      {
        label: "Collections",
        data: agentsChart.data,
        backgroundColor: "#1976d2",
      },
    ],
  };

  return (
    <Box sx={{ p: 3, minHeight: "100vh" }}>
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Dashboard
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {/* Filter Button */}
          <Button
            variant="contained"
            onClick={openFilterDialog}
            sx={{
              backgroundColor: "#1e40af", // tailwind blue-800
              "&:hover": {
                backgroundColor: "#1e3a8a", // tailwind blue-900 (hover)
              },
            }}
          >
            <IconButton
              onClick={openFilterDialog}
              sx={{
                backgroundColor: "#1e40af", // same tailwind blue-800
                color: "white",
                "&:hover": {
                  backgroundColor: "#1e3a8a", // blue-900
                },
              }}
            >
              <FilterListIcon />
            </IconButton>
            Filter
          </Button>

          {/* Badge + Icon Button */}
          <Badge
            badgeContent={totalFilterCount}
            color="primary"
            overlap="circular"
          >

          </Badge>
        </Stack>
      </Stack>

      {/* LOADING */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={10}>
          <Loader />
        </Box>
      )}

      {/* ERROR */}
      {!loading && err && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {err}
        </Alert>
      )}

      {/* CONTENT */}
      {!loading && !err && (
        <>
          {/* STATS */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Collections (All Partners)"
                value={fmtINRShort(totalCollections)}
                icon={CurrencyRupeeIcon}
                bgColor="#e3f2fd"
                iconColor="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Loans"
                value={numberStr(activeLoans)}
                icon={CreditCardIcon}
                bgColor="#e8f5e9"
                iconColor="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Repossessions"
                value={numberStr(0)}
                icon={WarningAmberIcon}
                bgColor="#fff3e0"
                iconColor="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Agents"
                value={numberStr(activeAgents)}
                icon={GroupsIcon}
                bgColor="#f3e5f5"
                iconColor="#9c27b0"
              />
            </Grid>
          </Grid>

          {/* CHARTS */}
          <Grid container spacing={3} mb={3} justifyContent="center"
            alignItems="center">
            <Grid item xs={12} md={8}>
              <Card elevation={2} sx={{ height: 420 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Collection Trend
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <Line data={lineData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: 420 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Payment Modes
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <Doughnut data={pieData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card elevation={2} sx={{ height: 420 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Agent Performance
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <Bar data={barData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* FILTER MODAL */}
          <Dialog
            open={filterDialogOpen}
            onClose={() => setFilterDialogOpen(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Filters</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>


                {/* PARTNERS */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Partners
                  </Typography>
                  <Autocomplete
                    multiple
                    disablePortal
                    options={["Malhotra", "Embifi"]}
                    value={draftPartners}
                    onChange={(e, v) => setDraftPartners(v)}
                    renderInput={(p) => (
                      <TextField {...p} label="Partners" placeholder="Select partners" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          size="small"
                          color="info"
                        />
                      ))
                    }
                  />
                </Box>

                {/* DEALERS */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Dealers
                  </Typography>
                  <Autocomplete
                    multiple
                    disablePortal
                    options={dealerOptions}
                    value={draftDealers}
                    onChange={(e, v) => setDraftDealers(v)}
                    renderInput={(p) => (
                      <TextField {...p} label="Dealers" placeholder="Select dealers" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          size="small"
                          color="primary"
                        />
                      ))
                    }
                  />
                </Box>

                {/* DISTRICTS */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Districts
                  </Typography>
                  <Autocomplete
                    multiple
                    disablePortal
                    options={districtOptions}
                    value={draftDistricts}
                    onChange={(e, v) => setDraftDistricts(v)}
                    renderInput={(p) => (
                      <TextField {...p} label="Districts" placeholder="Select districts" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          size="small"
                          color="secondary"
                        />
                      ))
                    }
                  />
                </Box>

                {/* AGENTS */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Agents
                  </Typography>
                  <Autocomplete
                    multiple
                    disablePortal
                    options={agentOptions}
                    value={draftAgents}
                    onChange={(e, v) => setDraftAgents(v)}
                    renderInput={(p) => (
                      <TextField {...p} label="Agents" placeholder="Select agents" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          size="small"
                          color="success"
                        />
                      ))
                    }
                  />
                </Box>
                {/* DATE RANGE PICKER */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Date Range
                  </Typography>

                  {/* CLICK FIELD TO SHOW CALENDAR */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Select Date Range"
                    placeholder="Choose date range"
                    value={
                      draftDateRange[0] && draftDateRange[1]
                        ? `${toISODate(draftDateRange[0])} → ${toISODate(draftDateRange[1])}`
                        : ""
                    }
                    onClick={() => setShowCalendar(true)}
                    sx={{
                      cursor: "pointer",
                      "& .MuiInputBase-input": { cursor: "pointer" },
                      mb: 1,
                    }}
                  />

                  {/* SHOW CALENDAR ONLY WHEN CLICKED */}
                  {showCalendar && (
                    <Box
                      sx={{
                        p: 2,
                        mt: 1,
                        borderRadius: 2,
                        boxShadow: 3,
                        bgcolor: "white",
                        animation: "fadeIn 0.2s ease-out",
                        "@keyframes fadeIn": {
                          from: { opacity: 0, transform: "translateY(-5px)" },
                          to: { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      {/* calender */}
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Stack direction="row" spacing={3} justifyContent="center" sx={{ p: 2 }}>

                          {/* START DATE */}
                          <Box textAlign="center">
                            <Typography fontWeight={600} mb={1}>
                              Start Date
                            </Typography>
                            <DateCalendar
                              value={draftDateRange[0]}
                              onChange={(newValue) =>
                                setDraftDateRange([newValue, draftDateRange[1]])
                              }
                              sx={{
                                // marginLeft:"20px",
                                transform: "scale(0.8)",

                                width: "260px",
                                "& .MuiPickersDay-root": {
                                  fontSize: "0.75rem",
                                  width: "28px",
                                  height: "28px",
                                },
                                "& .MuiDayCalendar-weekDayLabel": {
                                  fontSize: "0.7rem",
                                },
                                "& .MuiPickersCalendarHeader-label": {
                                  fontSize: "0.85rem",
                                },
                              }}
                            />
                          </Box>

                          {/* END DATE */}
                          <Box textAlign="center">
                            <Typography fontWeight={600} mb={1}>
                              End Date
                            </Typography>
                            <DateCalendar
                              minDate={draftDateRange[0]}
                              value={draftDateRange[1]}
                              onChange={(newValue) => {
                                setDraftDateRange([draftDateRange[0], newValue]);
                                setShowCalendar(false);
                              }}
                              sx={{
                                transform: "scale(0.8)",
                                // transformOrigin: "top left",
                                width: "260px",
                                "& .MuiPickersDay-root": {
                                  fontSize: "0.75rem",
                                  width: "28px",
                                  height: "28px",
                                },
                                "& .MuiDayCalendar-weekDayLabel": {
                                  fontSize: "0.7rem",
                                },
                                "& .MuiPickersCalendarHeader-label": {
                                  fontSize: "0.85rem",
                                },
                              }}
                            />
                          </Box>

                        </Stack>
                      </LocalizationProvider>


                      <Button
                        onClick={() => setShowCalendar(false)}
                        fullWidth
                      >
                        Close Calendar
                      </Button>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Leave empty for all time.
                  </Typography>
                </Box>

              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setDraftPartners([]);
                  setDraftDealers([]);
                  setDraftDistricts([]);
                  setDraftAgents([]);
                  setDraftDateRange([null, null]);
                }}
                color="inherit"
              >
                Clear All
              </Button>
              <Button onClick={applyFilters} variant="contained">
                Apply
              </Button>
            </DialogActions>
          </Dialog>
          <Grid item xs={12} mt={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Dealer-wise District Collection Summary
                </Typography>

                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f3f4f6" }}>
                        <th style={{ padding: 8, border: "1px solid #ddd" }}>Dealer</th>
                        <th style={{ padding: 8, border: "1px solid #ddd" }}>District</th>
                        <th style={{ padding: 8, border: "1px solid #ddd" }}>Total Collection</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dealerDistrictTable.map((d, i) => (
                        <React.Fragment key={i}>
                          {d.districts.map((dist, idx) => (
                            <tr key={idx}>
                              {/* Dealer should appear only on FIRST district row */}
                              {idx === 0 && (
                                <td
                                  rowSpan={d.rowSpan}
                                  style={{
                                    padding: 8,
                                    border: "1px solid #ddd",
                                    fontWeight: 700,
                                    background: "#eef2ff",
                                  }}
                                >
                                  {d.dealer}
                                </td>
                              )}

                              <td style={{ padding: 8, border: "1px solid #ddd" }}>
                                {dist.district}
                              </td>

                              <td
                                style={{
                                  padding: 8,
                                  border: "1px solid #ddd",
                                  fontWeight: 600,
                                }}
                              >
                                ₹{dist.amount.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          </Grid>

        </>
      )}
    </Box>
  );
}
