# BE-3 — Gói thành viên và API

Ngày nghiệm thu mã: 01/11/2026 (Asia/Saigon).

## Hành vi đã chốt

1. `DELETE /api/subscription-plans/admin/{id}` tự kiểm tra lịch sử đăng ký:
   - chưa từng có bản ghi trong `subscriptions`: xóa cứng plan;
   - đã từng có đăng ký: không xóa, chỉ đặt `active=false`, cập nhật `updatedBy` và giữ nguyên bản ghi để bảo toàn lịch sử.
2. `PUT /api/subscription-plans/admin/{id}` dùng `@Valid`; request thiếu tên, mã, thời hạn, giá hoặc quota bị trả 400 trước service.
3. Vô hiệu gói đăng ký hết hạn chỉ dùng `POST /api/subscriptions/admin/deactivate-expired`; GET không còn làm thay đổi dữ liệu.
4. `GET /api/subscriptions/admin?page=&size=` dùng `findAll(Pageable)`, sắp mới nhất trước và giới hạn size 1–100. Endpoint `/admin/search` vẫn là lựa chọn đầy đủ để lấy metadata và lọc.
5. payOS giữ quy tắc một gói active: khi còn gói hiệu lực không tạo draft/payment mới; hủy gói thu hồi quyền ngay và cho phép tạo draft mới.
6. Endpoint `/api/subscriptions/activate` vẫn bị khóa; kích hoạt chỉ xảy ra từ settlement payOS có bằng chứng đã xác minh.

## Database

Không ALTER và không sửa `library_db1.sql`. Các cột `subscription_plans.active`, `updated_by` và lịch sử trong `subscriptions` đã đủ cho chính sách V1.

## Kiểm thử

- `SubscriptionPlanLifecycleTests`: gói chưa dùng được xóa cứng; gói có lịch sử chỉ ngừng bán.
- `SubscriptionRepurchasePolicyTests`: hủy gói active rồi tạo được draft payOS mới.
- `AdminMembershipCatalogTests`: danh sách cũ dùng đúng `Pageable`, không `findAll()` toàn bảng.
- `AdminMembershipHttpSecurityTests`: validation update, hai response xóa/ngừng bán, POST expire, GET 405 và page parameters.
- Hồi quy: `PayOSMembershipTests`, `SubscriptionPayOSRoutingTests`, `SubscriptionActiveControllerTests`, `PayOSHttpSecurityTests`.

Kết quả hiện tại: **29/29 test đạt**, gồm service, HTTP security, repository, payOS và chính sách mua lại. Test MySQL opt-in đã được cập nhật theo quy tắc xóa có điều kiện và POST, nhưng chưa chạy trên database chính có dữ liệu.
