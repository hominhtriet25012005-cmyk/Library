package com.library.payload.response;

import com.library.domain.FineType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinFinePreviewResponse {

    private Long bookLoanId;
    private Integer overdueDays;
    private Long referencePrice;
    private Boolean usesDefaultReferencePrice;
    private Boolean requiresDefaultReferencePriceConfirmation;

    @Builder.Default
    private List<Item> items = new ArrayList<>();

    private Long totalAmount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private FineType type;
        private String label;
        private Long amount;
        private String reason;
    }
}
