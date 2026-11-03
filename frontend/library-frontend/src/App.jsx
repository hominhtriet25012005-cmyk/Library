import "./App.css";
import Dashboard from "./pages/Dashboard/Dashboard";
import { Route, Routes } from "react-router";
import { Navigate } from "react-router-dom";
import UserLayout from "./pages/UserLayout/UserLayout";
import BookPage from "./pages/Book/BookPage";
import BookDetailPage from "./pages/Book/BookDetailPage";
import WishlistPage, {
  WishlistPreviewPage,
} from "./pages/Wishlist/WishlistPage";
import { WishlistProvider } from "./wishlist/WishlistProvider";
import MyLoans from "./pages/MyLoans/MyLoans";
import MyReservation from "./pages/My Reservation/MyReservation";
import { RequireRole } from "./auth/RequireRole";
import {
  ComingSoonPage,
  ForbiddenPage,
  LandingPage,
  NotFoundPage,
} from "./pages/RoutePages";
import AdminLayout from "./pages/AdminLayout/AdminLayout";
import AdminDashboard from "./pages/AdminLayout/AdminDashboard";
import AdminBooksPage from "./pages/AdminLayout/AdminBooksPage";
import AdminGenresPage from "./pages/AdminLayout/AdminGenresPage";
import AdminUsersPage from "./pages/AdminLayout/AdminUsersPage";
import AdminLoansPage from "./pages/AdminLayout/AdminLoansPage";
import AdminReservationsPage from "./pages/AdminLayout/AdminReservationsPage";
import {
  AdminSubscriptionPlansPage,
  AdminSubscriptionMembersPage,
} from "./pages/AdminLayout/AdminSubscriptionsPage";
import AdminFinesPage from "./pages/AdminLayout/AdminFinesPage";
import AdminPaymentsPage from "./pages/AdminLayout/AdminPaymentsPage";
import AdminReviewsPage from "./pages/AdminLayout/AdminReviewsPage";
import AdminStagePage from "./pages/AdminLayout/AdminStagePage";
import { adminNavigationSections } from "./pages/AdminLayout/adminNavigation";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import ProfilePage from "./pages/Auth/ProfilePage";
import SubscriptionsPage from "./pages/Subscriptions/SubscriptionsPage.jsx";
import FinesPage from "./pages/Fines/FinesPage.jsx";
import PaymentPage from "./pages/Payments/PaymentPage.jsx";
import UserSettingsPage from "./pages/UserSettings/UserSettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route path="/demo" element={<UserLayout preview />}>
        <Route index element={<Dashboard preview />} />
        <Route path="books" element={<BookPage preview />} />
        <Route path="wishlist" element={<WishlistPreviewPage />} />
        <Route path="my-loans" element={<MyLoans preview />} />
        <Route path="my-reservations" element={<MyReservation preview />} />
      </Route>

      <Route element={<RequireRole role={["ROLE_USER", "ROLE_ADMIN"]} />}>
        <Route
          path="/user"
          element={
            <WishlistProvider>
              <UserLayout />
            </WishlistProvider>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BookPage />} />
          <Route path="books/:id" element={<BookDetailPage />} />
          <Route path="my-loans" element={<MyLoans />} />
          <Route path="my-reservations" element={<MyReservation />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="my-fines" element={<FinesPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="payments/result" element={<PaymentPage returned />} />
          <Route path="payments/:paymentId" element={<PaymentPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="settings" element={<UserSettingsPage />} />
        </Route>
      </Route>
      <Route element={<RequireRole role="ROLE_ADMIN" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="books" element={<AdminBooksPage />} />
          <Route path="genres" element={<AdminGenresPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="loans" element={<AdminLoansPage />} />
          <Route path="reservations" element={<AdminReservationsPage />} />
          <Route path="fines" element={<AdminFinesPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          {adminNavigationSections
            .flatMap((section) => section.items)
            .filter(
              (item) =>
                ![
                  "/admin/dashboard",
                  "/admin/books",
                  "/admin/genres",
                  "/admin/users",
                  "/admin/loans",
                  "/admin/reservations",
                  "/admin/reviews",
                  "/admin/subscriptions",
                  "/admin/fines",
                  "/admin/payments",
                ].includes(item.path),
            )
            .map((item) => (
              <Route
                key={item.path}
                path={item.path.slice("/admin/".length)}
                element={<AdminStagePage page={item} />}
              />
            ))}
          <Route
            path="subscriptions"
            element={<Navigate to="/admin/subscriptions/plans" replace />}
          />
          <Route
            path="subscriptions/plans"
            element={<AdminSubscriptionPlansPage />}
          />
          <Route
            path="subscriptions/members"
            element={<AdminSubscriptionMembersPage />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="/books" element={<Navigate to="/user/books" replace />} />
      <Route
        path="/my-loans"
        element={<Navigate to="/user/my-loans" replace />}
      />
      <Route
        path="/my-reservations"
        element={<Navigate to="/user/my-reservations" replace />}
      />
      <Route
        path="/profile"
        element={<Navigate to="/user/profile" replace />}
      />
      <Route
        path="/my-fines"
        element={<Navigate to="/user/my-fines" replace />}
      />
      <Route
        path="/subscriptions"
        element={<Navigate to="/user/subscriptions" replace />}
      />
      <Route
        path="/wishlist"
        element={<Navigate to="/user/wishlist" replace />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
