interface InputBoxProps {
  id: string;
  type: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}

const InputBox = ({
  id,
  type,
  required,
  value,
  onChange,
  placeholder,
  disabled,
}: InputBoxProps) => {
  return (
    <input
      id={id}
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-border-subtle bg-surface/30 text-text-primary placeholder:text-text-muted/40 focus:border-border-focus focus:bg-secondary focus:ring-border-focus/10 w-full rounded-xl border px-4 py-3.5 transition-all duration-200 focus:ring-4 focus:outline-none"
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default InputBox;
