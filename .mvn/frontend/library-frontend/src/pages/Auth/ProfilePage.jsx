import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { formatDate } from "../../display";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const logout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <section className="min-h-screen bg-blue-50 px-4 sm:px-8 py-8">
      <div className="max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#1769ff] mb-2">
          Hồ sơ của tôi
        </h1>
        <p className="text-slate-600 mb-8">
          Thông tin tài khoản được tải từ hệ thống.
        </p>
        <dl className="grid sm:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm text-slate-500">Họ và tên</dt>
            <dd className="font-semibold">{user.fullName || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="font-semibold break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Số điện thoại</dt>
            <dd className="font-semibold">{user.phone || "Chưa cập nhật"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Vai trò</dt>
            <dd className="font-semibold">
              {user.role === "ROLE_ADMIN" ? "Quản trị viên" : "Người dùng"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Đăng nhập gần nhất</dt>
            <dd className="font-semibold">{formatDate(user.lastLogin)}</dd>
          </div>
        </dl>
        <Button variant="outlined" onClick={logout} sx={{ mt: 4 }}>
          Đăng xuất
        </Button>
      </div>
    </section>
  );
};

export default ProfilePage;
