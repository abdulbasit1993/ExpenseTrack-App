const formatDisplayDate = (value: Date) =>
  value.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export { formatDisplayDate };
