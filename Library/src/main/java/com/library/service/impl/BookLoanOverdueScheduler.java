package com.library.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Marks overdue loans using the same transactional batch as the ADMIN fallback. */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.loans.overdue.enabled", havingValue = "true", matchIfMissing = true)
public class BookLoanOverdueScheduler {

    private final BookLoanServiceImpl bookLoanService;

    @Scheduled(cron = "${app.loans.overdue.cron:0 5 0 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void updateOverdueLoans() {
        try {
            int updated = bookLoanService.updateOverdueBookLoansAutomatically();
            log.info("Overdue loan scan completed: {} loans updated", updated);
        } catch (Exception error) {
            log.error("Overdue loan scan failed; the transaction was rolled back. Next scheduled run will retry.", error);
        }
    }
}
