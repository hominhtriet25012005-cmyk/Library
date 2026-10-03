import { Box, Card, CardContent, Divider } from "@mui/material";
import React from "react";

const LoanCard = ({ loan }) => {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Book Cover */}
          <Box
            sx={{
              width: 80,
              height: 120,
              borderRadius: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
              transition: "transform 0.3s",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <MenuBook sx={{ fontSize: 40, color: "white", opacity: 0.9 }} />
          </Box>

          {/* book details */}

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{loan.bookTitle}</Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Person sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {loan.bookAuthor}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <NumbersIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                ISBN: {loan.bookIsbn}
              </Typography>
            </Box>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", md: "block" } }}
          />

          {/* loan details */}

          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 2,
                mb: 2,
              }}
            >
              {/* checkout date */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                >
                  Checkout Date
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CalendarTodayIcon sx={{ fontSize: 14, color: "#667eea" }} />

                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {loan.checkoutDate}
                  </Typography>
                </Box>
              </Box>

              {/* due date */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                >
                  Due Date
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: 14, color: "#667eea" }} />

                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {loan.dueDate}
                  </Typography>
                </Box>
              </Box>

              {loan.returnDate && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                  >
                    Return Date
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AssignmentReturn sx={{ fontSize: 14, color: "#10B981" }} />

                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {loan.returnDate}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Note section */}
        {loan.notes && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(59, 130, 246, 0.05)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontStyle: "italic" }}
            >
              <strong>Note:</strong> {loan.notes}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Action buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="outlined"
            sx={{
              borderColor: "#667eea",
              color: "#667eea",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#764ba2",
                bgcolor: "rgba(102, 126, 234, 0.05)",
              },
            }}
          >
            View Book Details
          </Button>

          {loan.status === "CHECKED_OUT" && !loan.returnDate && (
            <Button
              variant="outlined"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s",
              }}
            >
              {" "}
              Return Book
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoanCard;
