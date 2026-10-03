package com.library.modal;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "genres")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Genre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Mã thể loại là bắt buộc.")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Tên thể loại là bắt buộc.")
    @Column(nullable = false, length = 100)
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự.")
    @Column(length = 500)
    private String description;

    @Min(value=0, message = "Thứ tự hiển thị không được là số âm.")
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder=0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active=true;

    @ManyToOne
    @JoinColumn(name = "parent_genre_id")
    private Genre parentGenre;

    @OneToMany(mappedBy = "parentGenre")
    @Builder.Default
    private List<Genre> subGenres = new ArrayList<Genre>();

    // @OneToMany(mappedBy = "genre", cascade = CascadeType.PERSIST)
    // private List<Book> books=new ArrayList<Book>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
