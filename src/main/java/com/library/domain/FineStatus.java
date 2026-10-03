package com.library.domain;

public enum FineStatus {

    PENDING,

    /**
     * Fine has been partially paid
     */
    PARTIALLY_PAID,

    /**
     * Fine has been fully paid
     */
    PAID,

    /**
     * Fine has been waived by an administrator
     */
    WAIVED
}
