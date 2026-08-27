import type { ViewKey } from "../types";

interface Props {
  view: ViewKey;
}

export default function SectionViews({ view }: Props) {
  switch (view) {
    case "about":
      return <AboutView />;
    default:
      return null;
  }
}

function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="page-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function AboutView() {
  return (
    <div className="page-view">
      <PageTitle
        eyebrow="HOW IT WORKS"
        title="D3 Connect is built to make local participation easier"
        text="You can use D3 Connect without knowing government terminology. Start with what is happening, see possible solutions, support decisions, and choose how involved you want to be."
      />

      <div className="about-grid">
        <article className="data-card">
          <h3>1. Start with the problem</h3>
          <p>
            Anyone can raise something that needs attention. You do not need to know
            which City office handles it, and you do not need to arrive with a complete solution.
          </p>
        </article>

        <article className="data-card">
          <h3>2. Work toward a solution</h3>
          <p>
            Community members can suggest ways to fix or improve an issue. Those ideas
            can be reviewed and improved before they move forward for broader support.
          </p>
        </article>

        <article className="data-card">
          <h3>3. Choose how involved you want to be</h3>
          <p>
            You can keep your vote and participate directly, or give one person you trust
            your general proxy. The other person must accept it before your vote transfers,
            and either side can end the proxy relationship later.
          </p>
        </article>
      </div>
    </div>
  );
}
