import test from "node:test";
import assert from "node:assert/strict";
import { bookPayload, validateBookForm } from "../src/pages/AdminLayout/bookFormRules.js";

const validForm = {
  isbn: "978-0-13-475759-9",
  title: "Clean Code",
  author: "Robert C. Martin",
  genreId: "2",
  totalCopies: "5",
  pages: "464",
  price: "250000.00",
  publisher: "Prentice Hall",
  language: "English",
  description: "A practical guide.",
  coverImageUrl: "https://example.test/cover.jpg",
  publicationDate: "2008-08-01",
};

test("book form requires and trims ISBN, title, author, and genre", () => {
  assert.match(validateBookForm({ ...validForm, title: "  " }), /tên sách/);
  assert.match(validateBookForm({ ...validForm, isbn: "x".repeat(21) }), /20 ký tự/);
  assert.equal(validateBookForm({ ...validForm, title: "  Clean Code  " }), "");
});

test("book form validates optional field lengths against the backend contract", () => {
  assert.match(validateBookForm({ ...validForm, publisher: "x".repeat(101) }), /nhà xuất bản/i);
  assert.match(validateBookForm({ ...validForm, language: "x".repeat(21) }), /ngôn ngữ/i);
  assert.match(validateBookForm({ ...validForm, description: "x".repeat(2001) }), /mô tả/i);
  assert.match(validateBookForm({ ...validForm, coverImageUrl: "x".repeat(501) }), /URL ảnh bìa/i);
});

test("book form validates stock, page count, and VND reference price ranges", () => {
  assert.match(validateBookForm({ ...validForm, totalCopies: "-1" }), /số nguyên không âm/);
  assert.match(validateBookForm({ ...validForm, pages: "0" }), /1 đến 50\.000/);
  assert.match(validateBookForm({ ...validForm, price: "100.999" }), /2 chữ số thập phân/i);
  assert.match(validateBookForm({ ...validForm, publicationDate: "2025-02-30" }), /ngày xuất bản/i);
});

test("editing cannot reduce total below unavailable copies", () => {
  const original = { totalCopies: 8, availableCopies: 5 };
  assert.match(validateBookForm({ ...validForm, totalCopies: "2" }, original), /không sẵn/);
  assert.equal(validateBookForm({ ...validForm, totalCopies: "4" }, original), "");
});

test("create payload trims text and initializes available copies from total", () => {
  const payload = bookPayload({ ...validForm, title: "  Clean Code  ", totalCopies: "5" });
  assert.equal(payload.title, "Clean Code");
  assert.equal(payload.availableCopies, 5);
  assert.equal(payload.genreId, 2);
  assert.equal(payload.price, 250000);
});

test("edit payload retains ISBN for display, keeps server stock input, and normalizes empty optionals", () => {
  const original = { id: 4, isbn: "OLD-ISBN", totalCopies: 8, availableCopies: 5 };
  const payload = bookPayload({ ...validForm, isbn: original.isbn, pages: "", price: "", publisher: "  " }, original);
  assert.equal(payload.isbn, "OLD-ISBN");
  assert.equal(payload.availableCopies, 5);
  assert.equal(payload.pages, null);
  assert.equal(payload.price, null);
  assert.equal(payload.publisher, null);
});
