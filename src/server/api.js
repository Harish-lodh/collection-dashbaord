// src/apiClient/collections.js
import apiClient from "./apiClient";

export const fetchCollections = async ({
  period,
  startDate,
  endDate,
  dealers = [],
  districts = [],
  agents = [],
  partners = [],
}) => {
  const params = new URLSearchParams();

  params.append("period", period || "all");

  let partnerParam = "all";
  if (partners.length > 0) {
    partnerParam = partners.map((p) => p.toLowerCase()).join(",");
  }
  params.append("partner", partnerParam);

  if (startDate && endDate) {
    params.append("startDate", startDate);
    params.append("endDate", endDate);
  }

  if (dealers.length > 0) {
    params.append("dealers", dealers.join(","));
  }
  if (districts.length > 0) {
    params.append("districts", districts.join(","));
  }
  if (agents.length > 0) {
    params.append("agents", agents.join(","));
  }

  const url = `/web/superAdmin/collections?${params.toString()}`;
  const res = await apiClient.get(url);
  return res.data;
};
