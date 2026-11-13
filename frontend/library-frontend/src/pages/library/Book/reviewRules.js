export const cleanReviewText = (reviewText = "") =>
  String(reviewText ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();

const REVIEWABLE_LOAN_STATUSES = new Set(["RETURNED", "DAMAGED", "LOST"]);

export const hasReviewableLoan = (loans, bookId) =>
  loans.some(
    (loan) =>
      Number(loan.bookId) === Number(bookId) &&
      REVIEWABLE_LOAN_STATUSES.has(loan.status),
  );

export const ownReview = (reviews, userId) =>
  reviews.find((review) => Number(review.userId) === Number(userId));

export const canCreateReview = (loans, bookId, reviews, userId) =>
  hasReviewableLoan(loans, bookId) && !ownReview(reviews, userId);

export const validateReview = ({ rating, reviewText = "" }) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return "Điểm đánh giá phải từ 1 đến 5 sao.";
  const textLength = cleanReviewText(reviewText).length;
  if (textLength > 2000) return "Nội dung đánh giá tối đa 2000 ký tự.";
  return null;
};
