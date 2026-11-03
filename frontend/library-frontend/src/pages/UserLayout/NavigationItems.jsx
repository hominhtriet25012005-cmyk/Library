import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

export const secondaryItems = [
  {
    title: "Hồ sơ",
    path: "/user/profile",
    icon: <AccountCircleRoundedIcon />,
  },
  {
    title: "Cài đặt",
    path: "/user/settings",
    icon: <SettingsIcon />,
  },
];

export const navigationItems = [
  {
    title: "Tổng quan",
    path: "/user",
    icon: <SpaceDashboardRoundedIcon />,
    description: "Tổng quan và thống kê",
  },
  {
    title: "Danh mục sách",
    path: "/user/books",
    icon: <AutoStoriesRoundedIcon />,
  },
  {
    title: "Sách đang mượn",
    path: "/user/my-loans",
    icon: <LibraryBooksRoundedIcon />,
    description: "Lượt mượn và lịch sử",
    badge: "loans",
  },
  {
    title: "Sách đặt giữ",
    path: "/user/my-reservations",
    icon: <EventAvailableRoundedIcon />,
    description: "Đặt giữ và lịch sử",
    badge: "reservations",
  },
  {
    title: "Tiền phạt",
    path: "/user/my-fines",
    icon: <ReceiptLongRoundedIcon />,
    description: "Chưa thanh toán và đã thanh toán",
    badge: "fines",
  },
  {
    title: "Gói thành viên",
    path: "/user/subscriptions",
    icon: <WorkspacePremiumRoundedIcon />,
    badge: "subscription",
  },
  {
    title: "Sách yêu thích",
    path: "/user/wishlist",
    icon: <FavoriteRoundedIcon />,
    description: "Sách đã lưu",
  },
];
