package com.library.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/dashboard")
public class AdminSummaryController {
 private final JdbcTemplate jdbc;
 @GetMapping("/summary")
 @Transactional(readOnly = true)
 public Map<String,Object> summary() {
  return Map.of(
   "payments", jdbc.queryForMap("SELECT COUNT(*) AS totalCount, COALESCE(SUM(status='SUCCESS'),0) AS successCount, COALESCE(SUM(status IN ('PENDING','PROCESSING')),0) AS pendingCount, COALESCE(SUM(CASE WHEN status='SUCCESS' THEN amount ELSE 0 END),0) AS totalSuccessAmount FROM payments"),
   "fines", jdbc.queryForMap("SELECT COALESCE(SUM(status IN ('PENDING','PARTIALLY_PAID')),0) AS pendingCount, COALESCE(SUM(status='PAID'),0) AS paidCount, COALESCE(SUM(amount_paid),0) AS totalCollected, COALESCE(SUM(CASE WHEN status IN ('PENDING','PARTIALLY_PAID') THEN GREATEST(amount-amount_paid,0) ELSE 0 END),0) AS totalDebt FROM fines"),
   "reviews", jdbc.queryForMap("SELECT COUNT(*) AS totalCount, COALESCE(SUM(is_active=1),0) AS activeCount, COALESCE(SUM(is_active=0),0) AS hiddenCount, COALESCE(ROUND(AVG(rating),1),0) AS avgRating FROM book_reviews"),
   "loans", jdbc.queryForMap("SELECT COUNT(*) AS totalLoans, COALESCE(SUM(status IN ('CHECKED_OUT','OVERDUE') AND due_date<CURRENT_DATE),0) AS overdueLoans, COALESCE(SUM(status='CHECKED_OUT'),0) AS checkedOutCount, COALESCE(SUM(status='RETURNED'),0) AS returnedCount, COALESCE(SUM(status IN ('DAMAGED','LOST')),0) AS damagedOrLostCount FROM book_loans")
  );
 }
}
