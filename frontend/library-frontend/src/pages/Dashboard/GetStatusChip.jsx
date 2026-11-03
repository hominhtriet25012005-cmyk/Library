import { Chip } from "@mui/material";
import { loanStatusLabels } from "../../display";

const GetStatusChip = ({ status }) => {
  const configs = {
    CHECKED_OUT: { label: loanStatusLabels.CHECKED_OUT, color: "success" },
    OVERDUE: { label: loanStatusLabels.OVERDUE, color: "error" },
    RETURNED: { label: loanStatusLabels.RETURNED, color: "default" },
    LOST: { label: loanStatusLabels.LOST, color: "error" },
    DAMAGED: { label: loanStatusLabels.DAMAGED, color: "warning" },
  };

  const config = configs[status] || { label: status, color: "default" };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export default GetStatusChip;
