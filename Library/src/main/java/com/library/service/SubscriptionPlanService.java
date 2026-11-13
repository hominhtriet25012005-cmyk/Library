package com.library.service;

import com.library.model.SubscriptionPlan;
import com.library.payload.dto.SubscriptionPlanDTO;

import java.util.List;

public interface SubscriptionPlanService {

    SubscriptionPlanDTO createSubscriptionPlan(SubscriptionPlanDTO planDTO);


    SubscriptionPlanDTO updateSubscriptionPlan(Long planId, SubscriptionPlanDTO planDTO);

    /**
     * Permanently deletes a plan that has no subscription history.
     * Throws a business conflict when history exists, without changing the plan or its history.
     *
     * @return true after the plan row is deleted
     */
    boolean deleteSubscriptionPlan(Long planId);

    List<SubscriptionPlanDTO> getAllSubscriptionPlan();

    List<SubscriptionPlanDTO> getAvailableSubscriptionPlans();

    SubscriptionPlan getBySubscriptionPlanCode(String subscriptionPlanCode);

}
