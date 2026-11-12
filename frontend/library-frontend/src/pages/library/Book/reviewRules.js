const MIN_DB_REVIEW_LENGTH = 10;
const ZERO_WIDTH_PAD = "\u200B";

export const cleanReviewText = (reviewText = "") =>
  String(reviewText ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();

export const encodeReviewTextForDb = (reviewText = "") => {
  const cleaned = cleanReviewText(reviewText);
  if (cleaned.length >= MIN_DB_REVIEW_LENGTH) return cleaned;
  return cleaned.padEnd(MIN_DB_REVIEW_LENGTH, ZERO_WIDTH_PAD);
};

export const hasReturnedLoan = (loans, bookId) =>
  loans.some(
    (loan) =>
      Number(loan.bookId) === Number(bookId) && loan.status === "RETURNED",
  );

export const ownReview = (reviews, userId) =>
  reviews.find((review) => Number(review.userId) === Number(userId));

export const canCreateReview = (loans, bookId, reviews, userId) =>
  hasReturnedLoan(loans, bookId) && !ownReview(reviews, userId);

export const validateReview = ({ rating, reviewText = "" }) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return "Điểm đánh giá phải từ 1 đến 5 sao.";
  const textLength = cleanReviewText(reviewText).length;
  if (textLength > 2000) return "Nội dung đánh giá tối đa 2000 ký tự.";
  return null;
};
