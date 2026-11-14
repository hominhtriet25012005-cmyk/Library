# BE-3 — Gói thành viên và API

Ngày nghiệm thu mã: 01/11/2026 (Asia/Saigon).

## Hành vi đã chốt

1. **Hành vi BE-3 ban đầu (đã được thay thế bởi AUD2-BE-04):** gói có lịch sử bị đặt `active=false` khi gọi DELETE.
2. `PUT /api/subscription-plans/admin/{id}` dùng `@Valid`; request thiếu tên, mã, thời hạn, giá hoặc quota bị trả 400 trước service.
3. Vô hiệu gói đăng ký hết hạn chỉ dùng `POST /api/subscriptions/admin/deactivate-expired`; GET không còn làm thay đổi dữ liệu.
4. `GET /api/subscriptions/admin?page=&size=` dùng `findAll(Pageable)`, sắp mới nhất trước và giới hạn size 1–100. Endpoint `/admin/search` vẫn là lựa chọn đầy đủ để lấy metadata và lọc.
5. payOS giữ quy tắc một gói active: khi còn gói hiệu lực không tạo draft/payment mới; hủy gói thu hồi quyền ngay và cho phép tạo draft mới.
6. Endpoint `/api/subscriptions/activate` vẫn bị khóa; kích hoạt chỉ xảy ra từ settlement payOS có bằng chứng đã xác minh.

## Database

Không ALTER và không sửa `library_db1.sql`. Các cột `subscription_plans.active`, `updated_by` và lịch sử trong `subscriptions` đã đủ cho chính sách V1.

## Kiểm thử

- `SubscriptionPlanLifecycleTests` **baseline BE-3 cũ**: gói chưa dùng được xóa cứng; gói có lịch sử chỉ ngừng bán. Assertion đã được cập nhật theo AUD2-BE-04 nhưng chưa chạy.
- `SubscriptionRepurchasePolicyTests`: hủy gói active rồi tạo được draft payOS mới.
- `AdminMembershipCatalogTests`: danh sách cũ dùng đúng `Pageable`, không `findAll()` toàn bảng.
- `AdminMembershipHttpSecurityTests` **baseline BE-3 cũ**: validation update, response xóa/ngừng bán, POST expire, GET 405 và page parameters. Ca xóa có lịch sử hiện kỳ vọng HTTP 409; chưa chạy lại.
- Hồi quy: `PayOSMembershipTests`, `SubscriptionPayOSRoutingTests`, `SubscriptionActiveControllerTests`, `PayOSHttpSecurityTests`.

Kết quả BE-3 ban đầu: **29/29 test đạt** ở thời điểm trước AUD2-BE-04; đây không phải kết quả kiểm chứng hành vi hiện hành. Test MySQL opt-in chưa chạy trên database chính có dữ liệu.

## Quy tắc hiện hành — AUD2-BE-04 (13/11/2026)

- Gói chưa từng được đăng ký: DELETE xóa cứng và trả thành công.
- Gói đã có bất kỳ lịch sử đăng ký nào: DELETE trả HTTP 409, mã `SUBSCRIPTION_PLAN_HAS_HISTORY`; không xóa, không đổi `isActive`, không cập nhật `updatedBy`, không sửa lịch sử.
- Backend và giao diện ADMIN không cung cấp thao tác ngừng bán; gói mới luôn được tạo ở trạng thái hiển thị, còn thao tác sửa giữ nguyên trạng thái hiện tại.
- Không đổi schema hoặc khóa ngoại; FK hiện có tiếp tục bảo vệ tham chiếu lịch sử.
- Assertion trong `SubscriptionPlanLifecycleTests` và `AdminMembershipHttpSecurityTests` đã được cập nhật theo contract này; chưa chạy kiểm chứng trong lượt AUD2-BE-04.
