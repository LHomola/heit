// Reusable dashboard component to be used by the different users' dashboards
// Each dashboard will be able to decide which columns and actions will be shown
import {
  Chip, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const STATUS_COLOUR = {
  open:        "default",
  triaged:     "info",
  assigned:    "secondary",
  in_progress: "warning",
  resolved:    "success",
  closed:      "default",
};

// extraColumns prop will allow a dashboards to add own columns with UI elements (e.g., manager dashboard will include Assign button)
export default function TicketTable({ tickets, extraColumns = [] }) {
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            {extraColumns.map(col => (
              <TableCell key={col.label}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.map(t => (
            <TableRow
              key={t.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => navigate(`/tickets/${t.id}`)}
            >
              <TableCell>{t.id}</TableCell>
              <TableCell>{t.title}</TableCell>
              <TableCell>
                <Chip
                  label={t.status.replace("_", " ")}
                  color={STATUS_COLOUR[t.status] ?? "default"}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {new Date(t.created_at).toLocaleDateString()}
              </TableCell>
              {extraColumns.map(col => (
                <TableCell key={col.label} onClick={e => e.stopPropagation()}>
                  {col.render(t)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
