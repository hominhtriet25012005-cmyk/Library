package com.library;

import com.library.model.User;
import jakarta.persistence.Column;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class UserLocalAuthenticationMappingTests {

    @Test
    void userMappingOnlyKeepsLocalAuthenticationFields() throws Exception {
        Set<String> fields = Arrays.stream(User.class.getDeclaredFields())
                .map(java.lang.reflect.Field::getName)
                .collect(Collectors.toSet());

        assertThat(fields).doesNotContain("authProvider", "googleId");

        Column passwordColumn = User.class.getDeclaredField("password").getAnnotation(Column.class);
        assertThat(passwordColumn).isNotNull();
        assertThat(passwordColumn.nullable()).isFalse();
        assertThat(passwordColumn.length()).isEqualTo(255);
    }
}
