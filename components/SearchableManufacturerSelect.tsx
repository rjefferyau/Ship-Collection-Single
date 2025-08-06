import React, { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Manufacturer {
  _id: string;
  name: string;
  description?: string;
  website?: string;
  country?: string;
}

interface SearchableManufacturerSelectProps {
  manufacturers: Manufacturer[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  placeholder?: string;
  className?: string;
}

const SearchableManufacturerSelect: React.FC<SearchableManufacturerSelectProps> = ({
  manufacturers,
  value,
  onChange,
  loading = false,
  disabled = false,
  required = false,
  error = false,
  placeholder = "Select a manufacturer",
  className = ""
}) => {
  const [query, setQuery] = useState('');

  const filteredManufacturers = query === ''
    ? manufacturers
    : manufacturers.filter((manufacturer) =>
        manufacturer.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.toLowerCase().replace(/\s+/g, ''))
      );

  const selectedManufacturer = manufacturers.find(manufacturer => manufacturer.name === value);
  const displayValue = selectedManufacturer ? selectedManufacturer.name : '';

  const baseClassName = `relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm ${
    error ? 'border-red-300 bg-red-50' : 'border-gray-300'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className={className}>
      <Combobox 
        value={value} 
        onChange={onChange}
        disabled={disabled || loading}
      >
        <div className="relative">
          <div className={`${baseClassName} border`}>
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 bg-transparent"
              displayValue={() => displayValue}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              required={required}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              {loading ? (
                <FontAwesomeIcon 
                  icon={faSpinner} 
                  className="h-4 w-4 text-gray-400 animate-spin" 
                  aria-hidden="true" 
                />
              ) : (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              )}
            </Combobox.Button>
          </div>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {/* Clear selection option */}
              <Combobox.Option
                key="clear"
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-teal-600 text-white' : 'text-gray-900'
                  }`
                }
                value=""
              >
                {({ selected, active }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                      <em className="text-gray-500">Clear selection</em>
                    </span>
                    {selected ? (
                      <span
                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? 'text-white' : 'text-teal-600'
                        }`}
                      >
                        <FontAwesomeIcon icon={faCheck} className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Combobox.Option>
              
              {filteredManufacturers.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No manufacturers found matching "{query}".
                </div>
              ) : (
                filteredManufacturers.map((manufacturer) => (
                  <Combobox.Option
                    key={manufacturer._id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-teal-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={manufacturer.name}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {manufacturer.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-teal-600'
                            }`}
                          >
                            <FontAwesomeIcon icon={faCheck} className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};

export default SearchableManufacturerSelect;