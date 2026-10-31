package com.library;

import com.library.domain.UserRole;
import com.library.modal.Subscription;
import com.library.modal.SubscriptionPlan;
import com.library.modal.User;
import com.library.repository.SubscriptionPlanRepository;
import com.library.repository.SubscriptionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:ad6;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AdminMembershipRepositoryTests {
    @Autowired EntityManager em;
    @Autowired SubscriptionPlanRepository plans;
    @Autowired SubscriptionRepository subscriptions;

    @Test void catalogVisibilityAndSubscriptionFiltersWorkAtDatabaseLevel() {
        var selling = plan("AD6_ACTIVE", true, 1);
        var stopped = plan("AD6_STOPPED", false, 2);
        User user = User.builder().email("ad6@example.test").fullName("AD6 user")
                .role(UserRole.ROLE_USER).build();
        em.persist(user);
        subscription(user, selling, true);
        subscription(user, stopped, false);
        em.flush(); em.clear();

        assertEquals(1, plans.findSellingPlans().size());
        assertEquals(2, plans.findAllPlans().size());
        var found = subscriptions.searchAdminSubscriptions(user.getId(), selling.getId(), true,
                PageRequest.of(0, 1));
        assertEquals(1, found.getTotalElements());
        assertEquals(selling.getId(), found.getContent().get(0).getPlan().getId());
        assertEquals(2, subscriptions.searchAdminSubscriptions(null, null, null, PageRequest.of(0, 1)).getTotalElements());
    }

    private SubscriptionPlan plan(String code, boolean active, int order) {
        var plan = SubscriptionPlan.builder().planCode(code).name(code)
                .durationDays(30).price(new BigDecimal("100000"))
                .currency("VND").maxBooksAllowed(3).maxDaysPerBook(14)
                .displayOrder(order).isActive(active).build();
        em.persist(plan);
        return plan;
    }

    private void subscription(User user, SubscriptionPlan plan, boolean active) {
        var entry = Subscription.builder().user(user).plan(plan).isActive(active)
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(30))
                .price(100000L).currency("VND").maxBooksAllowed(3).maxDaysPerBook(14).build();
        em.persist(entry);
    }
}
