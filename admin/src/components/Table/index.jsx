import { memo } from "react";
import TableHeader from "../../components/TableHeader";
import { serial_no_option } from "../../utils/data";
import { dateFormatter, formatCurrency, getNestedValue, rowCreatedAt } from "../../utils/helper";
import Loader from "../Loader";
import Pagination from "../Pagination";

function renderCellValue(col, row, index) {
  if (col.render) return col.render(row, index);
  if (col?.type === "date" || col?.type === "dateonly") {
    const raw =
      col.key === "createdAt" || col.key === "created_at"
        ? rowCreatedAt(row)
        : row[col.key];
    return dateFormatter(raw, { time: col?.type === "date" });
  }
  if (col?.type === "price") return formatCurrency(row[col.key]);
  return getNestedValue(row, col.key);
}

const isActionCol = (col) =>
  col.key === "actions" || /^actions?$/i.test(String(col.label || ""));

const isWideCardCol = (col) =>
  col.cardFullWidth ||
  /^(email|member account|user profile|subject|user name)$/i.test(
    String(col.label || "").trim()
  );

const Table = ({
  serial_no = false,
  columns = [],
  data = [],
  header = null,
  pagination = null,
  loading = false,
  onRowClick = null,
}) => {
  let headers = [];

  if (serial_no) {
    headers.push(serial_no_option);
  }

  headers.push(...columns);

  const serialOffset = pagination
    ? ((pagination?.page ?? 1) - 1) * (pagination?.per_page ?? 0)
    : 0;

  return (
    <>
      {header && (
        <TableHeader
          title={header?.title}
          onSearch={header?.onSearch}
          onCreate={header?.onCreate}
        />
      )}

      {/* Mobile card list */}
      <div className="md:hidden space-y-3 px-1 sm:px-2">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader type="cicular" center size={30} />
          </div>
        ) : data.length > 0 ? (
          data.map((row, index) => (
            <div
              key={row.id || row._id || index}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${
                onRowClick ? "cursor-pointer active:bg-gray-50" : ""
              }`}
            >
              {serial_no && (
                <p className="text-xs font-semibold text-gray-400 mb-2">
                  #{serialOffset + index + 1}
                </p>
              )}
              {(() => {
                const fields = columns
                  .map((col, ind) => ({
                    col,
                    ind,
                    val: renderCellValue(col, row, index),
                  }))
                  .filter(({ val }) => val != null && val !== "");

                const actionFields = fields.filter(({ col }) => isActionCol(col));
                const dataFields = fields.filter(({ col }) => !isActionCol(col));

                return (
                  <>
                    {dataFields.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                        {dataFields.map(({ col, ind, val }) => (
                          <div
                            key={ind}
                            className={isWideCardCol(col) ? "col-span-2" : "min-w-0"}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 leading-tight">
                              {col.label}
                            </p>
                            <div className="text-sm text-gray-900 break-words mt-0.5 font-medium">
                              {val}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {actionFields.length > 0 && (
                      <div
                        className={`flex flex-wrap justify-end gap-2 ${
                          dataFields.length > 0 ? "mt-3 pt-3 border-t border-gray-100" : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {actionFields.map(({ col, ind, val }) => (
                          <div key={ind}>{val}</div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-gray-500 text-sm border border-gray-200 rounded-xl">
            No data available
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block w-full overflow-x-auto px-2 sm:px-4 lg:px-8 custom-scrollbar">
        <table className="w-full min-w-[600px] border border-black border-collapse">
          <thead>
            <tr>
              {headers.map((item, index) => (
                <th
                  key={index}
                  className="px-3 py-4 text-sm text-left text-black font-bold uppercase border border-black whitespace-nowrap"
                >
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={row.id || row._id || index}
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                  className={`transition-all hover:bg-gray-100 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {serial_no && pagination ? (
                    <td className="px-4 py-5 text-sm text-left text-black border border-black align-middle font-medium">
                      {serialOffset + index + 1}
                    </td>
                  ) : serial_no ? (
                    <td className="px-4 py-5 text-sm text-left text-black border border-black align-middle font-medium">
                      {index + 1}
                    </td>
                  ) : null}
                  {columns.map((col, ind) => (
                    <td
                      key={ind}
                      className="px-4 py-5 text-sm text-left text-black border border-black align-middle font-medium"
                    >
                      {renderCellValue(col, row, index)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="p-6 text-center text-gray-500 text-sm border border-black"
                >
                  {loading ? (
                    <Loader type="cicular" center size={30} />
                  ) : (
                    "No data available"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && data.length > 0 && (
        <Pagination
          current_page={pagination?.page}
          per_page={pagination?.per_page}
          total={pagination?.total}
          onPageChange={pagination?.onPageChange}
        />
      )}
    </>
  );
};

export default memo(Table);
