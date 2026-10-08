import AccessAlarm from "@mui/icons-material/AccessAlarmRounded";
import Book from "@mui/icons-material/BookRounded";
import CheckCircle from "@mui/icons-material/CheckCircleRounded";

export const tabs = [
  { label: "Tất cả", value: "all", icon: <Book className="w-5 h-5" /> },
  { label: "Đang xử lý", value: "active", icon: <AccessAlarm className="w-5 h-5" /> },
  { label: "Đã kết thúc", value: "past", icon: <CheckCircle className="w-5 h-5" /> },
];
