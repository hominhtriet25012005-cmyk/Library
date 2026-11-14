package com.library.service.impl;

import com.library.domain.BookLoanStatus;
import com.library.domain.NotificationEventType;
import com.library.model.BookLoan;
import com.library.model.Reservation;
import com.library.model.Subscription;
import com.library.repository.BookLoanRepository;
import com.library.repository.ReservationRepository;
import com.library.repository.SubscriptionRepository;
import com.library.service.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationReminderScheduler {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final BookLoanRepository bookLoanRepository;
    private final ReservationRepository reservationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationPublisher notificationPublisher;

    @Scheduled(
            fixedDelayString = "${app.notifications.reminder-scan-delay-ms:3600000}",
            initialDelayString = "${app.notifications.reminder-scan-initial-delay-ms:60000}")
    public void createDueReminders() {
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        LocalDate today = now.toLocalDate();

        publishLoanReminders(today.plusDays(3), NotificationEventType.LOAN_DUE_SOON,
                "Sắp đến hạn trả sách", "Còn 3 ngày đến hạn trả sách");
        publishLoanReminders(today, NotificationEventType.LOAN_DUE_TODAY,
                "Hôm nay là hạn trả sách", "Hôm nay là hạn trả sách");
        publishPickupReminders(now);
        publishMembershipReminders(today.plusDays(3));
    }

    private void publishLoanReminders(
            LocalDate dueDate,
            NotificationEventType eventType,
            String title,
            String messagePrefix) {
        List<BookLoan> loans = bookLoanRepository.findByDueDateAndStatusIn(
                dueDate, List.of(BookLoanStatus.CHECKED_OUT));
        for (BookLoan loan : loans) {
            if (loan.isReturnPending()) {
                continue;
            }
            notificationPublisher.publish(
                    loan.getUser().getId(),
                    null,
                    eventType,
                    title,
                    messagePrefix + " “" + loan.getBook().getTitle() + "” (" + dueDate + ").",
                    "/user/my-loans",
                    "BOOK_LOAN",
                    loan.getId(),
                    "DUE:" + dueDate);
        }
    }

    private void publishPickupReminders(LocalDateTime now) {
        for (Reservation reservation : reservationRepository.findPickupExpiringReservations(
                now, now.plusHours(24))) {
            notificationPublisher.publish(
                    reservation.getUser().getId(),
                    null,
                    NotificationEventType.RESERVATION_PICKUP_EXPIRING,
                    "Sắp hết hạn nhận sách đặt giữ",
                    "Thời hạn nhận sách “" + reservation.getBook().getTitle()
                            + "” sẽ kết thúc trong vòng 24 giờ.",
                    "/user/my-reservations",
                    "RESERVATION",
                    reservation.getId(),
                    null);
        }
    }

    private void publishMembershipReminders(LocalDate endDate) {
        for (Subscription subscription : subscriptionRepository.findActiveSubscriptionsEndingOn(endDate)) {
            notificationPublisher.publish(
                    subscription.getUser().getId(),
                    null,
                    NotificationEventType.MEMBERSHIP_EXPIRING,
                    "Gói thành viên sắp hết hạn",
                    "Gói “" + subscription.getPlanName() + "” sẽ hết hạn vào ngày "
                            + endDate + ".",
                    "/user/subscriptions",
                    "SUBSCRIPTION",
                    subscription.getId(),
                    "END:" + endDate);
        }
    }
}
