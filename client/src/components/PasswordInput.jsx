import { useState } from 'react';

export default function PasswordInput({
  id,
  label,
  labelClassName = 'block font-bold uppercase text-gray-500 mb-1',
  value,
  onChange,
  required = false,
  minLength,
  placeholder,
  inputClassName = 'w-full border border-gray-200 rounded p-2 pr-12 outline-none focus:ring-2 focus:ring-blue-500'
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-2.5 text-[10px] font-bold uppercase text-gray-400 hover:text-blue-600 transition tracking-wider focus:outline-none"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
