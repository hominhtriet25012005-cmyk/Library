package com.library;

import com.library.exception.InvalidPaginationException;
import com.library.support.PaginationRules;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PaginationRulesTests {

    @Test
    void acceptsFirstAndMaximumSupportedPageSizes() {
        PaginationRules.validatePageAndSize(0, 1);
        PaginationRules.validatePageAndSize(25, 100);
    }

    @Test
    void rejectsNegativeOrMissingPageAndPageSizesOutsideOneToOneHundred() {
        assertThrows(InvalidPaginationException.class, () -> PaginationRules.validatePageAndSize(-1, 10));
        assertThrows(InvalidPaginationException.class, () -> PaginationRules.validatePageAndSize(null, 10));
        assertThrows(InvalidPaginationException.class, () -> PaginationRules.validatePageAndSize(0, null));
        assertThrows(InvalidPaginationException.class, () -> PaginationRules.validatePageAndSize(0, 0));
        assertThrows(InvalidPaginationException.class, () -> PaginationRules.validatePageAndSize(0, 101));
    }

    @Test
    void sortFieldMustComeFromTheEndpointAllowlist() {
        assertEquals("createdAt", PaginationRules.validatedSortField(null, "createdAt", Set.of("createdAt", "title")));
        assertEquals("title", PaginationRules.validatedSortField(" title ", "createdAt", Set.of("createdAt", "title")));
        assertThrows(InvalidPaginationException.class,
                () -> PaginationRules.validatedSortField("user.password", "createdAt", Set.of("createdAt", "title")));
    }

    @Test
    void sortDirectionOnlyAcceptsAscOrDesc() {
        assertEquals(Sort.Direction.ASC, PaginationRules.validatedSortDirection("asc", "DESC"));
        assertEquals(Sort.Direction.DESC, PaginationRules.validatedSortDirection(null, "DESC"));
        assertThrows(InvalidPaginationException.class,
                () -> PaginationRules.validatedSortDirection("sideways", "DESC"));
    }
}
