import React from "react";
import "./App.css";
import Dashboard from "./pages/Dashboard/Dashboard";
import { Route, Routes } from "react-router";
import UserLayout from "./pages/UserLayout/UserLayout";
import BookPage from "./pages/Book/BookPage";
import MyLoans from "./pages/MyLoans/MyLoans";
import MyReservation from "./pages/MyReservation/MyReservation";

function App() {
  return (
    <>
      <Routes>
        {/* user routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<BookPage />} />
          <Route path="/my-loans" element={<MyLoans />} />
          <Route path="/my-reservations" element={<MyReservation />} />
          <Route path="/my-fines" element={<Dashboard />} />
          <Route path="/subscriptions" element={<Dashboard />} />
          <Route path="/wishlist" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
