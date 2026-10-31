import { Box, Card, CardContent, Typography } from "@mui/material";

const StatesCard = ({ bgColor, icon, value, title, subtitle, textColor }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: "#e2e8f0",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(23,105,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#102d62", lineHeight: 1 }}
          >
            {value}
          </Typography>
        </Box>

        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: "#64748b" }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatesCard;
