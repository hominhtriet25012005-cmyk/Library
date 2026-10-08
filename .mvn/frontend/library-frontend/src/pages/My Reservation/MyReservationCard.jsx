import { Button, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import AccessAlarm from "@mui/icons-material/AccessAlarmRounded";
import Book from "@mui/icons-material/BookRounded";
import CalendarToday from "@mui/icons-material/CalendarTodayRounded";
import CheckCircle from "@mui/icons-material/CheckCircleRounded";
import Close from "@mui/icons-material/CloseRounded";
import HourglassBottom from "@mui/icons-material/HourglassBottomRounded";
import Notifications from "@mui/icons-material/NotificationsRounded";
import { getStatusColor } from "./getStatusColor";
import { formatDate, reservationStatusLabels } from "../../display";
import { canCancelReservation } from "./reservationRules.js";

const MyReservationCard = ({ reservation, preview = false, onAction }) => {
  const statusColors = getStatusColor(reservation.status);
  // const timeRemaining = getTimeRemaining(reservation.dueDate);

  const getStatusIcon = (status) => {
    const iconClass = "w-5 h-5";

    const icons = {
      PENDING: <HourglassBottom className={iconClass} />,
      AVAILABLE: <CalendarToday className={iconClass} />,
      FULFILLED: <CheckCircle className={iconClass} />,
      CANCELLED: <Close className={iconClass} />,
      EXPIRED: <AccessAlarm className={iconClass} />,
    };

    return icons[status] || <AccessAlarm className={iconClass} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100">
      {/* status banner */}

      <div
        className={`bg-gradient-to-r ${statusColors.gradient} p-4 px-4 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <span>{getStatusIcon(reservation.status)}</span>
          <span
            className={`${statusColors.text} font-bold text-sm uppercase tracking-wider`}
          >
            {reservationStatusLabels[reservation.status] ?? reservation.status}
          </span>
        </div>
      </div>
      <div className="p-6">
        {/* book header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-sky-700 shadow-lg">
              <Book className="w-6 h-6 text-white" />
            </div>

            <div>
              <p>Mã sách</p>
              <h3>#{reservation.bookId}</h3>
            </div>
          </div>

          <p className="font-semibold text-slate-900">{reservation.bookTitle}</p>
          <p className="text-sm text-slate-600">{reservation.bookAuthor || "Chưa rõ tác giả"}</p>
          {reservation.bookIsbn && <p className="text-xs text-slate-500">ISBN: {reservation.bookIsbn}</p>}
        </div>

        <Divider sx={{ py: 3 }} />

        {/* Timeline */}

        <div className="space-y-3 mt-3">
          {reservation.queuePosition != null && reservation.status === "PENDING" && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Vị trí hàng đợi: {reservation.queuePosition}</p>}
          <div className="flex items-start gap-2">
            <AccessAlarm className="w-4 h-4 text-gray-400 mt-0.5" />

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Đã đặt giữ
              </p>

              <p className="text-sm font-semibold text-gray-700">
                {formatDate(reservation.reservedAt)}
              </p>
            </div>
          </div>
        </div>

        {reservation.availableAt && (
          <div className="flex items-start gap-2">
            <CalendarToday className="w-4 h-4 text-green-500 mt-0.5" />

            <div>
              <p className="text-xs font-semibold text-green-600 uppercase">
                Sẵn sàng nhận
              </p>

              <p className="text-sm font-semibold text-green-700">
                {formatDate(reservation.availableAt)}
              </p>
            </div>
          </div>
        )}

        {reservation.availableUntil && (
          <div className="flex items-start gap-2">
            <Notifications className="w-4 h-4 text-red-500 mt-0.5" />

            <div>
              <p className="text-xs font-semibold text-red-600 uppercase">
                Hết hạn nhận
              </p>

              <p className="text-sm font-semibold text-red-700">
                {new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(reservation.availableUntil))}
              </p>
            </div>
          </div>
        )}

        {reservation.fulfilledAt && (
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />

            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase">
                Đã nhận sách
              </p>

              <p className="text-sm font-semibold text-blue-700">
                {formatDate(reservation.fulfilledAt)}
              </p>
            </div>
          </div>
        )}
        {reservation.cancelledAt && <p className="mt-3 text-sm text-slate-600">Đã hủy: {formatDate(reservation.cancelledAt)}</p>}
        {reservation.notes && <p className="mt-3 whitespace-pre-line rounded-lg bg-blue-50 p-3 text-sm text-slate-700">Ghi chú: {reservation.notes}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {!preview && reservation.bookId && <Button component={Link} to={`/user/books/${reservation.bookId}`} variant="outlined">Xem sách</Button>}
          {!preview && canCancelReservation(reservation) && <Button color="error" onClick={() => onAction(reservation, "cancel")}>Hủy đặt giữ</Button>}
          {!preview && reservation.status === "AVAILABLE" && reservation.isBookAvailable === true && <p className="text-sm text-blue-700">Sách sẵn sàng. ADMIN sẽ xác nhận giao sách tại thư viện.</p>}
        </div>
      </div>
    </div>
  );
};

export default MyReservationCard;
