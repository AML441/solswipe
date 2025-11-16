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
    <div className="w-full max-w-3xl">
      {label && <p className="text-2xl text-white font-bold">{label}</p>}

      {/* Select Box */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-white border border-gray-300 rounded-lg p-2 flex justify-between items-center cursor-pointer"
      >
        <span className="text-gray-700">
          {selected.length > 0 ? selected.join(", ") : "Select options"}
        </span>
        <span className="text-gray-500">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-2 border border-gray-300 bg-white rounded-lg shadow-md p-2 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="h-4 w-4"
              />
              <span className="text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
