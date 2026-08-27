interface RoundCountProps {
  classToggle: boolean;
  number: number;
}

const RoundCount = ({ classToggle, number }: RoundCountProps) => {
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[10px] font-medium transition-colors ${
        classToggle
          ? "bg-accent-foreground/10 text-accent-foreground"
          : "bg-surface text-text-secondary"
      }`}
    >
      {number}
    </span>
  );
};

export default RoundCount;
