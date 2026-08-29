import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  text: string;
  action?: ReactNode;
}

export default function PageTitle({ eyebrow, title, text, action }: Props) {
  return (
    <div className="governance-page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
