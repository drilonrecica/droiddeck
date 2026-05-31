export type LineProps = {
  children: string;
  fg?: string;
  bg?: string;
};

export function Line({ children, fg = "#D1D5DB", bg }: LineProps) {
  return <text content={children} fg={fg} bg={bg} width="100%" height={1} truncate />;
}
