# Library Management System

Hệ thống quản lý thư viện gồm Backend Spring Boot, Frontend React/Vite và MySQL. Giao diện sử dụng tiếng Việt; mã nguồn và xử lý nội bộ dùng tiếng Anh.

## Cấu trúc dự án

```text
Library_Management_System/
├── Library/                    # Backend Spring Boot
├── frontend/library-frontend/ # Frontend React/Vite
├── database/library_db1.sql   # Schema MySQL chính thức duy nhất
├── docs/                       # Tài liệu nghiệp vụ và biên bản triển khai
└── postman/                    # Collection và môi trường kiểm thử API
```

## Chạy local

Yêu cầu: Java 17, Node.js/npm và MySQL chạy tại cổng `3306`.

Backend:

```powershell
cd Library
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd frontend\library-frontend
npm install
npm run dev
```

Mặc định Frontend chạy tại `http://localhost:5173` và proxy API đến Backend tại `http://localhost:8000`.

## Cấu hình an toàn

Không commit mật khẩu, JWT secret, khóa payOS hoặc `.env.local`. Cấu hình Backend bằng biến môi trường theo [hướng dẫn bảo mật](docs/BE0_SECURITY_CONFIGURATION.md).

## Tài liệu chính

- [Theo dõi tiến độ Backend](Library/README.md)
- [Schema MySQL chính thức](database/library_db1.sql)
- [Quy ước database](database/README.md)
- [Tài liệu nghiệp vụ](docs/Library_Management_System_VI.md)
