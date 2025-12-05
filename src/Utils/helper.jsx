// utils->helper.jsx
import apiClient from "../server/apiClient";
import { toast } from "react-toastify";

export function bufferToBase64Image(bufferObj) {
  if (!bufferObj || !bufferObj.data) return null;
  const base64String = btoa(
    new Uint8Array(bufferObj.data).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
  return `data:image/jpeg;base64,${base64String}`;
}

export function getDealer(){
  return localStorage.getItem("dealer");
}


  /* ------------------ Generate Receipt (PDF download) ------------------ */
  export const handleGenerateReceipt = async (row) => {
    try {
      // only allow for approved payments
      // if (!row.approved) {
      //   toast.warn("Receipt can be generated only for approved payments.");
      //   return;
      // }

      const res = await apiClient.get(
        `/web/collection/${row.id}/receipt`,
        {
          params: { partner: row.partner },
          responseType: "blob", // important for file download
        }
      );
      console.log("pdf",res)
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // nice filename
      const fileName = `receipt_${row.loanId || row.id}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Receipt generation error:", err);
      toast.error("Failed to generate receipt");
    }
  };
