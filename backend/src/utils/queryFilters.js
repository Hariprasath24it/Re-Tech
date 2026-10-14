const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseEnumFilter = (value, allowedValues, label) => {
  if (!value) return { values: [], error: null };
  if (typeof value !== 'string') {
    return { values: [], error: `Invalid ${label}.` };
  }

  const values = [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  const invalidValue = values.find((item) => !allowedValues.includes(item));
  if (invalidValue) {
    return { values: [], error: `Invalid ${label}: ${invalidValue}.` };
  }

  return { values, error: null };
};

const parsePagination = (query) => {
  const pageValue = query.page === undefined ? '1' : query.page;
  const limitValue = query.limit === undefined ? '20' : query.limit;
  if (typeof pageValue !== 'string' || typeof limitValue !== 'string') {
    return { page: 1, limit: 20, skip: 0, error: 'page and limit must be positive integers.' };
  }

  const page = Number(pageValue);
  const limit = Number(limitValue);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1) {
    return { page: 1, limit: 20, skip: 0, error: 'page and limit must be positive integers.' };
  }
  if (limit > 100) {
    return { page, limit: 100, skip: 0, error: 'limit cannot exceed 100.' };
  }

  return { page, limit, skip: (page - 1) * limit, error: null };
};

const parseDateRange = (query) => {
  const parseBoundary = (value, isEnd) => {
    if (value === undefined) return { date: null, error: null };
    if (typeof value !== 'string' || !value.trim()) {
      return { date: null, error: 'fromDate and toDate must be valid dates.' };
    }

    const input = value.trim();
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input);
    const normalized = dateOnly && isEnd ? `${input}T23:59:59.999Z` : dateOnly ? `${input}T00:00:00.000Z` : input;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return { date: null, error: 'fromDate and toDate must be valid dates.' };
    if (dateOnly && date.toISOString().slice(0, 10) !== input) {
      return { date: null, error: 'fromDate and toDate must be valid calendar dates.' };
    }
    return { date, error: null };
  };

  const from = parseBoundary(query.fromDate, false);
  const to = parseBoundary(query.toDate, true);
  if (from.error || to.error) return { range: null, error: from.error || to.error };
  if (from.date && to.date && from.date > to.date) {
    return { range: null, error: 'fromDate cannot be later than toDate.' };
  }

  return { range: { from: from.date, to: to.date }, error: null };
};

const dateRangeCondition = (field, range) => {
  if (!range?.from && !range?.to) return null;
  const bounds = {};
  if (range.from) bounds.$gte = range.from;
  if (range.to) bounds.$lte = range.to;
  return { [field]: bounds };
};

const parseSort = (value, allowedFields, defaultValue) => {
  if (value === undefined) return { value: defaultValue, error: null };
  if (typeof value !== 'string' || !allowedFields.includes(value.replace(/^-/, ''))) {
    return { value: defaultValue, error: `sort must be one of: ${allowedFields.join(', ')}.` };
  }
  return { value, error: null };
};

const paginationMetadata = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = {
  escapeRegex,
  parseEnumFilter,
  parsePagination,
  parseDateRange,
  dateRangeCondition,
  parseSort,
  paginationMetadata,
};