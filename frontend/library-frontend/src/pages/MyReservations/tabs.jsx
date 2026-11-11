import BookRoundedIcon from "@mui/icons-material/BookRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";

export const tabs = [
  {
    label: "Tổng lượt đặt giữ",
    value: "all",
    icon: <BookRoundedIcon sx={{ fontSize: 20 }} />,
  },
  {
    label: "Đang xếp hàng",
    value: "pending",
    icon: <HourglassTopRoundedIcon sx={{ fontSize: 20 }} />,
  },
  {
    label: "Sẵn sàng nhận sách",
    value: "available",
    icon: <CalendarTodayRoundedIcon sx={{ fontSize: 20 }} />,
  },
];
