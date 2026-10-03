import { AccessAlarm, Book, CheckCircle } from "@mui/icons-material";
import React from "react";

export const tabs = [
  { label: "All Reservations", icon: <Book className="w-5 h-5" /> },
  { label: "Active", icon: <AccessAlarm className="w-5 h-5" /> },
  { label: "Completed", icon: <CheckCircle className="w-5 h-5" /> },
];
