export const adminNavigationSections = [
  {
    title: "Tổng quan",
    items: [
      {
        title: "Dashboard",
        path: "/admin/dashboard",
        icon: "dashboard",
        stage: "AD1",
        description: "Số liệu sách và lối tắt quản trị.",
      },
    ],
  },
  {
    title: "Quản lý thư viện",
    items: [
      {
        title: "Sách",
        path: "/admin/books",
        icon: "books",
        stage: "AD2",
        description: "Tra cứu, thêm/sửa và ẩn/hiện đầu sách.",
      },
      {
        title: "Thể loại",
        path: "/admin/genres",
        icon: "genres",
        stage: "AD2",
        description: "Cây thể loại, thêm/sửa và ẩn/hiện.",
      },
      {
        title: "Người dùng",
        path: "/admin/users",
        icon: "users",
        stage: "AD3",
        description: "Tra cứu và xem thông tin cơ bản của tài khoản.",
      },
    ],
  },
  {
    title: "Nghiệp vụ thư viện",
    items: [
      {
        title: "Mượn – trả",
        path: "/admin/loans",
        icon: "loans",
        stage: "AD4",
        description:
          "Tra cứu lượt mượn, cấp sách, trả, gia hạn và cập nhật quá hạn.",
      },
      {
        title: "Đặt giữ",
        path: "/admin/reservations",
        icon: "reservations",
        stage: "AD5",
        description:
          "Tra cứu đặt giữ, hàng đợi theo sách, tạo/hủy và xác nhận giao sách.",
      },
      {
        title: "Đánh giá",
        path: "/admin/reviews",
        icon: "reviews",
        stage: "AD8",
        description: "Tra cứu, xem và ẩn đánh giá không phù hợp.",
      },
    ],
  },
  {
    title: "Thành viên & tài chính",
    items: [
      {
        title: "Gói thành viên",
        path: "/admin/subscriptions",
        icon: "subscriptions",
        stage: "AD6",
        description: "Xem và tạo gói, theo dõi thành viên đăng ký.",
      },
      {
        title: "Tiền phạt",
        path: "/admin/fines",
        icon: "fines",
        stage: "AD7",
        description: "Tra cứu, tạo và miễn phần còn nợ của tiền phạt.",
      },
      {
        title: "Thanh toán",
        path: "/admin/payments",
        icon: "payments",
        stage: "AD7",
        description: "Tra cứu trạng thái và đối soát với payOS khi được bật.",
      },
    ],
  },
];

const pages = adminNavigationSections.flatMap((section) => section.items);

export const isAdminNavActive = (path, pathname) =>
  pathname === path ||
  (path !== "/admin/dashboard" && pathname.startsWith(`${path}/`));

export const adminPageForPath = (pathname) => {
  if (pathname === "/admin/subscriptions/plans") {
    return {
      title: "Các gói",
      path: pathname,
      stage: "AD6",
      description: "Xem và thêm gói thành viên.",
    };
  }
  if (pathname === "/admin/subscriptions/members") {
    return {
      title: "Thành viên đăng ký",
      path: pathname,
      stage: "AD6",
      description: "Tra cứu và xem đăng ký thành viên.",
    };
  }
  return pages.find((page) => page.path === pathname) ?? null;
};
