import BillsView from "./governance/BillsView";
import DelegationView from "./governance/DelegationView";
import IssuesView from "./governance/IssuesView";
import ProposalsView from "./governance/ProposalsView";
import ProxyView from "./governance/ProxyView";
import type { GovernanceViewProps } from "./governance/types";

export default function GovernanceViews(props: GovernanceViewProps) {
  switch (props.view) {
    case "civic-issues":
      return <IssuesView {...props} />;
    case "proposals":
      return <ProposalsView {...props} />;
    case "bills":
      return <BillsView {...props} />;
    case "proxy":
      return <ProxyView {...props} />;
    case "delegation":
      return <DelegationView {...props} />;
    default:
      return null;
  }
}
