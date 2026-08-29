import { X } from "lucide-react";
import { type HTMLInputTypeAttribute, type ReactNode } from "react";

interface InputBoxProps {
  id: string;
  type: HTMLInputTypeAttribute;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  icon?: ReactNode;
  py?: string;
}

const InputBox = ({
  id,
  type,
  required,
  value,
  onChange,
  placeholder,
  disabled,
  icon,
  py,
}: InputBoxProps) => {
  return (
    <div className="relative flex w-full items-center">
      {icon && (
        <div className="text-text-muted/40 pointer-events-none absolute left-4">
          {icon}
        </div>
      )}
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`border-border-subtle bg-surface text-text-primary placeholder:text-text-muted focus:bg-secondary focus:border-border-focus focus:ring-border-focus/10 w-full rounded-xl border pr-8 transition-all duration-200 focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          icon ? "pl-11" : "px-4"
        } ${py ? py : "py-3.5"}`}
      />

      {/* Custom Clear Button */}
      {type === "search" && value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-text-muted/60 hover:text-text-primary focus-visible:ring-border-focus absolute right-3 rounded-full p-1 transition-colors outline-none focus-visible:ring-2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default InputBox;
