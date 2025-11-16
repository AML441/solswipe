import { useState } from "react";

interface MultiSelectProps<T extends string> {
  label?: string;
  options: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

export default function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="w-full max-w-3xl relative">
      {/* Label */}
      {label && <p className="text-xl text-gray-300 font-semibold mb-2">{label}</p>}

      {/* Select Box */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 flex justify-between items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-700 transition-all duration-200"
      >
        <span className="text-gray-200">
          {selected.length > 0 ? selected.join(", ") : "Select options"}
        </span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-10 bg-gray-800 border border-gray-600 rounded-lg mt-2 max-h-60 overflow-y-auto shadow-lg transition-all duration-200 ease-in-out">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="h-4 w-4 text-blue-500 bg-gray-800 border-gray-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-200">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}