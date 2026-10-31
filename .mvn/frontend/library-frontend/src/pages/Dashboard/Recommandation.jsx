import { Box, Typography } from "@mui/material";
import RecommendRoundedIcon from "@mui/icons-material/RecommendRounded";
import { EmptyState } from "../../components/common";

const Recommandation = ({ preview = false }) => {
  return (
    <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 750, color: "#102d62", mb: 2.5 }}
      >
        Gợi ý sách hay dành riêng cho bạn
      </Typography>

      <EmptyState
        icon={RecommendRoundedIcon}
        title="Tính năng gợi ý sách thông minh"
        description="Hệ thống đang tổng hợp sở thích đọc và thể loại sách bạn yêu thích để đưa ra những đề xuất phù hợp nhất."
        actionText="Xem tất cả sách"
        actionTo={preview ? "/demo/books" : "/user/books"}
      />
    </Box>
  );
};

export default Recommandation;
