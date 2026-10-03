package com.library.modal;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.awt.print.Book;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Genre {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @NotBlank(message = "Mã thể loại là bắt buộc.")
    private String code;

    @NotBlank(message = "Tên thể loại là bắt buộc.")
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự.")
    private String description;

    @Min(value=0, message = "Thứ tự hiển thị không được là số âm.")
    private Integer displayOrder=0;

    @Column(nullable = false)
    private Boolean active=true;

    @ManyToOne
    private Genre parentGenre;

    @OneToMany
    private List<Genre> subGenres = new ArrayList<Genre>();

    // @OneToMany(mappedBy = "genre", cascade = CascadeType.PERSIST)
    // private List<Book> books=new ArrayList<Book>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
