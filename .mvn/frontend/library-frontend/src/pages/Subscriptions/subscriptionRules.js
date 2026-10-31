export const availablePlans = (plans) =>
  plans
    .filter(
      (plan) =>
        plan.isActive === true &&
        plan.currency === "VND" &&
        Number(plan.price) > 0,
    )
    .sort(
      (a, b) =>
        (a.displayOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.displayOrder ?? Number.MAX_SAFE_INTEGER) ||
        Number(a.id) - Number(b.id),
    );

export const canCancelSubscription = (subscription) =>
  subscription?.isActive === true && subscription?.isValid === true;
