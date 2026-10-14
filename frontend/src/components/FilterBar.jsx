import React from 'react';
import { Search } from 'lucide-react';

const inputClass = 'px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200';

const FilterBar = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  sort,
  sortOptions = [],
  onSortChange,
  onClear,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {onSearchChange && (
      <div className="relative min-w-56 flex-1 sm:flex-none">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className={`${inputClass} w-full pl-9 sm:w-64`}
        />
      </div>
    )}
    {filters.map((filter) => (
      <select
        key={filter.name}
        aria-label={filter.label}
        value={filter.value}
        onChange={(event) => filter.onChange(event.target.value)}
        className={inputClass}
      >
        {filter.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    ))}
    {onFromDateChange && (
      <input
        type="date"
        aria-label="From date"
        value={fromDate}
        onChange={(event) => onFromDateChange(event.target.value)}
        className={inputClass}
      />
    )}
    {onToDateChange && (
      <input
        type="date"
        aria-label="To date"
        value={toDate}
        onChange={(event) => onToDateChange(event.target.value)}
        className={inputClass}
      />
    )}
    {onSortChange && (
      <select
        aria-label="Sort order"
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
        className={inputClass}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    )}
    <button
      type="button"
      onClick={onClear}
      className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl bg-white hover:bg-slate-50"
    >
      Clear Filters
    </button>
  </div>
);

export default FilterBar;