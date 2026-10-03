package com.library.modal;

import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @JoinColumn(name = "genre_id", nullable = false)
    @ManyToOne(optional = false)
    private Genre genre;

    @Column(length = 100)
    private String publisher;

    @Column(name = "publication_date")
    private LocalDate publishedDate;

    @Column(length = 20)
    private String language;

    private Integer pages;

    @Column(length = 2000)
    private String description;

    @Column(name = "total_copies", nullable = false)
    @Builder.Default
    private Integer totalCopies = 0;

    @Column(name = "available_copies", nullable = false)
    @Builder.Default
    private Integer availableCopies = 0;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @AssertTrue(message = "Số lượng bản hiện có không được vượt quá tổng số bản.")
    public boolean isAvailableCopesValid(){
        if(totalCopies==null || availableCopies==null){
            return true;
        }
        return availableCopies<=totalCopies;
    }
}
