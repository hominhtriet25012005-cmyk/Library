package com.library;

import com.library.domain.UserRole;
import com.library.model.Book;
import com.library.model.BookReview;
import com.library.model.Genre;
import com.library.model.User;
import com.library.repository.BookReviewRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:ad8;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AdminReviewsRepositoryTests {
    @Autowired EntityManager em;
    @Autowired BookReviewRepository reviews;

    @Test void adminCanFilterHiddenButPublicBookQueryCannotSeeThem() {
        var genre = Genre.builder().code("AD8_TEST").name("AD8 genre").build();
        em.persist(genre);
        var book = Book.builder().isbn("AD8ISBN0001").title("AD8 book")
                .author("Author").genre(genre).build();
        em.persist(book);
        var visibleUser = User.builder().email("ad8a@example.test").fullName("Visible")
                .password("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .role(UserRole.ROLE_USER).build();
        var hiddenUser = User.builder().email("ad8b@example.test").fullName("Hidden")
                .password("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .role(UserRole.ROLE_USER).build();
        em.persist(visibleUser); em.persist(hiddenUser);
        em.persist(BookReview.builder().user(visibleUser).book(book).rating(4)
                .reviewText("Visible review text").isActive(true).build());
        em.persist(BookReview.builder().user(hiddenUser).book(book).rating(2)
                .reviewText("Hidden review text").isActive(false).build());
        em.flush(); em.clear();

        var page = PageRequest.of(0, 10, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        assertEquals(2, reviews.searchAdminReviews(null, book.getId(), null, page).getTotalElements());
        assertEquals(1, reviews.searchAdminReviews(hiddenUser.getId(), book.getId(), false, page).getTotalElements());
        assertEquals(1, reviews.findActiveByBook(book, page).getTotalElements());
    }
}
