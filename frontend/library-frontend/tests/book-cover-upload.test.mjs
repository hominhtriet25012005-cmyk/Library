import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_COVER_IMAGE_TYPES,
  MAX_COVER_IMAGE_SIZE,
  validateCoverImageFile,
  bookPayload,
} from "../src/pages/AdminLayout/bookFormRules.js";
import { createAdminCatalogApi } from "../src/api/adminCatalog.js";
import { ApiError } from "../src/api/client.js";

test("chọn ảnh hợp lệ: file JPEG hoặc PNG dung lượng <= 5 MB", () => {
  const validJpeg = { name: "cover.jpg", type: "image/jpeg", size: 2 * 1024 * 1024 };
  const validPng = { name: "cover.png", type: "image/png", size: 4.9 * 1024 * 1024 };
  const validJpgExtOnly = { name: "cover.JPG", type: "", size: 1024 };

  assert.equal(validateCoverImageFile(validJpeg), "");
  assert.equal(validateCoverImageFile(validPng), "");
  assert.equal(validateCoverImageFile(validJpgExtOnly), "");
});

test("ảnh sai định dạng: từ chối file không phải JPEG hoặc PNG", () => {
  const pdfFile = { name: "document.pdf", type: "application/pdf", size: 1024 };
  const gifFile = { name: "animation.gif", type: "image/gif", size: 1024 };
  const webpFile = { name: "cover.webp", type: "image/webp", size: 1024 };
  const txtFile = { name: "note.txt", type: "text/plain", size: 500 };

  assert.match(validateCoverImageFile(pdfFile), /JPEG hoặc PNG/);
  assert.match(validateCoverImageFile(gifFile), /JPEG hoặc PNG/);
  assert.match(validateCoverImageFile(webpFile), /JPEG hoặc PNG/);
  assert.match(validateCoverImageFile(txtFile), /JPEG hoặc PNG/);
});

test("ảnh quá 5 MB: báo lỗi dung lượng vượt quá giới hạn", () => {
  const oversizeJpeg = {
    name: "huge.jpg",
    type: "image/jpeg",
    size: MAX_COVER_IMAGE_SIZE + 1,
  };
  assert.match(validateCoverImageFile(oversizeJpeg), /5 MB/);
});

test("chọn ảnh rỗng hoặc không có tệp: báo lỗi yêu cầu chọn ảnh", () => {
  assert.match(validateCoverImageFile(null), /chọn ảnh bìa/);
  assert.match(validateCoverImageFile(undefined), /chọn ảnh bìa/);
  assert.match(validateCoverImageFile({ name: "empty.jpg", type: "image/jpeg", size: 0 }), /chọn ảnh bìa/);
});

test("upload lỗi: ném lỗi và không cập nhật ảnh mới vào sách khi upload thất bại", async () => {
  const client = {
    post: async () => {
      throw new ApiError(400, "Chỉ chấp nhận ảnh bìa JPEG hoặc PNG hợp lệ.");
    },
  };
  const catalog = createAdminCatalogApi(client);

  const initialForm = {
    isbn: "978-0-13-475759-9",
    title: "Clean Code",
    author: "Robert C. Martin",
    genreId: 2,
    totalCopies: 5,
    coverImageUrl: "http://localhost:8000/api/book-covers/old.jpg",
  };

  let simulatedForm = { ...initialForm };
  let caughtError = null;

  try {
    const file = new Blob(["corrupt-data"], { type: "image/jpeg" });
    const response = await catalog.uploadBookCover(file);
    simulatedForm.coverImageUrl = response.imageUrl;
  } catch (error) {
    caughtError = error;
  }

  // Phải bắt được lỗi chính xác do backend trả về
  assert.ok(caughtError);
  assert.equal(caughtError.status, 400);
  assert.equal(caughtError.message, "Chỉ chấp nhận ảnh bìa JPEG hoặc PNG hợp lệ.");

  // URL ảnh trong form không được thay đổi thành ảnh mới chưa upload thành công
  assert.equal(simulatedForm.coverImageUrl, initialForm.coverImageUrl);

  // Khi lưu sách, payload vẫn dùng ảnh cũ an toàn
  const payload = bookPayload(simulatedForm);
  assert.equal(payload.coverImageUrl, "http://localhost:8000/api/book-covers/old.jpg");
});

test("upload thành công rồi lưu sách: gán response.imageUrl và gửi trong payload sách", async () => {
  const fakeUploadedUrl = "http://localhost:8000/api/book-covers/3f4e2c1a-test.jpg";
  const client = {
    post: async (path, formData) => {
      assert.equal(path, "/api/admin/books/covers");
      assert.ok(formData instanceof FormData);
      return {
        imageUrl: fakeUploadedUrl,
        filename: "3f4e2c1a-test.jpg",
        contentType: "image/jpeg",
        size: 10240,
      };
    },
  };
  const catalog = createAdminCatalogApi(client);

  const form = {
    isbn: "978-0-13-475759-9",
    title: "Clean Code",
    author: "Robert C. Martin",
    genreId: 2,
    totalCopies: 5,
    coverImageUrl: "",
  };

  const file = new Blob(["valid-bytes"], { type: "image/jpeg" });
  const uploadResult = await catalog.uploadBookCover(file);

  assert.equal(uploadResult.imageUrl, fakeUploadedUrl);

  // Gán vào form
  form.coverImageUrl = uploadResult.imageUrl;

  // Khi lưu, payload sách chứa đúng URL ảnh đã upload
  const payload = bookPayload(form);
  assert.equal(payload.coverImageUrl, fakeUploadedUrl);
});

test("sửa sách giữ ảnh cũ khi chưa chọn ảnh mới", () => {
  const original = {
    id: 10,
    isbn: "978-0-13-475759-9",
    title: "Refactoring",
    author: "Martin Fowler",
    genreId: 2,
    totalCopies: 3,
    availableCopies: 2,
    coverImageUrl: "http://localhost:8000/api/book-covers/existing-cover.png",
  };

  // Khi mở form sửa, khởi tạo form từ original
  const editForm = {
    ...original,
    genreId: String(original.genreId),
  };

  // Người dùng không chọn tệp ảnh mới nào và bấm Lưu
  const payload = bookPayload(editForm, original);
  assert.equal(payload.coverImageUrl, "http://localhost:8000/api/book-covers/existing-cover.png");
});

