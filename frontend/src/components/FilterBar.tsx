interface SelectOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  regions?: string[];
  region?: string;
  onRegionChange?: (value: string) => void;
  statusOptions?: SelectOption[];
  status?: string;
  onStatusChange?: (value: string) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function FilterBar({
  regions,
  region,
  onRegionChange,
  statusOptions,
  status,
  onStatusChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      {onSearchChange && (
        <input
          type="search"
          className="filter-input"
          placeholder={searchPlaceholder}
          value={search ?? ''}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      )}
      {regions && onRegionChange && (
        <select className="filter-select" value={region} onChange={(event) => onRegionChange(event.target.value)}>
          <option value="">All regions</option>
          {regions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      )}
      {statusOptions && onStatusChange && (
        <select className="filter-select" value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
