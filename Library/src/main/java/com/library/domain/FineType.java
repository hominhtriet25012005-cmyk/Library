package com.library.domain;

public enum FineType {

    OVERDUE,

    /**
     * Tiền phạt đối với sách bị hư hại
     */
    DAMAGE,

    /**
     * Tiền phạt đối với sách bị mất (chi phí thay thế)
     */
    LOSS,

    /**
     * Phí xử lý hoặc phí hành chính
     */
    PROCESSING
}
