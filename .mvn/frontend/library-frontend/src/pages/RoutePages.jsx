import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const Page = ({ code, title, description, children }) => (
  <main className="min-h-screen bg-blue-50 flex items-center justify-center px-4 py-12">
    <div className="max-w-xl rounded-2xl bg-white p-8 shadow-sm text-center">
      {code && <p className="text-5xl font-bold text-[#1769ff] mb-4">{code}</p>}
      <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
      <p className="text-slate-600 mb-6">{description}</p>
      {children}
    </div>
  </main>
);

export const LandingPage = () => {
  const { user } = useAuth();
  return <Page title="Hệ thống quản lý thư viện" description="Tra cứu và quản lý sách của bạn trong một nơi.">
    <Button variant="contained" component={RouterLink} to="/demo" sx={{ mr: 1 }}>
      Xem giao diện người dùng
    </Button>
    <Button component={RouterLink} to={user?.role === "ROLE_ADMIN" ? "/admin" : user ? "/user" : "/login"}>
      {user ? "Vào tài khoản" : "Đăng nhập"}
    </Button>
    {!user && <Button component={RouterLink} to="/register">Tạo tài khoản</Button>}
    <p className="mt-4 text-sm text-slate-500">Chế độ xem thử dùng dữ liệu mẫu, không cần đăng nhập.</p>
  </Page>;
};

export const ComingSoonPage = () => <Page title="Chức năng chưa triển khai" description="Mục này sẽ được hoàn thiện trong các giai đoạn tiếp theo.">
  <Button component={RouterLink} to="/user">Về Tổng quan</Button>
</Page>;

export const ForbiddenPage = () => <Page code="403" title="Không có quyền truy cập" description="Tài khoản của bạn không được phép xem trang này.">
  <Button component={RouterLink} to="/">Về trang chủ</Button>
</Page>;

export const NotFoundPage = () => <Page code="404" title="Không tìm thấy trang" description="Địa chỉ bạn mở không tồn tại hoặc đã thay đổi.">
  <Button component={RouterLink} to="/">Về trang chủ</Button>
</Page>;
