import assert from "node:assert/strict";
import test from "node:test";
import {
  isPublicNavActive,
  publicNavigationItems,
  publicPalette,
} from "../src/pages/public/PublicLayout/publicTheme.js";
import {
  CONTACT_TOPICS,
  formatPreparedMailText,
  validateContactForm,
} from "../src/pages/public/Contact/contactRules.js";
import { safeReturnPath } from "../src/auth/access.js";

test("Menu PublicNavbar giữ đúng thứ tự Trang chủ · Kho kinh sách · Giới thiệu · Liên hệ", () => {
  assert.deepEqual(
    publicNavigationItems.map((item) => item.label),
    ["Trang chủ", "Kho kinh sách", "Giới thiệu", "Liên hệ"],
  );
  assert.deepEqual(
    publicNavigationItems.map((item) => item.path),
    ["/", "/books", "/about", "/contact"],
  );
});

test("Active state của PublicNavbar nhận diện đúng cả trang danh mục và chi tiết sách", () => {
  assert.equal(isPublicNavActive("/", "/"), true);
  assert.equal(isPublicNavActive("/", "/books"), false);
  assert.equal(isPublicNavActive("/books", "/books"), true);
  assert.equal(isPublicNavActive("/books", "/books/25"), true);
  assert.equal(isPublicNavActive("/about", "/about"), true);
  assert.equal(isPublicNavActive("/contact", "/contact"), true);
});

test("Bảng màu Phật giáo trong PublicLayout khớp đúng mã màu thiết kế", () => {
  assert.equal(publicPalette.background, "#FAF8F3");
  assert.equal(publicPalette.surface, "#FFFFFF");
  assert.equal(publicPalette.primary, "#315B4C");
  assert.equal(publicPalette.accent, "#A98247");
  assert.equal(publicPalette.textPrimary, "#26332D");
  assert.equal(publicPalette.textSecondary, "#64716A");
  assert.equal(publicPalette.border, "#E7E4DB");
});

test("Form liên hệ validate đầy đủ các trường bắt buộc, định dạng email và độ dài nội dung", () => {
  const emptyErrors = validateContactForm({});
  assert.ok(emptyErrors.fullName);
  assert.ok(emptyErrors.email);
  assert.ok(emptyErrors.topic);
  assert.ok(emptyErrors.subject);
  assert.ok(emptyErrors.message);

  const invalidEmailErrors = validateContactForm({
    fullName: "Thích Minh Tâm",
    email: "email-khong-hop-le",
    topic: CONTACT_TOPICS[0],
    subject: "Hỏi về Kinh Pháp Cú",
    message: "Cho tôi hỏi bản dịch của Hòa thượng Thích Minh Châu còn bản in không?",
  });
  assert.ok(invalidEmailErrors.email);

  const validErrors = validateContactForm({
    fullName: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    topic: "Hỏi về kinh sách",
    subject: "Tra cứu bộ Đại Tạng Kinh",
    message: "Xin hỏi thư viện hiện có những tập nào thuộc bộ Kinh Trường Bộ?",
  });
  assert.deepEqual(validErrors, {});

  const mailText = formatPreparedMailText({
    fullName: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    topic: "Hỏi về kinh sách",
    subject: "Tra cứu bộ Đại Tạng Kinh",
    message: "Xin hỏi thư viện hiện có những tập nào thuộc bộ Kinh Trường Bộ?",
  });
  assert.ok(mailText.includes("Chủ đề: Hỏi về kinh sách"));
  assert.ok(mailText.includes("Nguyễn Văn An (an.nguyen@example.com)"));
});

test("Guest nhấn mượn/đặt giữ tại /books/:id được phép quay lại đúng sách sau khi đăng nhập", () => {
  assert.equal(safeReturnPath("/books/42"), "/books/42");
  assert.equal(safeReturnPath("/books?genreId=3&q=kinh"), "/books?genreId=3&q=kinh");
});
