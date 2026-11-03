package com.library.service.impl;

import com.library.mapper.SubscriptionPlanMapper;
import com.library.model.SubscriptionPlan;
import com.library.model.User;
import com.library.payload.dto.SubscriptionPlanDTO;
import com.library.repository.SubscriptionPlanRepository;
import com.library.service.SubscriptionPlanService;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {

    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionPlanMapper planMapper;
    private final UserService userService;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    public SubscriptionPlanDTO createSubscriptionPlan(SubscriptionPlanDTO planDTO) throws Exception {

        if (planRepository.existsByPlanCode(planDTO.getPlanCode())) {
            throw new Exception("Mã gói đã tồn tại.");
        }
        SubscriptionPlan plan = planMapper.toEntity(planDTO);

        User currentUser = userService.getCurrentUser();
        plan.setCreatedBy(currentUser.getFullName());
        plan.setUpdatedBy(currentUser.getFullName());
        SubscriptionPlan savedPlan = planRepository.save(plan);

        return planMapper.toDTO(savedPlan);
    }

    @Override
    public SubscriptionPlanDTO updateSubscriptionPlan(Long planId, SubscriptionPlanDTO planDTO) throws Exception {
        SubscriptionPlan existingPlan = planRepository.findById(planId).orElseThrow(
                () -> new Exception("Không tìm thấy gói dịch vụ!")
        );

        planMapper.updateEntity(existingPlan, planDTO);
        User currentUser = userService.getCurrentUser();
        existingPlan.setUpdatedBy(currentUser.getFullName());
        SubscriptionPlan updatedPlan = planRepository.save(existingPlan);
        return planMapper.toDTO(updatedPlan);
    }

    @Override
    @Transactional
    public boolean deleteSubscriptionPlan(Long planId) throws Exception {
        SubscriptionPlan existingPlan = planRepository.findById(planId).orElseThrow(
                () -> new Exception("Không tìm thấy gói dịch vụ!")
        );

        if (!planRepository.hasSubscriptionHistory(planId)) {
            planRepository.delete(existingPlan);
            return true;
        }

        if (Boolean.FALSE.equals(existingPlan.getIsActive())) {
            return false;
        }
        User currentUser = userService.getCurrentUser();
        existingPlan.setIsActive(false);
        existingPlan.setUpdatedBy(currentUser.getFullName());
        planRepository.save(existingPlan);
        return false;
    }

    @Override
    public List<SubscriptionPlanDTO> getAllSubscriptionPlan() {
        List<SubscriptionPlan> planList = planRepository.findAllPlans();

        return planList.stream().map(
                planMapper::toDTO
        ).collect(Collectors.toList());
    }

    @Override
    public List<SubscriptionPlanDTO> getAvailableSubscriptionPlans() {
        return planRepository.findSellingPlans().stream().map(planMapper::toDTO).map(plan -> {
            plan.setAdminNotes(null);
            plan.setCreatedBy(null);
            plan.setUpdatedBy(null);
            return plan;
        }).toList();
    }


    @Override
    public SubscriptionPlan getBySubscriptionPlanCode(String subscriptionPlanCode) throws Exception {
        SubscriptionPlan plan = subscriptionPlanRepository.findByPlanCode(subscriptionPlanCode);
        if (plan == null) {
            throw new Exception("Không tìm thấy gói dịch vụ!");
        }
        return plan;
    }
}
