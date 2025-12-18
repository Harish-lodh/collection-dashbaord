import React from "react";

/**
 * Elegant shadcn-style reusable Table Component
 * Props:
 * - columns: [{ key: "id", label: "ID" }]
 * - data: array of objects
 * - onRowClick?: (row) => void
 */
const Table = ({ columns = [], data = [], onRowClick }) => {
    if (!data?.length) {
        return (
            <div className="flex justify-center items-center py-10 text-muted-foreground text-sm">
                No records found
            </div>
        );
    }

    return (
        <div className="bg-background overflow-hidden rounded-md border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-gray-800">
                {/* ---------- Header ---------- */}
                <thead>
                    <tr className="bg-muted/50 border-b border-gray-200">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="h-9 px-4 py-2 text-center text-[13px] font-medium text-gray-600 uppercase tracking-wide"
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>

                </thead>

                {/* ---------- Body ---------- */}
                <tbody>
                    {data.map((row, i) => (
                        <tr
                            key={i}
                            onClick={() => onRowClick && onRowClick(row)}
                            className="border-b border-gray-100 hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className="px-2 py-2 text-[12px] text-gray-700 font-bold
             whitespace-normal break-words max-w-2xs"
                                >

                                    {col.render
                                        ? col.render(row[col.key], row)
                                        : row[col.key] ?? "-"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
