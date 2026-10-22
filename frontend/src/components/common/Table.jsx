import React from 'react';

export const Table = ({
  children,
  className = '',
  wrapperClassName = '',
  striped = false,
  compact = false,
  ...props
}) => {
  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${wrapperClassName}`}
    >
      <table
        className={`w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className = '', ...props }) => (
  <thead
    className={`bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }) => (
  <tbody
    className={`divide-y divide-slate-200 dark:divide-slate-800/70 font-sans ${className}`}
    {...props}
  >
    {children}
  </tbody>
);

export const TableRow = ({
  children,
  className = '',
  hover = true,
  onClick,
  ...props
}) => (
  <tr
    onClick={onClick}
    className={`
      transition-colors duration-100
      ${hover ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '', ...props }) => (
  <th
    className={`p-3.5 text-xs font-semibold tracking-wider font-mono text-slate-600 dark:text-slate-400 ${className}`}
    {...props}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td className={`p-3.5 text-xs align-middle ${className}`} {...props}>
    {children}
  </td>
);

export const TableCaption = ({ children, className = '', ...props }) => (
  <caption className={`p-3 text-xs text-slate-500 font-mono caption-bottom ${className}`} {...props}>
    {children}
  </caption>
);

export default Table;
