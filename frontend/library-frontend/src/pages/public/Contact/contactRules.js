export const CONTACT_TOPICS = [
  "Hỏi về kinh sách",
  "Hướng dẫn mượn trả",
  "Báo lỗi hệ thống",
  "Góp ý khác",
];

export const MAX_CONTACT_MESSAGE_LENGTH = 1500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateContactForm = (values = {}) => {
  const errors = {};
  const fullName = String(values.fullName ?? "").trim();
  const email = String(values.email ?? "").trim();
  const topic = String(values.topic ?? "").trim();
  const subject = String(values.subject ?? "").trim();
  const message = String(values.message ?? "").trim();

  if (!fullName) {
    errors.fullName = "Vui lòng nhập họ và tên của bạn.";
  } else if (fullName.length > 100) {
    errors.fullName = "Họ và tên không vượt quá 100 ký tự.";
  }

  if (!email) {
    errors.email = "Vui lòng nhập địa chỉ email liên hệ.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Địa chỉ email không đúng định dạng.";
  }

  if (!topic || !CONTACT_TOPICS.includes(topic)) {
    errors.topic = "Vui lòng chọn chủ đề liên hệ.";
  }

  if (!subject) {
    errors.subject = "Vui lòng nhập tiêu đề liên hệ.";
  } else if (subject.length > 150) {
    errors.subject = "Tiêu đề không vượt quá 150 ký tự.";
  }

  if (!message) {
    errors.message = "Vui lòng nhập nội dung chi tiết.";
  } else if (message.length < 10) {
    errors.message =
      "Nội dung cần tối thiểu 10 ký tự để thư viện nắm rõ yêu cầu.";
  } else if (message.length > MAX_CONTACT_MESSAGE_LENGTH) {
    errors.message = `Nội dung không vượt quá ${MAX_CONTACT_MESSAGE_LENGTH} ký tự.`;
  }

  return errors;
};

export const formatPreparedMailText = (values = {}) => {
  const lines = [
    `Chủ đề: ${String(values.topic ?? "").trim()}`,
    `Tiêu đề: ${String(values.subject ?? "").trim()}`,
    `Người gửi: ${String(values.fullName ?? "").trim()} (${String(values.email ?? "").trim()})`,
    "---",
    String(values.message ?? "").trim(),
  ];
  return lines.join("\n");
};
