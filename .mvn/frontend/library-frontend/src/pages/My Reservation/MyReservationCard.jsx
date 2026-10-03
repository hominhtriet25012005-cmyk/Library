import { HourglassBottom } from "@mui/icons-material";
import React from "react";
import {
  AccessAlarm,
  CalendarToday,
  CheckCircle,
  Close,
} from "@mui/icons-material";

const MyReservationCard = ({ reservation }) => {
  const statusColors = getStatusColor(reservation.status);
  // const timeRemaining = getTimeRemaining(reservation.dueDate);

  const getStatusIcon = (status) => {
    const iconClass = "w-5 h-5";

    const icons = {
      PENDING: <HourglassBottom className={iconClass} />,
      AVAILABLE: <CalendarIcon className={iconClass} />,
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
            {reservation.status}
          </span>
        </div>
      </div>
      <div className="p-6">
        {/* book header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Book className="w-6 h-6 text-white" />
            </div>

            <div>
              <p>Book Id</p>
              <h3>#{reservation.bookId}</h3>
            </div>
          </div>

          <p>{reservation.bookTitle}</p>
        </div>

        <Divider sx={{ py: 3 }} />

        {/* Timeline */}

        <div className="space-y-3 mt-3">
          <div className="flex items-start gap-2">
            <AccessAlarm className="w-4 h-4 text-gray-400 mt-0.5" />

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Reserved
              </p>

              <p className="text-sm font-semibold text-gray-700">
                {reservation.reservedAt}
              </p>
            </div>
          </div>
        </div>

        {reservation.availableAt && (
          <div className="flex items-start gap-2">
            <CalendarIcon className="w-4 h-4 text-green-500 mt-0.5" />

            <div>
              <p className="text-xs font-semibold text-green-600 uppercase">
                Available
              </p>

              <p className="text-sm font-semibold text-green-700">
                {reservation.availableAt}
              </p>
            </div>
          </div>
        )}

        {reservation.expiresAt && (
          <div className="flex items-start gap-2">
            <Notifications className="w-4 h-4 text-red-500 mt-0.5" />

            <div>
              <p className="text-xs font-semibold text-red-600 uppercase">
                Expires
              </p>

              <p className="text-sm font-semibold text-red-700">
                {reservation.expiresAt}
              </p>
            </div>
          </div>
        )}

        {reservation.fulfilledAt && (
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />

            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase">
                Fulfilled
              </p>

              <p className="text-sm font-semibold text-blue-700">
                {reservation.fulfilledAt}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservationCard;
