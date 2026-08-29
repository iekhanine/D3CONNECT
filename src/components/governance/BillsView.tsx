import { Vote } from "lucide-react";
import { percent, polity } from "../../config/polity";
import PageTitle from "./PageTitle";
import type { GovernanceViewProps as Props } from "./types";

export default function BillsView({ bills, onToggleBillSupport }: Props) {
  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="STEP 3 · DECISIONS & VOTING" title="See what is ready for community support" text={`When a solution is ready, it becomes a community decision people can support. At ${percent(polity.supportThreshold)} support, it takes effect. If support later falls below ${percent(polity.removalThreshold)}, it stops being active.`}/>
      <div className="threshold-explainer panel"><div><span>0%</span><strong>No longer active</strong><small>If support for an active decision falls below {percent(polity.removalThreshold)}, it stops being active.</small></div><div className="threshold-gap"><span>{percent(polity.removalThreshold)}</span><strong>Stays as-is</strong><small>Between the two levels, the current status does not change.</small></div><div><span>{percent(polity.supportThreshold)}</span><strong>Takes effect</strong><small>At or above this level, a community decision becomes active.</small></div></div>
      <div className="bill-list">
        {bills.map((bill)=><article className="bill-card panel" key={bill.id}><div className="bill-card-head"><div><span className={`state-badge state-${bill.state.toLowerCase().replaceAll(" ", "-")}`}>{bill.state}</span><span className="bill-kind">{bill.kind}</span><h3>{bill.title}</h3><p>{bill.summary}</p></div><div className="support-big"><strong>{bill.support_percent.toFixed(1)}%</strong><small>{bill.support_count.toLocaleString()} people supporting</small></div></div><div className="support-meter"><div className="meter-track"><span className="meter-fill" style={{width:`${Math.min(100,bill.support_percent)}%`}}/><i className="threshold-marker removal" style={{left:`${polity.removalThreshold*100}%`}}/><i className="threshold-marker activation" style={{left:`${polity.supportThreshold*100}%`}}/></div><div className="meter-labels"><span>0%</span><span>{percent(polity.removalThreshold)}</span><span>{percent(polity.supportThreshold)}</span><span>100%</span></div></div><div className="bill-actions"><span>{bill.current_user_supports ? "You currently support this decision." : "You have not supported this decision."}</span>{bill.current_user_supports?<button className="secondary-button" onClick={()=>onToggleBillSupport(bill.id,false)}>Stop Supporting</button>:<button className="primary-button" onClick={()=>onToggleBillSupport(bill.id,true)}><Vote size={15}/> Support This</button>}</div></article>)}
      </div>
    </div>
  );
}
