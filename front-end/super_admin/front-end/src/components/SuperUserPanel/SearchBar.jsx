import SearchSuggest from '../SearchSuggest/SearchSuggest';

/**
 * Search box for the selected table. The dropdown suggests each record's name,
 * or its ID when the table has no name column (bookings, payments, …).
 */
export default function SearchBar({ schema, records, value, onChange }) {
  const items = records.map((r, i) => {
    const pk = r[schema.pkField] ?? r[schema.columns[0]];
    const name = schema.columns.includes('name') ? r.name : null;
    return {
      key: `${pk}-${i}`,
      label: name || pk,
      sub: name ? pk : '',
      tag: name ? 'Name' : (schema.pkField || schema.columns[0]).replace(/_/g, ' '),
      fields: [name || pk],
    };
  });

  return (
    <SearchSuggest
      className="c2b-search"
      value={value}
      onChange={onChange}
      items={items}
      placeholder={`Search ${schema?.label?.toLowerCase() ?? ''}…`}
    />
  );
}
