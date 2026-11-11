import "./App.css";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { Navigate } from "react-router-dom";
import UserLayout from "./pages/UserLayout/UserLayout";
import AdminLayout from "./pages/AdminLayout/AdminLayout";
import PageLoader from "./components/PageLoader";
import { WishlistProvider } from "./wishlist/WishlistProvider";
import { RequireRole } from "./auth/RequireRole";
import { adminNavigationSections } from "./pages/AdminLayout/adminNavigation";
import { ForbiddenPage, LandingPage, NotFoundPage } from "./pages/RoutePages";

// User Pages (Lazy Chunks)
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const BookPage = lazy(() => import("./pages/Book/BookPage"));
const BookDetailPage = lazy(() => import("./pages/Book/BookDetailPage"));
const WishlistPage = lazy(() => import("./pages/Wishlist/WishlistPage"));
const WishlistPreviewPage = lazy(() =>
  import("./pages/Wishlist/WishlistPage").then((m) => ({
    default: m.WishlistPreviewPage,
  })),
);
const MyLoans = lazy(() => import("./pages/MyLoans/MyLoans"));
const MyReservation = lazy(
  () => import("./pages/MyReservations/MyReservation"),
);
const ProfilePage = lazy(() => import("./pages/Auth/ProfilePage"));
const SubscriptionsPage = lazy(
  () => import("./pages/Subscriptions/SubscriptionsPage.jsx"),
);
const FinesPage = lazy(() => import("./pages/Fines/FinesPage.jsx"));
const PaymentPage = lazy(() => import("./pages/Payments/PaymentPage.jsx"));
const UserSettingsPage = lazy(
  () => import("./pages/UserSettings/UserSettingsPage"),
);

// Auth Pages (Lazy Chunks)
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("./pages/Auth/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("./pages/Auth/ResetPasswordPage"));

// Admin Pages (Lazy Chunks)
const AdminDashboard = lazy(() => import("./pages/AdminLayout/AdminDashboard"));
const AdminBooksPage = lazy(() => import("./pages/AdminLayout/AdminBooksPage"));
const AdminGenresPage = lazy(
  () => import("./pages/AdminLayout/AdminGenresPage"),
);
const AdminUsersPage = lazy(() => import("./pages/AdminLayout/AdminUsersPage"));
const AdminLoansPage = lazy(() => import("./pages/AdminLayout/AdminLoansPage"));
const AdminReservationsPage = lazy(
  () => import("./pages/AdminLayout/AdminReservationsPage"),
);
const AdminSubscriptionPlansPage = lazy(() =>
  import("./pages/AdminLayout/AdminSubscriptionsPage").then((m) => ({
    default: m.AdminSubscriptionPlansPage,
  })),
);
const AdminSubscriptionMembersPage = lazy(() =>
  import("./pages/AdminLayout/AdminSubscriptionsPage").then((m) => ({
    default: m.AdminSubscriptionMembersPage,
  })),
);
const AdminFinesPage = lazy(() => import("./pages/AdminLayout/AdminFinesPage"));
const AdminPaymentsPage = lazy(
  () => import("./pages/AdminLayout/AdminPaymentsPage"),
);
const AdminReviewsPage = lazy(
  () => import("./pages/AdminLayout/AdminReviewsPage"),
);
const AdminStagePage = lazy(() => import("./pages/AdminLayout/AdminStagePage"));

function App() {
  return (
    <Suspense fallback={<PageLoader minHeight="100vh" />}>
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
    </Suspense>
  );
}

export default App;
