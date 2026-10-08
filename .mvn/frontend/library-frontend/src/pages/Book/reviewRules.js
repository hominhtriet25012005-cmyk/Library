export const hasReturnedLoan = (loans, bookId) =>
  loans.some(
    (loan) =>
      Number(loan.bookId) === Number(bookId) && loan.status === "RETURNED",
  );

export const ownReview = (reviews, userId) =>
  reviews.find((review) => Number(review.userId) === Number(userId));

export const canCreateReview = (loans, bookId, reviews, userId) =>
  hasReturnedLoan(loans, bookId) && !ownReview(reviews, userId);

export const validateReview = ({ rating, title, reviewText }) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return "Điểm đánh giá phải từ 1 đến 5 sao.";
  const textLength = reviewText.trim().length;
  if (textLength < 10 || textLength > 2000)
    return "Nội dung đánh giá phải từ 10 đến 2000 ký tự.";
  if (title.trim().length > 200) return "Tiêu đề tối đa 200 ký tự.";
  return null;
};
