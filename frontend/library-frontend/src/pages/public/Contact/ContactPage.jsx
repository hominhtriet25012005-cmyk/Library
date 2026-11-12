import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";

import { useAuth } from "../../../auth/useAuth";
import PublicLayout from "../PublicLayout/PublicLayout";
import { publicFonts, publicPalette } from "../PublicLayout/publicTheme";
import {
  CONTACT_TOPICS,
  MAX_CONTACT_MESSAGE_LENGTH,
  formatPreparedMailText,
  validateContactForm,
} from "./contactRules";

const TOPIC_OPTIONS = CONTACT_TOPICS;
const MAX_MESSAGE_LENGTH = MAX_CONTACT_MESSAGE_LENGTH;

const faqItems = [
  {
    question: "Làm sao để tìm một cuốn kinh/sách?",
    answer:
      "Bạn có thể nhập tên kinh, tên sách, tên tác giả/dịch giả hoặc mã ISBN vào thanh tìm kiếm tại Trang chủ hoặc trang Kho kinh sách (/books). Ngoài ra, bộ lọc bên trái cho phép lọc theo từng chủ đề Phật học và tình trạng bản in hiện còn.",
  },
  {
    question: "Cần đăng nhập để xem danh mục không?",
    answer:
      "Không cần. Khách truy cập có thể xem công khai toàn bộ danh mục kinh sách, thông tin xuất bản, số bản hiện còn và nhận xét từ bạn đọc. Bạn chỉ cần đăng nhập khi thực hiện mượn sách, đăng ký đặt giữ hoặc lưu sách yêu thích.",
  },
  {
    question: "Làm thế nào để gửi yêu cầu đặt giữ?",
    answer:
      "Khi một ấn phẩm đang được mượn hết (0 bản sẵn sàng), bạn hãy mở trang chi tiết của cuốn kinh sách đó, đăng nhập tài khoản bạn đọc đang có gói thành viên hoạt động và nhấn nút “Đặt giữ sách (Xếp hàng)”. Hệ thống sẽ ghi nhận vị trí chờ và thông báo khi có bản sách trả về.",
  },
  {
    question: "Làm thế nào để theo dõi sách đang mượn?",
    answer:
      "Sau khi đăng nhập, bạn chọn mục “Khu vực bạn đọc” (/user) -> “Sách đang mượn” (/user/my-loans) để kiểm tra ngày mượn, hạn trả dự kiến, số lần đã gia hạn và lịch sử hoàn trả.",
  },
];

export const ContactPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [formValues, setFormValues] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    topic: TOPIC_OPTIONS[0],
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [preparedMail, setPreparedMail] = useState(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    if (location.hash === "#faq") {
      const target = document.getElementById("faq");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.hash]);

  const handleFieldChange = (field) => (event) => {
    const nextValue = event.target.value;
    setFormValues((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const clone = { ...prev };
        delete clone[field];
        return clone;
      });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setCopiedNotice(false);

    const validationErrors = validateContactForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setPreparedMail(null);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const formattedBody = formatPreparedMailText(formValues);
    const mailSubject = `[Thư viện Kinh sách Phật giáo - ${formValues.topic}] ${formValues.subject.trim()}`;
    const mailtoHref = `mailto:?subject=${encodeURIComponent(
      mailSubject,
    )}&body=${encodeURIComponent(formattedBody)}`;

    setPreparedMail({
      subject: mailSubject,
      body: formattedBody,
      mailtoHref,
    });
    setSubmitting(false);

    // Mở ứng dụng email mặc định của người dùng với nội dung đã chuẩn hóa
    if (typeof window !== "undefined") {
      window.location.href = mailtoHref;
    }
  };

  const handleCopyPreparedText = async () => {
    if (!preparedMail?.body) return;
    try {
      await navigator.clipboard.writeText(preparedMail.body);
      setCopiedNotice(true);
    } catch {
      setCopiedNotice(false);
    }
  };

  return (
    <PublicLayout>
      {/* HEADER */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, md: 7 },
          bgcolor: publicPalette.surface,
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center" }}>
            <Typography
              variant="overline"
              sx={{
                display: "inline-block",
                color: publicPalette.accentDark,
                bgcolor: publicPalette.accentLight,
                border: `1px solid ${publicPalette.border}`,
                px: 1.5,
                py: 0.35,
                borderRadius: "8px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                fontSize: "0.75rem",
                mb: 2,
              }}
            >
              HỖ TRỢ BẠN ĐỌC
            </Typography>

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontFamily: publicFonts.serif,
                fontWeight: 700,
                color: publicPalette.textPrimary,
                fontSize: { xs: "1.95rem", sm: "2.45rem" },
                mb: 1.5,
              }}
            >
              Liên hệ với thư viện
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* 6.1 KHỐI THÔNG TIN & 6.2 FORM LIÊN HỆ */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, md: 8 },
          borderBottom: `1px solid ${publicPalette.border}`,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
              gap: { xs: 4, md: 5 },
              alignItems: "start",
            }}
          >
            {/* 6.1 Khối thông tin liên hệ chính thức */}
            <Stack spacing={2.5}>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontSize: { xs: "1.4rem", md: "1.65rem" },
                  color: publicPalette.textPrimary,
                }}
              >
                Kênh thông tin chính thức
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: publicPalette.textSecondary, lineHeight: 1.7 }}
              >
                Thư viện chỉ công bố các thông tin liên hệ đã được xác thực từ
                đơn vị vận hành. Các mục chưa ban hành chính thức được hiển thị
                ở trạng thái cập nhật.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                }}
              >
                <Stack direction="row" spacing={1.75} alignItems="flex-start">
                  <LocationOnOutlinedIcon
                    sx={{ color: publicPalette.primary, mt: 0.25 }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                        mb: 0.35,
                      }}
                    >
                      Địa điểm thư viện
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: publicPalette.textSecondary }}
                    >
                      Đang cập nhật
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                }}
              >
                <Stack direction="row" spacing={1.75} alignItems="flex-start">
                  <MailOutlineRoundedIcon
                    sx={{ color: publicPalette.primary, mt: 0.25 }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                        mb: 0.35,
                      }}
                    >
                      Điện thoại & Email hỗ trợ
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: publicPalette.textSecondary }}
                    >
                      Đang cập nhật
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  borderColor: publicPalette.border,
                  bgcolor: publicPalette.surface,
                }}
              >
                <Stack direction="row" spacing={1.75} alignItems="flex-start">
                  <AccessTimeOutlinedIcon
                    sx={{ color: publicPalette.primary, mt: 0.25 }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: publicPalette.textPrimary,
                        mb: 0.35,
                      }}
                    >
                      Thời gian phục vụ
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: publicPalette.textSecondary }}
                    >
                      Tra cứu danh mục trực tuyến hoạt động 24/7 · Giờ phục vụ
                      tại quầy: Đang cập nhật
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>

            {/* 6.2 Form liên hệ */}
            <Paper
              component="form"
              noValidate
              onSubmit={handleSubmit}
              variant="outlined"
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: "16px",
                borderColor: publicPalette.border,
                bgcolor: publicPalette.surface,
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontFamily: publicFonts.serif,
                  fontWeight: 700,
                  color: publicPalette.textPrimary,
                  mb: 0.75,
                }}
              >
                Gửi câu hỏi hoặc góp ý
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: publicPalette.textSecondary, mb: 3 }}
              >
                Điền đầy đủ các thông tin bên dưới để chuẩn bị nội dung liên hệ
                chính xác gửi tới bộ phận phụ trách thư viện.
              </Typography>

              <Stack spacing={2.25}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <TextField
                    required
                    fullWidth
                    label="Họ và tên"
                    value={formValues.fullName}
                    onChange={handleFieldChange("fullName")}
                    error={Boolean(errors.fullName)}
                    helperText={errors.fullName}
                  />
                  <TextField
                    required
                    fullWidth
                    type="email"
                    label="Email liên hệ"
                    value={formValues.email}
                    onChange={handleFieldChange("email")}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                  />
                </Box>

                <FormControl fullWidth required error={Boolean(errors.topic)}>
                  <InputLabel id="contact-topic-label">Chủ đề</InputLabel>
                  <Select
                    labelId="contact-topic-label"
                    label="Chủ đề"
                    value={formValues.topic}
                    onChange={handleFieldChange("topic")}
                  >
                    {TOPIC_OPTIONS.map((topic) => (
                      <MenuItem key={topic} value={topic}>
                        {topic}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.topic && (
                    <FormHelperText>{errors.topic}</FormHelperText>
                  )}
                </FormControl>

                <TextField
                  required
                  fullWidth
                  label="Tiêu đề"
                  placeholder="Tóm tắt ngắn gọn nội dung cần hỗ trợ..."
                  value={formValues.subject}
                  onChange={handleFieldChange("subject")}
                  error={Boolean(errors.subject)}
                  helperText={errors.subject}
                />

                <TextField
                  required
                  fullWidth
                  multiline
                  minRows={4}
                  label="Nội dung chi tiết"
                  placeholder="Nhập câu hỏi về ấn phẩm, quy trình mượn trả hoặc góp ý của bạn..."
                  value={formValues.message}
                  onChange={handleFieldChange("message")}
                  error={Boolean(errors.message)}
                  helperText={
                    errors.message ||
                    `${formValues.message.length}/${MAX_MESSAGE_LENGTH} ký tự`
                  }
                  slotProps={{ htmlInput: { maxLength: MAX_MESSAGE_LENGTH } }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  startIcon={<SendRoundedIcon />}
                  sx={{
                    py: 1.25,
                    borderRadius: "10px",
                    bgcolor: publicPalette.primary,
                    color: "#FFFFFF",
                    fontWeight: 700,
                  }}
                >
                  {submitting ? "Đang chuẩn bị..." : "Gửi liên hệ"}
                </Button>

                {preparedMail && (
                  <Alert severity="info" sx={{ borderRadius: "12px", mt: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 0.5 }}
                    >
                      Nội dung liên hệ đã được kiểm tra hợp lệ và mở qua ứng
                      dụng thư điện tử trên thiết bị của bạn.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      Hệ thống không lưu trữ giả lập khi máy chủ chưa cấu hình
                      hộp thư tiếp nhận trực tiếp. Bạn cũng có thể sao chép nội
                      dung đã chuẩn hóa dưới đây:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap" }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ContentCopyRoundedIcon />}
                        onClick={handleCopyPreparedText}
                      >
                        {copiedNotice
                          ? "Đã sao chép nội dung"
                          : "Sao chép nội dung liên hệ"}
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        component="a"
                        href={preparedMail.mailtoHref}
                      >
                        Mở lại ứng dụng Email
                      </Button>
                    </Stack>
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* 6.3 FAQ NGẮN (#faq) */}
      <Box
        id="faq"
        component="section"
        sx={{
          py: { xs: 5.5, md: 8 },
          bgcolor: publicPalette.surface,
          scrollMarginTop: "80px",
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ maxWidth: 680, mb: 4 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <HelpOutlineRoundedIcon sx={{ color: publicPalette.accent }} />
              <Typography
                variant="overline"
                sx={{
                  color: publicPalette.accentDark,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                GIẢI ĐÁP NHANH
              </Typography>
            </Stack>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontFamily: publicFonts.serif,
                fontSize: { xs: "1.55rem", md: "1.9rem" },
                mb: 1,
              }}
            >
              Câu hỏi thường gặp
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: publicPalette.textSecondary }}
            >
              Các hướng dẫn bên dưới bám sát quy trình nghiệp vụ đang vận hành
              trên hệ thống thư viện.
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            {faqItems.map((item, index) => (
              <Accordion
                key={item.question}
                defaultExpanded={index === 0}
                disableGutters
                elevation={0}
                sx={{
                  borderRadius: "12px !important",
                  border: `1px solid ${publicPalette.border}`,
                  bgcolor: publicPalette.background,
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreRoundedIcon
                      sx={{ color: publicPalette.primary }}
                    />
                  }
                  sx={{ px: 2.5, py: 0.75 }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: publicPalette.textPrimary,
                    }}
                  >
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 2.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: publicPalette.textSecondary,
                      lineHeight: 1.7,
                    }}
                  >
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>
    </PublicLayout>
  );
};

export default ContactPage;
