import React from 'react';
import { 
  Radio, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Copy, 
  Check, 
  Server, 
  ExternalLink 
} from 'lucide-react';
import { MethodBadge, StatusBadge, Badge } from '../common/Badge';
import EmptyState from '../common/EmptyState';

export const TrafficTable = ({
  logs = [],
  total = 0,
  page = 1,
  pageSize = 10,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  onSelectLog,
}) => {
  const [copiedId, setCopiedId] = React.useState(null);

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLatencyColor = (ms) => {
    if (ms < 150) return 'text-emerald-600 dark:text-emerald-400';
    if (ms < 400) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const startRecord = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
            Recorded Traffic Log Stream
          </h3>
          <span className="text-xs font-mono text-slate-400">
            ({total} total records)
          </span>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table or Empty State */}
      {logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 px-4 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Method</th>
                <th className="p-3 font-semibold">Endpoint / Path</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Latency</th>
                <th className="p-3 font-semibold">Size</th>
                <th className="p-3 font-semibold">Env</th>
                <th className="p-3 font-semibold">Source</th>
                <th className="p-3 font-semibold">Request ID</th>
                <th className="p-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {logs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const timeString = isNaN(dateObj.getTime())
                  ? log.timestamp
                  : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <tr
                    key={log.id}
                    onClick={() => onSelectLog(log)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="p-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {timeString}
                    </td>

                    {/* Method */}
                    <td className="p-3">
                      <MethodBadge method={log.method} size="xs" />
                    </td>

                    {/* Path / URL */}
                    <td className="p-3 max-w-xs sm:max-w-md truncate font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors">
                      <span title={log.path || log.url}>{log.path || log.url}</span>
                    </td>

                    {/* Status Code */}
                    <td className="p-3">
                      <StatusBadge status={log.status} />
                    </td>

                    {/* Latency */}
                    <td className={`p-3 font-semibold ${getLatencyColor(log.responseTimeMs)}`}>
                      {log.responseTimeMs} ms
                    </td>

                    {/* Transferred Size */}
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {log.sizeBytes > 0 ? `${(log.sizeBytes / 1024).toFixed(1)} KB` : '0 B'}
                    </td>

                    {/* Environment */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.environment || 'Dev'}
                      </span>
                    </td>

                    {/* Data Source Badge */}
                    <td className="p-3">
                      <Badge
                        variant={log.source === 'real' ? 'primary' : 'neutral'}
                        size="sm"
                        className="text-[10px]"
                      >
                        {log.source === 'real' ? 'Real' : 'Demo'}
                      </Badge>
                    </td>

                    {/* Request ID */}
                    <td className="p-3 text-slate-400 max-w-[120px]">
                      <div className="flex items-center space-x-1">
                        <span className="truncate" title={log.requestId}>
                          {log.requestId}
                        </span>
                        <button
                          onClick={(e) => handleCopyId(e, log.requestId)}
                          className="text-slate-400 hover:text-slate-200 p-0.5"
                          title="Copy Request ID"
                        >
                          {copiedId === log.requestId ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLog(log);
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center space-x-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12">
          <EmptyState
            icon={Radio}
            title="No Matching Traffic Logs"
            description="No request logs matched the active query, environment, method, or time window filters. Adjust your filters or send requests in the Request Builder."
          />
        </div>
      )}

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="p-4 px-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-700 dark:text-slate-200">{startRecord}</strong> to{' '}
            <strong className="text-slate-700 dark:text-slate-200">{endRecord}</strong> of{' '}
            <strong className="text-slate-700 dark:text-slate-200">{total}</strong> logs
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficTable;
