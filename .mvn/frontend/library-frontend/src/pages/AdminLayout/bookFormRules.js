const optionalText = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

const isValidDate = (value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const ALLOWED_COVER_IMAGE_TYPES = ["image/jpeg", "image/png"];
export const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const validateCoverImageFile = (file) => {
  if (!file || file.size === 0) {
    return "Vui lòng chọn ảnh bìa để tải lên.";
  }
  const isJpegOrPng =
    ALLOWED_COVER_IMAGE_TYPES.includes(file.type) ||
    /\.(jpe?g|png)$/i.test(file.name || "");
  if (!isJpegOrPng) {
    return "Chỉ chấp nhận ảnh bìa định dạng JPEG hoặc PNG.";
  }
  if (file.size > MAX_COVER_IMAGE_SIZE) {
    return "Ảnh bìa không được lớn hơn 5 MB.";
  }
  return "";
};

export const validateBookForm = (form, original = null) => {
  const isbn = String(form.isbn ?? "").trim();
  const title = String(form.title ?? "").trim();
  const author = String(form.author ?? "").trim();
  const genreId = Number(form.genreId);

  if (!isbn || !title || !author || !form.genreId) {
    return "Vui lòng nhập ISBN, tên sách, tác giả và thể loại.";
  }
  if (isbn.length > 20) return "ISBN không được vượt quá 20 ký tự.";
  if (title.length > 255) return "Tên sách không được vượt quá 255 ký tự.";
  if (author.length > 255) return "Tên tác giả không được vượt quá 255 ký tự.";
  if (!Number.isInteger(genreId) || genreId <= 0)
    return "Vui lòng chọn thể loại hợp lệ.";

  const total = Number(form.totalCopies);
  if (!Number.isInteger(total) || total < 0 || total > 2_147_483_647) {
    return "Tổng số bản phải là số nguyên không âm trong giới hạn hệ thống.";
  }
  if (original && total < original.totalCopies - original.availableCopies) {
    return "Tổng số bản mới không thể nhỏ hơn số bản đang không sẵn.";
  }

  const pagesText = String(form.pages ?? "").trim();
  if (pagesText) {
    const pages = Number(pagesText);
    if (!Number.isInteger(pages) || pages < 1 || pages > 50_000) {
      return "Số trang phải là số nguyên từ 1 đến 50.000.";
    }
  }

  const priceText = String(form.price ?? "").trim();
  if (priceText && !/^\d{1,8}(?:\.\d{1,2})?$/.test(priceText)) {
    return "Giá tham khảo phải không âm, tối đa 8 chữ số nguyên và 2 chữ số thập phân.";
  }

  if (String(form.publisher ?? "").trim().length > 100) {
    return "Nhà xuất bản không được vượt quá 100 ký tự.";
  }
  if (String(form.language ?? "").trim().length > 20) {
    return "Ngôn ngữ không được vượt quá 20 ký tự.";
  }
  if (String(form.description ?? "").trim().length > 2000) {
    return "Mô tả không được vượt quá 2.000 ký tự.";
  }
  if (String(form.coverImageUrl ?? "").trim().length > 500) {
    return "URL ảnh bìa không được vượt quá 500 ký tự.";
  }
  const publicationPrecision =
    form.publicationPrecision ??
    (form.publicationDate
      ? "date"
      : String(form.publicationYear ?? "").trim()
        ? "year"
        : "unknown");
  if (publicationPrecision === "date" && !isValidDate(form.publicationDate)) {
    return "Vui lòng nhập ngày xuất bản đầy đủ và hợp lệ.";
  }
  if (publicationPrecision === "year") {
    const yearText = String(form.publicationYear ?? "").trim();
    const year = Number(yearText);
    if (
      !/^\d{1,4}$/.test(yearText) ||
      !Number.isInteger(year) ||
      year < 1 ||
      year > 9999
    ) {
      return "Năm xuất bản phải là số nguyên từ 1 đến 9999.";
    }
  }

  return "";
};

export const bookPayload = (form, original = null) => {
  const payloadForm = { ...form };
  delete payloadForm.publicationPrecision;
  const publicationPrecision =
    form.publicationPrecision ??
    (form.publicationDate
      ? "date"
      : String(form.publicationYear ?? "").trim()
        ? "year"
        : "unknown");

  return {
    ...payloadForm,
    isbn: String(form.isbn ?? "").trim(),
    title: String(form.title ?? "").trim(),
    author: String(form.author ?? "").trim(),
    genreId: Number(form.genreId),
    publisher: optionalText(form.publisher),
    language: optionalText(form.language),
    description: optionalText(form.description),
    coverImageUrl: optionalText(form.coverImageUrl),
    totalCopies: Number(form.totalCopies),
    availableCopies: original
      ? Number(original.availableCopies)
      : Number(form.totalCopies),
    pages: String(form.pages ?? "").trim() ? Number(form.pages) : null,
    price: String(form.price ?? "").trim() ? Number(form.price) : null,
    publicationDate:
      publicationPrecision === "date" ? form.publicationDate || null : null,
    publicationYear:
      publicationPrecision === "year" &&
      String(form.publicationYear ?? "").trim()
        ? Number(form.publicationYear)
        : null,
  };
};
