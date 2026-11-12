import EventAvailableIcon from "@mui/icons-material/EventAvailableRounded";
import LibraryBooks from "@mui/icons-material/LibraryBooksRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { effectiveLoanStatus } from "../MyLoans/loanRules.js";
import { fineSummary } from "../Fines/fineRules.js";

export const statsConfig = ({ myLoans, reservations, fines }) => [
  {
    id: "loans",
    title: "Sách đang mượn",
    subtitle: "Các lượt mượn hiện tại",
    value:
      myLoans == null
        ? "—"
        : myLoans.filter((loan) =>
            ["CHECKED_OUT", "OVERDUE"].includes(effectiveLoanStatus(loan)),
          ).length,
    icon: <LibraryBooks sx={{ fontSize: 32, color: "#315B4C" }} />,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-800",
  },
  {
    id: "reservations",
    title: "Sách đặt giữ",
    subtitle:
      reservations == null ? "Sẽ kết nối ở F3C" : "Các lượt đặt giữ hiện tại",
    value:
      reservations == null
        ? "—"
        : reservations.filter((reservation) =>
            ["PENDING", "AVAILABLE"].includes(reservation.status),
          ).length,
    icon: <EventAvailableIcon sx={{ fontSize: 32, color: "#A98247" }} />,
    bgColor: "bg-amber-50",
    textColor: "text-amber-800",
  },
  {
    id: "fines",
    title: "Tiền phạt còn nợ",
    subtitle:
      fines == null
        ? "Chưa có dữ liệu"
        : `${fineSummary(fines).payable} khoản cần thanh toán`,
    value:
      fines == null
        ? "—"
        : new Intl.NumberFormat("vi-VN").format(
            fineSummary(fines).outstanding,
          ) + " ₫",
    icon: <ReceiptLongRoundedIcon sx={{ fontSize: 32, color: "#315B4C" }} />,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-800",
  },
];
