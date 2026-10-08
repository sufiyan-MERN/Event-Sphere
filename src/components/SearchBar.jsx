import Icon from './Icon.jsx';

export default function SearchBar({ value, onChange, placeholder = 'Search…', label = 'Search', onSubmit }) {
  return <form className="catalog-search" role="search" onSubmit={(event) => { event.preventDefault(); onSubmit?.(value); }}><Icon name="search" size={19} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} />{value && <button className="icon-button" type="button" onClick={() => onChange('')} aria-label="Clear search"><Icon name="close" size={16} /></button>}</form>;
}
