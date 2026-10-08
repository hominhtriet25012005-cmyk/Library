
import { reservationStatusLabels } from "../../display";
import { Link } from "react-router-dom";

const Reservation = ({ entries = [], preview = false }) => (
  <div className="p-6">
    <h3 className="text-2xl font-bold text-gray-900 mb-6">Sách bạn đã đặt giữ</h3>
    <div className="space-y-4">
      {entries.filter((item) => ["PENDING", "AVAILABLE"].includes(item.status)).map((reservation) => (
        <div key={reservation.id} className="rounded-xl border border-gray-200 p-4">
          <p className="font-semibold">{reservation.bookTitle}</p>
          <p className="text-sm text-gray-600">Trạng thái: {reservationStatusLabels[reservation.status] ?? reservation.status}</p>
        </div>
      ))}
      {!entries.some((item) => ["PENDING", "AVAILABLE"].includes(item.status)) && <p className="text-slate-600">Chưa có sách đang đặt giữ.</p>}
      <Link to={preview ? "/demo/my-reservations" : "/user/my-reservations"} className="inline-block font-semibold text-blue-700 underline">Xem tất cả đặt giữ</Link>
    </div>
  </div>
);

export default Reservation;
