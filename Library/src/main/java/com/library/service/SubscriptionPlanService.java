package com.library.service;

import com.library.model.SubscriptionPlan;
import com.library.payload.dto.SubscriptionPlanDTO;

import java.util.List;

public interface SubscriptionPlanService {

    SubscriptionPlanDTO createSubscriptionPlan(SubscriptionPlanDTO planDTO) throws Exception;


    SubscriptionPlanDTO updateSubscriptionPlan(Long planId, SubscriptionPlanDTO planDTO) throws Exception;

    /**
     * Deletes a never-used plan permanently; otherwise only stops selling it.
     *
     * @return true when the row was permanently deleted, false when it was kept for history
     */
    boolean deleteSubscriptionPlan(Long planId) throws Exception;

    List<SubscriptionPlanDTO> getAllSubscriptionPlan();

    List<SubscriptionPlanDTO> getAvailableSubscriptionPlans();

    SubscriptionPlan getBySubscriptionPlanCode(String subscriptionPlanCode) throws Exception;

}
