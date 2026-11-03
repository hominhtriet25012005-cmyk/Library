import { Box } from "@mui/material";

/**
 * StatCardGrid - Khung lưới chứa các StatCard responsive
 *
 * @param {React.ReactNode} children - Các thẻ StatCard con
 * @param {number|Object} [columns=4] - Số cột tối đa trên màn hình lớn hoặc responsive object
 */
export const StatCardGrid = ({ children, columns = 4, sx = {} }) => {
  let gridTemplateColumns;

  if (typeof columns === "object" && columns !== null) {
    gridTemplateColumns = Object.fromEntries(
      Object.entries(columns).map(([bp, cols]) => [
        bp,
        `repeat(${cols}, minmax(0, 1fr))`,
      ]),
    );
  } else if (columns === 3) {
    gridTemplateColumns = {
      xs: "1fr",
      sm: "repeat(2, minmax(0, 1fr))",
      md: "repeat(3, minmax(0, 1fr))",
    };
  } else {
    gridTemplateColumns = {
      xs: "1fr",
      sm: "repeat(2, minmax(0, 1fr))",
      lg: "repeat(4, minmax(0, 1fr))",
    };
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns,
        gap: 2,
        mb: 3,
        width: "100%",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default StatCardGrid;
