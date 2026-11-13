package com.library.support;

import com.library.exception.InvalidPaginationException;
import org.springframework.data.domain.Sort;

import java.util.Set;

/** Shared validation rules for public paginated API requests. */
public final class PaginationRules {

    public static final int MAX_PAGE_SIZE = 100;

    private PaginationRules() {
    }

    public static void validatePageAndSize(Integer page, Integer size) {
        if (page == null || page < 0) {
            throw new InvalidPaginationException("Số trang phải là số nguyên lớn hơn hoặc bằng 0.");
        }
        if (size == null || size < 1 || size > MAX_PAGE_SIZE) {
            throw new InvalidPaginationException("Số dòng mỗi trang phải từ 1 đến 100.");
        }
    }

    public static String validatedSortField(String requestedField,
                                            String defaultField,
                                            Set<String> allowedFields) {
        String field = requestedField == null || requestedField.isBlank()
                ? defaultField
                : requestedField.trim();

        if (!allowedFields.contains(field)) {
            throw new InvalidPaginationException("Trường sắp xếp không được hỗ trợ.");
        }
        return field;
    }

    public static Sort.Direction validatedSortDirection(String requestedDirection,
                                                         String defaultDirection) {
        String direction = requestedDirection == null || requestedDirection.isBlank()
                ? defaultDirection
                : requestedDirection.trim();

        if ("ASC".equalsIgnoreCase(direction)) {
            return Sort.Direction.ASC;
        }
        if ("DESC".equalsIgnoreCase(direction)) {
            return Sort.Direction.DESC;
        }
        throw new InvalidPaginationException("Chiều sắp xếp chỉ nhận ASC hoặc DESC.");
    }
}
