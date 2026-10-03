import { Card, CardContent } from "@mui/material";
import React from "react";

const StatesCard = ({ bgColor, icon, value, title, subtitle, textColor }) => {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
          <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
        </div>

        <p className="text-gray-700 font-semibold mb-1">{title}</p>
        <p>{subtitle}</p>
      </CardContent>
    </Card>
  );
};

export default StatesCard;
