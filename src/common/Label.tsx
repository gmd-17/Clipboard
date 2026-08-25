interface LabelProps {
  htmlFor: string;
  text: string;
}

const Label = ({ htmlFor, text }: LabelProps) => {
  return (
    <>
      <label
        htmlFor={htmlFor}
        className="text-text-muted text-xs font-semibold tracking-wider uppercase"
      >
        {text}
      </label>
    </>
  );
};

export default Label;
