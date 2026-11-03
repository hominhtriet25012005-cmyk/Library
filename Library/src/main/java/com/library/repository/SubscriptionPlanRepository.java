package com.library.repository;

import com.library.model.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    Boolean existsByPlanCode(String planCode);

    SubscriptionPlan findByPlanCode(String planCode);

    @Query("select p from SubscriptionPlan p where p.isActive = true order by p.displayOrder asc, p.id asc")
    List<SubscriptionPlan> findSellingPlans();

    @Query("select p from SubscriptionPlan p order by p.displayOrder asc, p.id asc")
    List<SubscriptionPlan> findAllPlans();

    @Query("select case when count(s) > 0 then true else false end "
            + "from Subscription s where s.plan.id = :planId")
    boolean hasSubscriptionHistory(@org.springframework.data.repository.query.Param("planId") Long planId);


}
