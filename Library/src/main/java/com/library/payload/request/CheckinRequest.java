package com.library.payload.request;

import com.library.domain.BookLoanStatus;
import com.library.domain.BookDamageLevel;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class CheckinRequest {

    @NotNull(message = "Mã số mượn sách là bắt buộc.")
    private Long bookLoanId;

    private BookLoanStatus condition = BookLoanStatus.RETURNED; // RETURNED, LOST, DAMAGED

    /** Ngày thư viện thực tế nhận sách; để trống thì dùng ngày hiện tại. */
    private LocalDate receivedDate;

    @jakarta.validation.constraints.Size(max = 500,
            message = "Ghi chú kiểm tra không được vượt quá 500 ký tự.")
    private String inspectionNote;

    /** Bắt buộc khi condition = DAMAGED; LIGHT = 25%, SEVERE = 75%. */
    private BookDamageLevel damageLevel;

    /**
     * ADMIN xác nhận dùng giá tham chiếu 100.000đ khi sách chưa có giá hợp lệ.
     * Backend vẫn là nơi quyết định và tính số tiền cuối cùng.
     */
    private Boolean confirmDefaultReferencePrice = false;

    /** Tên cũ được giữ để tương thích client trong thời gian chuyển tiếp. */
    @Deprecated
    @jakarta.validation.constraints.Size(max = 500)
    private String notes;
}
