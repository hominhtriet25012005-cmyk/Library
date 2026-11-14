# HỆ THỐNG QUẢN LÝ THƯ VIỆN CHUẨN PRODUCTION (JAVA FULL-STACK)

# Hệ thống Quản lý Thư viện (Java Full-Stack)

> **Lưu ý khi đọc bản dịch:** Các tên kỹ thuật như tên class/entity, tên field JSON, endpoint API, HTTP method, enum, tên bảng, tên framework và đoạn code được giữ nguyên để không làm thay đổi ý nghĩa kỹ thuật hoặc gây lỗi khi áp dụng vào project. Phần thuyết minh, tiêu đề và mô tả được chuyển sang tiếng Việt.

# Dữ liệu JSON mẫu

## Books (Sách)

```jsx
{
  "id": 1,
  "isbn": "978-3-16-148410-0",
  "title": "The Art of Java Development",
  "author": "Ashok Zarmariya",
  "genre": "PROGRAMMING",
  "publisher": "Zosh Publications",
  "publicationDate": "2023-05-15",
  "language": "English",
  "pages": 420,
  "description": "A comprehensive guide to mastering Java programming, covering modern practices, frameworks, and real-world applications.",
  "totalCopies": 50,
  "availableCopies": 30,
  "price": 499.99,
  "coverImageUrl": "https://example.com/images/the-art-of-java-development.jpg",
  "active": true
}
```

## Book Loan (Mượn sách)

## Genre (Thể loại)

```jsx
{
  "code": "FICTION",
  "name": "Fiction",
  "description": "Genre that includes imaginative or invented stories, often exploring characters, plots, and themes not based on real events.",
  "displayOrder": 1,
  "active": true,
  "parentGenreId": null,
  "parentGenreName": null
},

// dùng cho chức năng sách
"subGenres": [
  {
    "code": "MANAGEMENT",
    "name": "Management",
    "description": "Books on strategic planning, leadership, and organizational management principles.",
    "displayOrder": 1,
    "active": true,
    "parentGenreId": 1
  },
  {
    "code": "HUMAN_RESOURCES",
    "name": "Human Resources",
    "description": "Covers employee management, organizational behavior, and HR development topics.",
    "displayOrder": 2,
    "active": true,
    "parentGenreId": 1
  },
  {
    "code": "FINANCE",
    "name": "Finance",
    "description": "Includes books related to corporate finance, investment, accounting, and financial planning.",
    "displayOrder": 3,
    "active": true,
    "parentGenreId": 1
  },
  {
    "code": "MARKETING",
    "name": "Marketing",
    "description": "Focuses on marketing strategies, consumer behavior, branding, and advertising techniques.",
    "displayOrder": 4,
    "active": true,
    "parentGenreId": 1
  },
  {
    "code": "OPERATIONS",
    "name": "Operations",
    "description": "Covers production management, logistics, supply chain optimization, and process improvement.",
    "displayOrder": 5,
    "active": true,
    "parentGenreId": 1
  }
]
```

## Subscription Plan (Gói thành viên)

```jsx
{
  "id": 1,
  "planCode": "GOLD_001",
  "name": "Gold Membership",
  "description": "Ideal for avid readers — extended checkout duration and more book access.",
  "durationDays": 90,
  "price": 30000,
  "currency": "VND",
  "maxBooksAllowed": 5,
  "maxDaysPerBook": 21,
  "displayOrder": 1,
  "isActive": true,
  "isFeatured": true,
  "badgeText": "Most Popular",
  "adminNotes": "This plan is performing well in mid-tier subscribers.",
  "priceInMajorUnits": 30000,
  "monthlyEquivalentPrice": 10000,
  "createdAt": "2025-10-10T12:00:00",
  "updatedAt": "2025-10-10T12:00:00",
  "createdBy": "admin",
  "updatedBy": "admin"
}

{
  "id": 2,
  "planCode": "PLATINUM_001",
  "name": "Platinum Membership",
  "description": "Premium access with maximum borrowing limits, faster checkouts, and priority support.",
  "durationDays": 180,
  "price": 150000,
  "currency": "VND",
  "maxBooksAllowed": 10,
  "maxDaysPerBook": 30,
  "displayOrder": 2,
  "isActive": true,
  "isFeatured": true,
  "badgeText": "Best Value",
  "adminNotes": "Top-tier subscription with strong retention.",
  "priceInMajorUnits": 150000,
  "monthlyEquivalentPrice": 25000,
  "createdAt": "2025-10-10T12:00:00",
  "updatedAt": "2025-10-10T12:00:00",
  "createdBy": "admin",
  "updatedBy": "admin"
}
```

# LLD – Thiết kế mức thấp

# 1. BOOK – SÁCH

## 📚 Tổng quan

Module **Book** là thành phần cốt lõi của Hệ thống Quản lý Thư viện, chịu trách nhiệm xử lý toàn bộ vòng đời của sách trong danh mục thư viện. Module cung cấp đầy đủ chức năng quản lý tồn kho sách, tìm kiếm và theo dõi tình trạng có sẵn của sách.

## 🎯 Chức năng

### 1. Quản lý danh mục sách

- Tạo một sách hoặc nhiều sách cùng lúc (bulk operation).
- Cập nhật thông tin sách.
- Xóa mềm (đánh dấu không hoạt động) hoặc xóa vĩnh viễn sách.
- Theo dõi số lượng và tình trạng sách có thể mượn.

### 2. Tìm kiếm và khám phá

- Tìm kiếm đơn giản theo ID hoặc ISBN.
- Tìm kiếm nâng cao bằng nhiều bộ lọc như tên sách, tác giả, thể loại và tình trạng còn sách.
- Hỗ trợ phân trang và sắp xếp.
- Tìm kiếm dạng văn bản trên tên sách, tác giả và ISBN.

### 3. Theo dõi tồn kho

- Quản lý tổng số bản sách.
- Theo dõi số bản hiện có thể cho mượn.
- Tự động kiểm tra để đảm bảo số bản có thể mượn không vượt quá tổng số bản.

### 4. Thống kê và phân tích

- Đếm tổng số sách đang hoạt động.
- Đếm tổng số sách hiện có thể mượn.
- Cung cấp thông tin tồn kho theo thời gian thực.

## 📊 Mô hình dữ liệu

### Entity `Book`

**Tên bảng:** `books`

| Field | Type | Bắt buộc | Ràng buộc | Mô tả |
| --- | --- | --- | --- | --- |
| `id` | Long | Auto | Primary Key | Mã định danh duy nhất của sách |
| `isbn` | String(20) | ✅ | Unique, ISBN format | Mã ISBN quốc tế của sách |
| `title` | String(255) | ✅ | 1-255 chars | Tên sách |
| `author` | String(255) | ✅ | 1-255 chars | Tên tác giả |
| `genre` | Genre | ✅ | Foreign Key | Thể loại/danh mục sách |
| `publisher` | String(100) | ❌ | Max 100 chars | Nhà xuất bản |
| `publicationDate` | LocalDate | ❌ | - | Ngày xuất bản |
| `language` | String(20) | ❌ | Max 20 chars | Ngôn ngữ của sách |
| `pages` | Integer | ❌ | 1-50000 | Số trang |
| `description` | String(2000) | ❌ | Max 2000 chars | Mô tả sách |
| `totalCopies` | Integer | ✅ | >= 0 | Tổng số bản sách thư viện sở hữu |
| `availableCopies` | Integer | ✅ | >= 0, <= totalCopies | Số bản hiện có thể cho mượn |
| `price` | BigDecimal(10,2) | ❌ | >= 0, 8 digits.2 decimals | Giá sách |
| `coverImageUrl` | String(500) | ❌ | Max 500 chars | URL ảnh bìa |
| `active` | Boolean | ✅ | Default: true | Cờ phục vụ xóa mềm |
| `createdAt` | LocalDateTime | Auto | Immutable | Thời điểm tạo |
| `updatedAt` | LocalDateTime | Auto | - | Thời điểm cập nhật gần nhất |

### Quan hệ

- **Book → Genre**: quan hệ Many-to-One, tức là mỗi sách thuộc về một thể loại.

## 🔌 API Endpoint

### Base URL

`/api/books`

### 1. Tạo sách

**Endpoint:** `POST /api/books`

**Mô tả:** Tạo một sách mới trong danh mục.

**Request Body:**

```jsx
{
  "isbn": "978-3-16-148410-0",
  "title": "The Art of Java Development",
  "author": "Ashok Zarmariya",
  "genre": "PROGRAMMING",
  "publisher": "Zosh Publications",
  "publicationDate": "2023-05-15",
  "language": "English",
  "pages": 420,
  "description": "A comprehensive guide to mastering Java programming, covering modern practices, frameworks, and real-world applications.",
  "totalCopies": 1,
  "availableCopies": 1,
  "price": 499.99,
  "coverImageUrl": "https://images.pexels.com/photos/4058794/pexels-photo-4058794.jpeg",
  "active": true
}
```

### 2. Tạo nhiều sách cùng lúc

**Endpoint:** `POST /api/books/bulk`

**Mô tả:** Tạo nhiều sách trong một request duy nhất (batch operation).

**Request Body:**

```jsx
[
  {
    "isbn": "978-1-250-80311-8",
    "title": "Principles of Corporate Finance",
    "author": "Richard A. Brealey",
    "genreId": 7,
    "publisher": "McGraw-Hill Education",
    "publicationDate": "2021-08-10",
    "language": "English",
    "pages": 992,
    "description": "Comprehensive reference on corporate finance concepts, risk management, and valuation practices used by professionals worldwide.",
    "totalCopies": 30,
    "availableCopies": 18,
    "price": 1099.99,
    "coverImageUrl": "https://images.pexels.com/photos/590041/pexels-photo-590041.jpeg",
    "active": true
  },
  {
    "isbn": "978-0-07-352710-9",
    "title": "Financial Accounting Fundamentals",
    "author": "John Wild",
    "genreId": 9,
    "publisher": "McGraw-Hill Education",
    "publicationDate": "2019-05-01",
    "language": "English",
    "pages": 528,
    "description": "Introductory guide to financial accounting principles, focusing on financial statements, transactions, and auditing basics.",
    "totalCopies": 35,
    "availableCopies": 20,
    "price": 649.99,
    "coverImageUrl": "https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg",
    "active": true
  },
  {
    "isbn": "978-1-59327-584-6",
    "title": "The Lean Startup",
    "author": "Eric Ries",
    "genreId": 2,
    "publisher": "Crown Business",
    "publicationDate": "2018-04-10",
    "language": "English",
    "pages": 336,
    "description": "A management guide on building successful startups through continuous innovation, adaptive planning, and validated learning.",
    "totalCopies": 45,
    "availableCopies": 28,
    "price": 599.99,
    "coverImageUrl": "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg",
    "active": true
  },
  {
    "isbn": "978-0-07-352719-2",
    "title": "Human Resource Management",
    "author": "Gary Dessler",
    "genreId": 3,
    "publisher": "Pearson Education",
    "publicationDate": "2020-07-20",
    "language": "English",
    "pages": 688,
    "description": "Comprehensive exploration of HR principles including recruitment, employee relations, compensation, and performance management.",
    "totalCopies": 50,
    "availableCopies": 33,
    "price": 899.99,
    "coverImageUrl": "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg",
    "active": true
  },
  {
    "isbn": "978-0-07-811167-8",
    "title": "Marketing Management",
    "author": "Philip Kotler",
    "genreId": 5,
    "publisher": "Pearson",
    "publicationDate": "2022-02-10",
    "language": "English",
    "pages": 720,
    "description": "Classic textbook on marketing principles covering strategy, branding, digital marketing, and consumer behavior insights.",
    "totalCopies": 60,
    "availableCopies": 40,
    "price": 999.99,
    "coverImageUrl": "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg",
    "active": true
  },
  {
    "isbn": "978-0-13-472953-8",
    "title": "Operations Management",
    "author": "Jay Heizer",
    "genreId": 6,
    "publisher": "Pearson Education",
    "publicationDate": "2021-09-15",
    "language": "English",
    "pages": 864,
    "description": "Comprehensive coverage of production and operations management, supply chain optimization, and process improvement techniques.",
    "totalCopies": 40,
    "availableCopies": 25,
    "price": 899.99,
    "coverImageUrl": "https://images.pexels.com/photos/3182834/pexels-photo-3182834.jpeg",
    "active": true
  }
]
```

### 3. Lấy sách theo ID

**Endpoint:** `GET /api/books/{id}`  
**Mô tả:** Lấy một sách cụ thể bằng ID.  
**Ví dụ:** `GET /api/books/1`

### 4. Lấy sách theo ISBN

**Endpoint:** `GET /api/books/isbn/{isbn}`  
**Mô tả:** Lấy thông tin sách bằng mã ISBN.  
**Ví dụ:** `GET /api/books/isbn/978-0-13-468599-1`

### 5. Cập nhật sách

**Endpoint:** `PUT /api/books/{id}`  
**Mô tả:** Cập nhật thông tin của một sách đã tồn tại.  
**Ví dụ:** `PUT /api/books/1`

### 6. Xóa mềm sách

**Endpoint:** `DELETE /api/books/{id}`  
**Mô tả:** Xóa mềm sách, tức chỉ đánh dấu không hoạt động chứ không xóa bản ghi khỏi database.  
**Ví dụ:** `DELETE /api/books/1`

**Response:** `200 OK`

```json
{
  "message": "Book deleted successfully",
  "success": true
}
```

**Lưu ý:** Sách bị xóa mềm có `active = false` và mặc định sẽ không xuất hiện trong kết quả tìm kiếm.

### 7. Xóa sách vĩnh viễn

**Endpoint:** `DELETE /api/books/{id}/permanent`  
**Mô tả:** Xóa hoàn toàn sách khỏi database.  
**Ví dụ:** `DELETE /api/books/1/permanent`

**Response:** `200 OK`

```json
{
  "message": "Book permanently deleted",
  "success": true
}
```

⚠️ **Cảnh báo:** Thao tác này không thể hoàn tác.

### 8. Danh sách/Tìm kiếm sách cơ bản

**Endpoint:** `GET /api/books`  
**Mô tả:** Liệt kê các sách đang hoạt động trong danh mục công khai; có thể lọc theo thể loại/tình trạng còn bản và phân trang.

Catalog công khai luôn chỉ trả sách đang hoạt động. Query parameter `activeOnly` không được hỗ trợ; nếu gửi tham số này (dù là `true` hay `false`), API trả `400 Bad Request` với thông báo `Danh mục công khai chỉ hỗ trợ sách đang hoạt động.`. ADMIN dùng endpoint quản trị riêng để tra cứu sách đã ẩn.

### 9. Tìm kiếm nâng cao

**Endpoint:** `POST /api/books/search`  
**Mô tả:** Thực hiện tìm kiếm phức tạp với nhiều tiêu chí. Dùng POST để kết hợp tìm kiếm văn bản với nhiều bộ lọc.

## 🔐 Quy tắc kiểm tra dữ liệu

### Trường bắt buộc

- ISBN: phải đúng định dạng.
- Title: từ 1–255 ký tự.
- Author: từ 1–255 ký tự.
- Genre ID.
- Total Copies: `>= 0`.
- Available Copies: `>= 0` và phải `<= totalCopies`.

### Trường tùy chọn

- Publisher: tối đa 100 ký tự.
- Publication Date.
- Language: tối đa 20 ký tự.
- Pages: từ 1–50.000.
- Description: tối đa 2.000 ký tự.
- Price: `>= 0`, tối đa 8 chữ số phần nguyên và 2 chữ số thập phân.
- Cover Image URL: tối đa 500 ký tự.

### Quy tắc nghiệp vụ

1. **ISBN phải duy nhất:** Không được có hai sách cùng ISBN.
2. **Kiểm tra số lượng:** `availableCopies` không được vượt quá `totalCopies`.
3. **Xóa mềm:** Sách đã xóa vẫn còn trong database nhưng được đánh dấu inactive.
4. **Timestamp tự động:** Thời điểm tạo và cập nhật được hệ thống quản lý tự động.

## ⚠️ Xử lý lỗi

- **400 Bad Request:** lỗi validation.
- **404 Not Found:** không tìm thấy sách.
- **409 Conflict:** ISBN đã tồn tại.

Ví dụ:

```json
{ "message": "ISBN is mandatory", "success": false }
```

```json
{ "message": "Book not found with id: 123", "success": false }
```

```json
{ "message": "Book with ISBN 978-0-13-468599-1 already exists", "success": false }
```

# 2. GENRE – THỂ LOẠI

# 📘 Tài liệu Module Genre (Entity + Controller)

## 📍 Tổng quan

Module **Genre** quản lý việc phân loại sách trong thư viện.

Hỗ trợ:

- Cấu trúc thể loại phân cấp: Cha → Con → Cháu…
- Không giới hạn độ sâu của thể loại con theo dạng cây.
- Hỗ trợ xóa mềm và xóa cứng.
- API tìm kiếm công khai, phân trang và sắp xếp.
- Quản lý trạng thái kích hoạt thể loại để phục vụ việc lọc hiển thị.

Nhờ đó thư viện có thể quản lý cây danh mục linh hoạt, nhiều cấp như:

```text
Fiction
 ├── Mystery
 │   ├── Detective Fiction
 │   └── Cozy Mystery
 ├── Fantasy
 └── Drama
```

## 🧬 Mô hình dữ liệu: `Genre`

| Field | Type | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| `id` | Long | PK, Auto Increment | Mã định danh duy nhất |
| `code` | String | Required, Unique, 2-50 chars, `^[A-Z_]+$` | Mã hệ thống viết hoa dùng để ánh xạ/tìm kiếm |
| `name` | String | Required, 2-100 chars | Tên hiển thị công khai |
| `description` | String | Optional max 500 chars | Mô tả chi tiết thể loại |
| `displayOrder` | Integer | Default `0` | Thứ tự hiển thị trên UI |
| `active` | Boolean | Default `true` | Dùng để vô hiệu hóa mềm thể loại |
| `parentGenre` | Genre (Many-to-One) | Nullable | Cho biết thể loại có thuộc thể loại cha khác hay không |
| `subGenres` | List<Genre> | Auto managed | Danh sách thể loại con dạng đệ quy |
| `books` | List<Book> | Reference only | Các sách thuộc thể loại |
| `createdAt` | LocalDateTime | Auto-timestamp | Thời điểm tạo |
| `updatedAt` | LocalDateTime | Auto-timestamp | Thời điểm cập nhật |

### 🔥 Điểm nổi bật

| Tính năng | Giải thích |
| --- | --- |
| Cấu trúc đệ quy | Genre → Sub-Genres → Sub-Sub-Genres |
| Helper method | `addSubGenre()` và `removeSubGenre()` duy trì quan hệ |
| Hỗ trợ xóa mềm | Thông qua cờ `active` và các endpoint controller |
| Truy vấn hiệu năng cao | Index cho `code`, `name`, `active` |

## 🏷 API Controller — `/api/genres`

### 1️⃣ Tạo thể loại

`POST /api/genres`

Quyền truy cập: Public/Admin tùy cách triển khai.

```json
{
  "code": "MYSTERY",
  "name": "Mystery",
  "description": "Suspense & investigation stories",
  "displayOrder": 1,
  "active": true,
  "parentGenreId": null
}
```

**Response:** `201 CREATED → GenreDTO`

### 2️⃣ Tạo nhiều thể loại

`POST /api/genres/bulk`

Dùng để thêm nhiều thể loại có liên quan cùng lúc.

### 3️⃣ Lấy thể loại theo code

`GET /api/genres/code/{code}`

Ví dụ:

```text
GET /api/genres/code/FANTASY
```

Trả về `GenreDTO`; nếu không tồn tại sẽ ném `GenreException`.

### 4️⃣ Cập nhật thể loại

`PUT /api/genres/{id}`

Cập nhật code, name, description, quan hệ với thể loại cha…

### 5️⃣ Xóa mềm thể loại

`DELETE /api/genres/{id}`

Đánh dấu inactive và **không** xóa bản ghi khỏi database.

### 6️⃣ Xóa cứng thể loại

`DELETE /api/genres/{id}/hard`

⚠️ Không thể hoàn tác; các sách đang dùng thể loại này có thể bị ảnh hưởng.

## 📚 Endpoint truy vấn

| Endpoint | Mô tả |
| --- | --- |
| `GET /api/genres/active` | Trả về danh sách phẳng tất cả thể loại đang active |
| `GET /api/genres/active/hierarchy` | Chỉ trả về thể loại cha kèm cây thể loại con đệ quy |
| `GET /api/genres/top-level` | Chỉ lấy các thể loại cấp gốc, không có cha |
| `GET /api/genres/{parentId}/sub-genres` | Lấy các thể loại con của một thể loại cụ thể |

Ví dụ response phân cấp:

```json
[
  {
    "name": "Fiction",
    "subGenres": [
      {
        "name": "Mystery",
        "subGenres": [
          { "name": "Detective Fiction" },
          { "name": "Cozy Mystery" }
        ]
      }
    ]
  }
]
```

## 🔍 Tìm kiếm + phân trang

`GET /api/genres/search?term=fiction&page=0&size=10&sortBy=name&sortDir=ASC`

Trả về `Page<GenreDTO>`.

## 📊 Endpoint thống kê

| Endpoint | Kết quả |
| --- | --- |
| `GET /api/genres/count` | Tổng số thể loại đang active |
| `GET /api/genres/{id}/book-count` | Số sách đang dùng thể loại |
| `GET /api/genres/{id}/in-use` | Boolean cho biết thể loại có đang được sách sử dụng hay không |

## ⭐ Ghi chú cuối

| Điểm mạnh | Lợi ích |
| --- | --- |
| Cây thể loại đệ quy | Hỗ trợ phân loại thư viện phức tạp |
| Tạo hàng loạt | Nhanh hơn khi khởi tạo hoặc migration dữ liệu |
| Search có index + Pagination | Có thể mở rộng lên hơn 10.000 thể loại |
| Soft + Hard Delete | Quản lý vòng đời dữ liệu linh hoạt |

# 3. BOOK LOAN – MƯỢN/TRẢ SÁCH

# 📖 Book Loan (Quản lý Checkout)

## 📚 Tổng quan

Module **Book Loan** quản lý toàn bộ vòng đời mượn sách, từ lúc checkout đến lúc trả sách và xử lý quá hạn.

Người dùng có thể mượn sách; hệ thống tự động theo dõi hạn trả, số lần gia hạn, trạng thái quá hạn và tiền phạt. Admin có thể quản lý các khoản mượn của người dùng, cập nhật bản ghi và phân tích xu hướng mượn sách.

## 🎯 Chức năng

### 1. Mượn sách (Checkout)

- User và admin có thể checkout sách.
- Admin có thể cấp sách cho bất kỳ user nào.
- Kiểm tra sách còn sẵn trước khi cho mượn.
- Tự động gán hạn trả theo chính sách.

### 2. Trả sách (yêu cầu trả và ADMIN check-in)

- USER gửi yêu cầu trả cho lượt mượn của mình. Yêu cầu chưa đóng lượt mượn, chưa ghi ngày trả và
  không thay đổi tồn kho; USER chờ mang sách đến quầy để ADMIN tiếp nhận.
- ADMIN là vai trò duy nhất kiểm tra sách thực tế và hoàn tất check-in. ADMIN ghi ngày nhận thực tế,
  tình trạng sách và biên bản khi sách hư hỏng hoặc mất.
- `RETURNED` đóng lượt mượn, cộng lại đúng một bản và có thể kích hoạt lượt đặt giữ đầu hàng.
  `DAMAGED`/`LOST` đóng lượt mượn nhưng không đưa bản sách trở lại kho sẵn.
- Nếu quá hạn, hệ thống tạo phạt `min(số ngày trễ × 5.000đ, giá tham chiếu của sách)`. Hư hỏng nhẹ
  phạt 25% giá tham chiếu; hư hỏng nặng 75%; mất sách 100% giá tham chiếu + 20.000đ phí xử lý.
  ADMIN xác nhận tình trạng; USER xem và thanh toán khoản phạt qua payOS.
- Chi tiết trạng thái/API/schema và giới hạn nghiệm thu xem tại [`docs/fix-returnbook.md`](fix-returnbook.md).

### 3. Quản lý gia hạn

- Sách đang mượn có thể được gia hạn cho đến giới hạn cho phép.
- Kiểm tra trạng thái quá hạn và số lần gia hạn.
- Tự động kéo dài hạn trả.

### 4. Theo dõi và truy vấn khoản mượn

- Lấy chi tiết khoản mượn theo loan ID.
- Liệt kê theo user hoặc cấp admin.
- Lọc theo trạng thái như ACTIVE, OVERDUE, RETURNED…
- Hỗ trợ phân trang và tìm kiếm với bộ lọc.

### 5. Theo dõi quá hạn và tiền phạt

- Tự động đánh dấu quá hạn bằng scheduler hoặc thao tác admin.
- Theo dõi số ngày quá hạn động.
- Theo dõi tiền phạt thông qua collection `Fine` liên kết.

### 6. Phân tích và báo cáo mượn sách

- Thống kê ở dashboard admin.
- Phân bố số lượt mượn, số lượt quá hạn và số khoản mượn đang hoạt động.

## 📊 Mô hình dữ liệu

### Entity `BookLoan`

**Tên bảng:** `book_loans`

| Field | Type | Bắt buộc | Ràng buộc | Mô tả |
| --- | --- | --- | --- | --- |
| `id` | Long | Auto | PK | ID khoản mượn |
| `user` | User | ✅ | FK `user_id` | Người mượn sách |
| `book` | Book | ✅ | FK `book_id` | Sách được mượn |
| `type` | BookLoanType | ✅ | ENUM | Loại mượn như NORMAL, SHORT_TERM… |
| `status` | BookLoanStatus | ✅ | ENUM | Trạng thái như CHECKED_OUT, RETURNED, OVERDUE |
| `checkoutDate` | LocalDate | ✅ | - | Ngày mượn |
| `dueDate` | LocalDate | ✅ | - | Hạn trả |
| `returnDate` | LocalDate | ❌ | Nullable | Ngày trả thực tế |
| `renewalCount` | Integer | ❌ | Default: 0 | Số lần đã gia hạn |
| `maxRenewals` | Integer | ❌ | Default: 2 | Số lần gia hạn tối đa |
| `fines` | List<Fine> | ❌ | One-To-Many | Các khoản phạt đã/chưa thanh toán |
| `notes` | String(500) | ❌ | Max 500 chars | Ghi chú bổ sung |
| `isOverdue` | Boolean | ❌ | Default false | Đánh dấu khoản mượn đã quá hạn |
| `overdueDays` | Integer | ❌ | Default 0 | Tổng số ngày trễ |
| `createdAt` | LocalDateTime | Auto | - | Thời điểm tạo bản ghi |
| `updatedAt` | LocalDateTime | Auto | - | Thời điểm cập nhật gần nhất |

### 🔗 Quan hệ

- `BookLoan → User`: Many-to-One. Một user có thể có nhiều khoản mượn hiện tại hoặc trong quá khứ.
- `BookLoan → Book`: Many-to-One. Một sách có thể được mượn nhiều lần theo thời gian.
- `BookLoan → Fine`: One-to-Many. Một khoản mượn có thể có nhiều khoản phạt.

## 🔌 API Endpoint

Base URL: `/api/book-loans`

### 1. Mượn sách cho user đang đăng nhập

`POST /api/book-loans/checkout`

Hệ thống checkout sách cho user hiện đang xác thực.

```json
{
  "bookId": 14,
  "dueDays": 14
}
```

Response:

```json
{
  "id": 22,
  "status": "CHECKED_OUT",
  "dueDate": "2025-01-30"
}
```

### 2. Admin cho user khác mượn sách

`POST /api/book-loans/checkout/user/{userId}`

```json
{
  "bookId": 14,
  "dueDays": 10
}
```

### 3. Trả sách

`POST /api/book-loans/checkin`

Đánh dấu khoản mượn đã trả và xử lý trạng thái quá hạn/tiền phạt nếu có.

```json
{
  "bookLoanId": 22
}
```

### 4. Gia hạn sách

`POST /api/book-loans/renew`

Gia hạn due date nếu được phép.

```json
{
  "bookLoanId": 22,
  "extendDays": 7
}
```

### 5. Lấy khoản mượn theo ID

`GET /api/book-loans/{id}`

### 6. Lấy các khoản mượn của chính mình

`GET /api/book-loans/my?status=ACTIVE&page=0&size=20`

Hỗ trợ phân trang và lọc trạng thái.

### 7. Admin lấy các khoản mượn của một user

`GET /api/book-loans/user/{userId}?status=OVERDUE&page=0&size=20`

### 8. Tìm kiếm nâng cao

`POST /api/book-loans/search`

Có thể lọc theo khoảng ngày, trạng thái, user, overdue, type…

### 9. Admin cập nhật khoản mượn

`PUT /api/book-loans/{id}`

### 10. Đánh dấu các khoản quá hạn

`POST /api/book-loans/admin/update-overdue`

Tự động đánh dấu các khoản mượn đã quá hạn.

### 11. Thống kê mượn sách

`GET /api/book-loans/statistics`

Trả về thống kê phục vụ dashboard.

## 🔐 Quy tắc validation

| Field | Quy tắc |
| --- | --- |
| User | Phải tồn tại và hợp lệ |
| Book | Phải tồn tại và đang có sẵn |
| checkoutDate | Bắt buộc khi tạo |
| dueDate | Không được trước checkoutDate |
| status | Phải là enum hợp lệ |

### Quy tắc nghiệp vụ

1. Chỉ khoản mượn đang active (`CHECKED_OUT`) mới có thể gia hạn hoặc trả.
2. Không thể gia hạn nếu đã overdue hoặc `renewalCount == maxRenewals`.
3. Phát hiện quá hạn sẽ cập nhật `isOverdue` và `overdueDays`.
4. Các khoản phạt vẫn có thể truy vết kể cả sau khi trả sách.

## ⚠ Xử lý lỗi

| Status | Nguyên nhân | Ví dụ |
| --- | --- | --- |
| 400 Bad Request | Validation hoặc business rule không đạt | `{ "message":"Book already issued" }` |
| 404 Not Found | Không tìm thấy khoản mượn | `{ "message":"BookLoan not found: 90" }` |
| 409 Conflict | Vi phạm quy tắc renew/checkout | `{ "message":"Cannot renew overdue loan" }` |
| 500 Server Error | Lỗi nội bộ | `{ "message":"Failed to update overdue loans" }` |

# 4. BOOK REVIEW – ĐÁNH GIÁ SÁCH

# 📘 Hệ thống đánh giá sách — Tài liệu Model + API

### Đánh giá + Chấm sao + Bình chọn hữu ích + Xác minh người đọc

Module cho phép người dùng đăng đánh giá sách kèm số sao, xác minh quyền đánh giá dựa trên khoản mượn đã hoàn thành, cập nhật/xóa đánh giá, xem thống kê và xử lý lượt bình chọn “hữu ích”.

## 🔷 Mục tiêu chính

| Tính năng | Mô tả |
| --- | --- |
| ⭐ Rating System | Người dùng chấm sách từ 1–5 sao |
| ✍ Review Text | Tiêu đề + nội dung đánh giá dài |
| 🔐 Verification | Chỉ người đã hoàn tất việc mượn sách mới được đánh giá |
| 👤 Ownership Rules | Chỉ tác giả đánh giá mới được cập nhật/xóa đánh giá của mình |
| 👍 Helpful Metric | Người dùng có thể đánh dấu review là hữu ích |
| 📊 Statistics | Điểm trung bình + phân bố số sao + tổng review |

## 🗄 Entity `BookReview`

| Field | Type | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| `id` | Long | Primary Key | ID review duy nhất |
| `user` | User | `@NotNull`, FK | User đăng review |
| `book` | Book | `@NotNull`, FK | Sách được review |
| `rating` | Integer | `1–5`, Required | Số sao |
| `reviewText` | String | Tùy chọn, tối đa 2.000 ký tự | Nội dung nhận xét; có thể chỉ chấm sao. Bỏ trống được lưu thành `NULL`. |
| `title` | String | `≤200 chars`, Optional | Tiêu đề review |
| `isVerifiedReader` | Boolean | Default=`false` | True nếu user đã hoàn tất khoản mượn |
| `isActive` | Boolean | Default=`true` | Cờ xóa mềm |
| `helpfulCount` | Integer | Default=`0` | Tổng lượt đánh dấu hữu ích |
| `createdAt` | LocalDateTime | Auto timestamp | Ngày tạo |
| `updatedAt` | LocalDateTime | Auto timestamp | Ngày cập nhật |

### 🧩 Index và ràng buộc

| Tên | Field | Mục đích |
| --- | --- | --- |
| `idx_book_id` | book_id | Tìm review theo sách nhanh |
| `idx_user_id` | user_id | Lịch sử review theo user |
| `idx_rating` | rating | Truy vấn theo số sao |
| `uk_user_book_review` | (user_id, book_id) | Mỗi user chỉ có 1 review cho mỗi sách |

## 🌐 REST API — `BookReviewController`

Base URL: `/api/reviews`

### 1️⃣ Tạo review

Chỉ user đã **hoàn tất một lần mượn sách** mới được đăng review.

`POST /api/reviews` — USER / ADMIN

```json
{
  "bookId": 1,
  "rating": 5,
  "title": "Amazing Read!",
  "reviewText": "Very insightful and well written. Highly recommended!"
}
```

- `201 CREATED`: tạo review thành công.
- `400 BAD REQUEST`: rating không hợp lệ hoặc user không đủ điều kiện.

### 2️⃣ Cập nhật review – chỉ tác giả

`PUT /api/reviews/{reviewId}` — USER / ADMIN

```json
{
  "rating": 4,
  "title": "Updated Title",
  "reviewText": "Still good, but not perfect."
}
```

### 3️⃣ Xóa mềm review

`DELETE /api/reviews/{reviewId}` — USER / ADMIN

Trả về thông báo thành công.

### 4️⃣ Lấy review theo ID

`GET /api/reviews/{reviewId}`

Trả về review hoặc `404 NOT FOUND`.

## 📚 Lấy review của một sách

`GET /api/reviews/book/{bookId}`

Query parameter:

| Param | Giá trị | Mặc định |
| --- | --- | --- |
| `filter` | ALL / BY_RATING / VERIFIED_ONLY / TOP_HELPFUL | ALL |
| `rating` | 1–5 nếu `filter=BY_RATING` | — |
| `page` | number | 0 |
| `size` | number | 10 |

Ví dụ:

```text
GET /api/reviews/book/10
GET /api/reviews/book/10?filter=BY_RATING&rating=5
GET /api/reviews/book/10?filter=TOP_HELPFUL
```

## 👤 Lịch sử review của user

- `GET /api/reviews/my-reviews` — USER/ADMIN.
- `GET /api/reviews/user/{userId}` — PUBLIC.

Response được phân trang.

## 📊 Thống kê rating của sách

`GET /api/reviews/book/{bookId}/statistics`

```json
{
  "bookId": 1,
  "bookTitle": "Effective Java",
  "averageRating": 4.6,
  "totalReviews": 120,
  "ratingDistribution": { "5":80,"4":30,"3":8,"2":2,"1":0 },
  "verifiedReaderReviews": 95
}
```

## 👍 Bình chọn review hữu ích

`POST /api/reviews/{reviewId}/helpful` — USER/ADMIN

Tăng `helpfulCount` và trả về review đã cập nhật.

## 🔐 Kiểm tra quyền review

`GET /api/reviews/can-review/{bookId}` — USER/ADMIN

```json
{ "canReview": true }
```

## 🔥 Phân tích dành cho Admin

`GET /api/reviews/admin/statistics` — ADMIN

```json
{ "totalReviews": 892 }
```

# 5. FINE – QUẢN LÝ TIỀN PHẠT

# 📘 Fine — Hệ thống quản lý tiền phạt

## Tổng quan

Entity **Fine** quản lý các khoản phạt bằng tiền liên quan đến việc mượn sách. Thay vì gắn cứng toàn bộ logic phạt vào `BookLoan`, tiền phạt được tách riêng để dễ theo dõi tài chính chi tiết, lưu lịch sử, cho phép nhiều khoản phạt trên một khoản mượn và xử lý thanh toán/miễn phạt độc lập.

## Tính năng chính

| Tính năng | Mô tả |
| --- | --- |
| Nhiều khoản phạt trên một khoản mượn | Theo dõi riêng phạt quá hạn, hư hỏng, phí xử lý… |
| Thanh toán toàn phần hoặc một phần | Số dư còn lại được tính động |
| Quy trình miễn phạt | Admin có thể miễn phạt kèm thời gian và lý do |
| Trạng thái phạt thời gian thực | `PENDING`, `PARTIALLY_PAID`, `PAID`, `WAIVED` |
| Trường audit | `createdAt`, `updatedAt` với Hibernate timestamp |
| Theo dõi giao dịch | Lưu mã thanh toán và admin xử lý |

## 🔸 Mô hình dữ liệu — Entity `Fine`

| Field | Type | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| `id` | Long | Primary Key | ID khoản phạt |
| `bookLoan` | BookLoan | NotNull, @ManyToOne | Khoản mượn liên quan |
| `user` | User | NotNull, @ManyToOne | User chịu khoản phạt |
| `type` | FineType (ENUM) | NotNull | OVERDUE, DAMAGE, LOST… |
| `amount` | Long | NotNull | Tổng số tiền phạt |
| `amountPaid` | Long | Default=0 | Tổng tiền đã thanh toán |
| `status` | FineStatus (ENUM) | NotNull, default=PENDING | Trạng thái thanh toán hiện tại |
| `reason` | String | 500 chars | Lý do phạt |
| `notes` | String | 1000 chars | Ghi chú nhân viên/admin |
| `waivedBy` | User | Nullable | Admin miễn phạt |
| `waivedAt` | DateTime | Nullable | Thời điểm miễn phạt |
| `waiverReason` | String | 500 chars | Lý do miễn |
| `paidAt` | DateTime | Nullable | Thời điểm thanh toán hoàn tất |
| `processedBy` | User | Nullable | Nhân viên xử lý thanh toán |
| `transactionId` | String | 100 chars | Mã tham chiếu giao dịch bên ngoài |
| `createdAt` | DateTime | Auto generated | Thời điểm tạo |
| `updatedAt` | DateTime | Auto updated | Thời điểm cập nhật |

### Tóm tắt business logic

| Method | Hành vi |
| --- | --- |
| `getAmountOutstanding()` | Trả về `amount - amountPaid` |
| `isFullyPaid()` | Kiểm tra `paid >= amount` hoặc status=PAID |
| `isWaived()` | True nếu status=WAIVED |
| `isPending()` | True nếu PENDING hoặc PARTIALLY_PAID |
| `applyPayment(amount)` | Cập nhật số đã trả, trạng thái và `paidAt` khi hoàn tất |
| `waive(admin, reason)` | Chuyển sang WAIVED, gán admin và timestamp |

## 🏛 API — Fine Controller

Base URL: `/api/fines`

### 1️⃣ Tạo khoản phạt – Admin

`POST /api/fines`

```json
{
  "bookLoanId": 12,
  "userId": 8,
  "type": "OVERDUE",
  "amount": 150,
  "reason": "Returned 5 days late"
}
```

### 2️⃣ Thanh toán tiền phạt

Thanh toán toàn bộ:

`POST /api/fines/{id}/pay?transactionId=TXN_44HA8`

Trả về `PaymentInitiateResponse` hoặc lỗi.

### 3️⃣ Miễn phạt – Admin

`POST /api/fines/waive`

```json
{
  "fineId": 22,
  "waiverReason": "Lost due to system error"
}
```

### 4️⃣ Truy xuất tiền phạt

| Use case | Method | Endpoint |
| --- | --- | --- |
| Lấy khoản phạt theo ID | GET | `/api/fines/{id}` |
| Lấy tiền phạt theo khoản mượn | GET | `/api/fines/book-loan/{bookLoanId}` |
| Lấy tiền phạt của tôi, có lọc | GET | `/api/fines/my?status=PENDING&type=OVERDUE` |
| Admin lấy toàn bộ, có phân trang | GET | `/api/fines?status=&type=&userId=&page=0&size=20` |

### 5️⃣ Tổng hợp/Thống kê

| Endpoint | Mô tả |
| --- | --- |
| `GET /api/fines/my/total-unpaid` | Tổng số dư chưa thanh toán của user hiện tại |
| `GET /api/fines/statistics/user/{userId}/unpaid` | Admin xem tổng tiền user còn nợ |
| `GET /api/fines/statistics/collected` | Tổng tiền phạt đã PAID |
| `GET /api/fines/statistics/outstanding` | Tổng tiền chưa thanh toán toàn hệ thống |
| `GET /api/fines/statistics/user/{userId}/has-unpaid` | User có đang nợ tiền hay không |

### 6️⃣ Xóa khoản phạt – Admin

`DELETE /api/fines/{id}`

⚠️ Không thể hoàn tác; chỉ nên dùng để sửa dữ liệu audit sai.

Response DTO:

```json
{ "total": 400 }
{ "hasUnpaidFines": true }
```

# 6. RESERVATION – ĐẶT GIỮ SÁCH

# 📘 Tài liệu Module Reservation/Hold (Entity + Controller)

## 📍 Tổng quan

Module **Reservation/Hold** quản lý yêu cầu đặt giữ những sách hiện đang không có sẵn.

Module triển khai hàng đợi tự động, quy tắc hết hạn, theo dõi hoàn tất và quản lý khoảng thời gian đến nhận sách.

Hỗ trợ:

- Hàng đợi nhiều user cho cùng một sách.
- Tự động chuyển trạng thái trong vòng đời reservation.
- Xử lý hết hạn dựa trên thời điểm sách có sẵn.
- Tra cứu vị trí trong hàng đợi.
- Tìm kiếm nâng cao và lọc lịch sử đầy đủ.
- Phân tách quyền admin và user đã xác thực.

### Điều kiện đặt giữ sách

- USER phải có gói thành viên đang hiệu lực mới được tạo lượt đặt giữ.
- Backend kiểm tra lại gói còn hiệu lực khi ADMIN hoàn tất giao sách, vì gói có thể hết hạn trong lúc USER chờ đến lượt.
- Nếu USER chưa có gói hiệu lực, giao diện hướng đến trang đăng ký gói thành viên.

## 🧬 Mô hình dữ liệu — `Reservation`

| Field | Type | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| `id` | Long | PK, Auto-generated | ID reservation |
| `user` | User | NotNull, Many-to-One LAZY | User đặt giữ sách |
| `book` | Book | NotNull, Many-to-One LAZY | Sách được đặt giữ |
| `status` | ReservationStatus | Default: `PENDING` | PENDING/AVAILABLE/FULFILLED/EXPIRED/CANCELLED |
| `reservedAt` | LocalDateTime | Required | Thời điểm tạo reservation |
| `availableAt` | LocalDateTime | Nullable | Thời điểm sách sẵn sàng để nhận |
| `availableUntil` | LocalDateTime | Nullable | Hạn cuối nhận sách, thường 48–72 giờ |
| `fulfilledAt` | LocalDateTime | Nullable | Thời điểm checkout hoàn tất reservation |
| `cancelledAt` | LocalDateTime | Nullable | Thời điểm bị hủy hoặc hết hạn |
| `queuePosition` | Integer | Nullable | Vị trí user trong hàng đợi |
| `notificationSent` | Boolean | Default false | Đã gửi email thông báo nhận sách hay chưa |
| `notes` | String TEXT | Optional | Lý do hủy hoặc ghi chú admin |
| `createdAt` | Timestamp | Auto | Thời điểm tạo |
| `updatedAt` | Timestamp | Auto | Thời điểm cập nhật |

### 🔥 Utility method đặc biệt

| Method | Trả về | Mục đích |
| --- | --- | --- |
| `isActive()` | true nếu PENDING hoặc AVAILABLE | Chỉ hiển thị reservation hợp lệ |
| `canBeCancelled()` | Cùng logic trên | Điều khiển nút hủy trên UI |
| `hasExpired()` | Kiểm tra bằng `availableUntil` | Dùng cho background job tự động hết hạn |

## 🚦 Vòng đời Reservation

```text
User yêu cầu đặt sách → PENDING
Sách được trả → AVAILABLE (gửi email)
User đến nhận → FULFILLED
User không đến nhận đúng hạn → EXPIRED
User tự hủy → CANCELLED
```

Hàng đợi tự động dịch chuyển khi user đầu tiên hoàn tất hoặc hủy reservation.

### Trạng thái triển khai BE-2 (31/10/2026)

- Khi sách được trả bình thường, lượt `PENDING` đầu tiên chuyển sang `AVAILABLE` trong **72 giờ**.
- Scheduler mặc định quét mỗi **60 giây**, tối đa **100** lượt mỗi lô; lượt hết hạn chuyển sang `EXPIRED` và nhường cho người kế tiếp.
- Hủy hoặc giao thành công cũng sắp lại và chuyển hàng đợi; chỉ lượt `AVAILABLE` đứng đầu, còn hạn mới được giao.
- Mượn thường không được lấy bản đang dành cho lượt `AVAILABLE`.
- V1 chưa gửi email/chuông; `notificationSent` vẫn để `false`.

## 🎮 REST Controller — `/api/reservations`

### 1️⃣ Tạo reservation – user đã đăng nhập

`POST /api/reservations`

Body: `ReservationRequest`  
Returns: `ReservationDTO`

Dùng khi user đang đăng nhập muốn đặt giữ sách.

### 2️⃣ Admin tạo reservation cho user cụ thể

`POST /api/reservations/user/{userId}`

Cho phép ADMIN tạo lượt đặt giữ thay cho USER; USER vẫn phải có gói thành viên đang hiệu lực.

### 3️⃣ Hủy reservation

`DELETE /api/reservations/{id}`

- Chỉ hủy nếu trạng thái là `PENDING` hoặc `AVAILABLE`.
- Service tự động cập nhật hàng đợi.

### 4️⃣ Hoàn tất reservation – checkout

`POST /api/reservations/{id}/fulfill`

Chuyển reservation sang **FULFILLED** và loại khỏi hàng đợi.

### 5️⃣ Lấy reservation theo ID

`GET /api/reservations/{id}`

Trả về DTO chi tiết hoặc 404 nếu không tồn tại.

## 🔍 Truy vấn theo user

### 6️⃣ Lấy reservation của tôi – lọc + phân trang

`GET /api/reservations/my`

```text
status=PENDING|AVAILABLE|FULFILLED|CANCELLED|EXPIRED
activeOnly=true/false
page=0&size=20
sortBy=reservedAt&sortDirection=DESC
```

Response: `PageResponse<ReservationDTO>`.

### 7️⃣ Tìm kiếm nâng cao bằng request body – user

`POST /api/reservations/my/search`

Nhận `ReservationSearchRequest`; hỗ trợ lọc đầy đủ, sắp xếp và truy vấn theo khoảng thời gian.

## 🔎 Truy vấn cấp Admin

### 8️⃣ Tìm tất cả reservation bằng query parameter

`GET /api/reservations`

```text
userId, bookId, status, activeOnly
page, size, sortBy, sortDirection
```

### 9️⃣ Tìm kiếm nâng cao bằng POST body

`POST /api/reservations/search`

Phù hợp với bộ lọc trên dashboard.

### 🔢 Kiểm tra vị trí hàng đợi

`GET /api/reservations/{id}/queue-position`

```json
{
  "queuePosition": 2,
  "message": "There are 1 person(s) ahead of you"
}
```

Hệ thống tự động trả thông báo theo ngữ cảnh.

## 📊 Hiệu năng và cấu trúc index

| Index | Lợi ích |
| --- | --- |
| `idx_user_id` | Lấy lịch sử theo user nhanh |
| `idx_book_id` | Tra cứu hàng đợi và user tiếp theo nhanh |
| `idx_status` | Lọc tức thời theo pending/active |
| `idx_reserved_at` | Sắp xếp theo timeline |
| `idx_available_until` | Quét batch các reservation hết hạn bằng cron |

## 🚀 Điểm mạnh của module

| Tính năng | Lợi ích vận hành |
| --- | --- |
| Reservation theo hàng đợi | Xử lý sách nhu cầu cao ổn định |
| Expiry + tự xóa khỏi hàng đợi | Giải phóng sách nếu user không đến |
| Theo dõi notification | Tránh gửi email trùng |
| Admin search nhiều bộ lọc | Hoạt động tốt ngay cả với hơn 100.000 reservation |
| API dùng DTO | Không làm lộ entity nội bộ |

# 7. SUBSCRIPTION – GÓI ĐĂNG KÝ CỦA USER

# 📘 Tài liệu Module Subscription (Entity + Controller)

## 📍 Tổng quan

Module **Subscription** quản lý quyền truy cập thư viện trả phí của người dùng.

Mỗi user được liên kết với một subscription plan quy định:

- Giới hạn số sách được mượn.
- Số ngày được mượn mỗi sách.
- Giá gói và loại tiền tệ.
- Quy trình auto-renew và hủy.
- Kích hoạt thông qua payment gateway.

Module cũng hỗ trợ xem toàn bộ lịch sử subscription và cho phép admin quản lý các gói đang active hoặc đã hết hạn.

## 🧬 Mô hình dữ liệu — `Subscription`

| Field | Type | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| `id` | Long | PK | ID subscription |
| `user` | User | NotNull, ManyToOne LAZY | Chủ sở hữu subscription |
| `plan` | SubscriptionPlan | NotNull, ManyToOne EAGER | Gói cơ sở gồm thời hạn, giá, giới hạn |
| `planName` | String | Cached | Giữ lịch sử ngay cả khi plan thay đổi |
| `planCode` | String | Cached | Dùng ánh xạ hóa đơn và truy vết plan |
| `price` | Long | Số nguyên VND | Ví dụ `30000` = 30.000 đ; không nhân 100 |
| `currency` | String(3) | Cố định `VND` | Đồng bộ với payOS/VietQR |
| `startDate` | LocalDate | Required | Ngày kích hoạt |
| `endDate` | LocalDate | Required | Tự tính dựa vào thời hạn plan |
| `isActive` | Boolean | Default = TRUE | Xác định quyền mượn sách |
| `maxBooksAllowed` | Integer | Required + Positive | Số sách tối đa được mượn cùng lúc |
| `maxDaysPerBook` | Integer | Required + Positive | Thời gian mượn tối đa mỗi sách |
| `autoRenew` | Boolean | Default = FALSE | Cho phép thanh toán gia hạn tự động |
| `cancelledAt` | LocalDateTime | Optional | Thời điểm hủy thủ công |
| `cancellationReason` | Text | Optional | Lý do hủy hoặc ghi chú admin |
| `notes` | Text | Optional | Ghi chú nội bộ |
| `createdAt` | Timestamp | Auto | Thời điểm tạo |
| `updatedAt` | Timestamp | Auto | Thời điểm cập nhật |

### 🔥 Logic của Subscription trong Entity

| Method | Mục đích |
| --- | --- |
| `isValid()` | Đảm bảo subscription active và ngày hiện tại nằm trong khoảng hiệu lực |
| `isExpired()` | Kiểm tra `endDate < today` |
| `getDaysRemaining()` | Đếm số ngày còn lại để hiển thị UX |
| `calculateEndDate()` | Tính `endDate = startDate + durationDays` |
| `initializeFromPlan()` | Nạp giá và quota từ plan cơ sở |
| `getPriceInMajorUnits()` | Chuyển 99900 → 999.00 cho UI |
| `canBorrowMoreBooks(x)` | Áp dụng giới hạn số sách được mượn |

## 🚦 Vòng đời Subscription

```text
subscribe() → xử lý thanh toán → activation webhook → ACTIVE
ACTIVE → đến hạn → EXPIRED (tự động hoặc admin)
ACTIVE → user hủy → CANCELLED
EXPIRED → renewSubscription() → ACTIVE lại
```

## 🎮 REST Controller — `/api/subscriptions`

### 1️⃣ Tạo subscription – khởi tạo thanh toán

`POST /api/subscriptions/subscribe`

Body: `SubscribeRequest`  
Returns: `PaymentInitiateResponse`

Kích hoạt payment gateway và tạo bản ghi subscription tạm thời.

### 2️⃣ Lấy lịch sử subscription của user

`GET /api/subscriptions/history?userId={id(optional)}`

Trả về danh sách `SubscriptionDTO`, gồm expired, cancelled, active, renewed — toàn bộ timeline.

### 3️⃣ Lấy subscription đang active

`GET /api/subscriptions/user/active?userId=x`

Trả về subscription hiện đang hợp lệ; nếu user không có thì trả 404.

### 4️⃣ Kiểm tra subscription hợp lệ

`GET /api/subscriptions/check?userId=x`

```json
{ "message": "User has valid subscription", "success": true }
```

Dùng trước khi cho phép user mượn sách.

### 5️⃣ Lấy subscription theo ID

`GET /api/subscriptions/{id}`

Được bảo vệ cho USER + ADMIN; báo lỗi nếu subscription không tồn tại.

### 6️⃣ Gia hạn subscription

`POST /api/subscriptions/renew/{subscriptionId}`

Khởi tạo lại thanh toán → kéo dài plan → tính lại `endDate`.

### 7️⃣ Hủy subscription

`POST /api/subscriptions/cancel/{subscriptionId}?reason=`

Lưu `cancelledAt`, `cancellationReason` và đặt `isActive = false`. Quyền mượn sách dừng ngay lập tức.

### 8️⃣ Kích hoạt subscription bằng webhook callback

`POST /api/subscriptions/activate?subscriptionId=x&paymentId=y`

Dùng sau khi payment được xác nhận thành công.

## 🛡 Endpoint dành cho Admin

### 9️⃣ Liệt kê tất cả subscription đang active

`GET /api/subscriptions/admin/active?page=0&size=20`

Phù hợp cho dashboard và theo dõi gia hạn.

### 🔟 Vô hiệu hóa subscription đã hết hạn

`POST /api/subscriptions/admin/deactivate-expired`

Tự động đặt các subscription đã hết hạn thành inactive. Có thể chạy bằng scheduled task, ví dụ mỗi ngày lúc nửa đêm.

### Trạng thái triển khai BE-3 (01/11/2026)

- `POST /api/subscriptions/admin/deactivate-expired` là method duy nhất làm thay đổi trạng thái; gọi bằng GET trả 405.
- `GET /api/subscriptions/admin?page=0&size=10` dùng phân trang database thật; size hợp lệ từ 1 đến 100. Khi cần tổng trang và bộ lọc, dùng `/api/subscriptions/admin/search`.
- `DELETE /api/subscription-plans/admin/{id}` xóa cứng khi plan chưa từng có đăng ký; nếu đã có lịch sử thì từ chối với HTTP 409, giữ nguyên gói, trạng thái và lịch sử (`AUD2-BE-04`).
- Update plan được validate đầy đủ trước khi ghi.
- Người có gói active không được tạo đơn payOS mới; sau khi hủy có thể mua ngay.
- V1 không dùng endpoint kích hoạt thủ công; chỉ settlement từ webhook payOS đã xác minh mới kích hoạt gói.

## 📊 Lợi ích của index

| Index | Mục đích |
| --- | --- |
| `idx_user_id` | Tra cứu nhanh theo user |
| `idx_is_active` | Đếm nhanh user đang active |
| `idx_end_date` | Xử lý batch các subscription hết hạn |
| `idx_plan_id` | Báo cáo theo plan |

## 🚀 Điểm mạnh

| Tính năng | Lợi ích |
| --- | --- |
| Cache metadata của plan | Lịch sử billing vẫn chính xác khi plan thay đổi |
| Tự hết hạn + hỗ trợ renewal | Giảm thao tác thủ công của admin |
| Tương thích auto-renew | Sẵn sàng tích hợp payment gateway |
| Kiểm soát quyền mượn ở entity | Giảm khả năng bypass ở backend |

# 8. SUBSCRIPTION PLAN – GÓI THÀNH VIÊN

## 📚 Tổng quan

Module **Subscription Plan** quản lý toàn bộ các gói thành viên dành cho user. Module hỗ trợ đầy đủ vòng đời gồm tạo, cập nhật, kích hoạt/vô hiệu hóa, chu kỳ thanh toán, thời gian dùng thử, giá và cấp độ truy cập. Đây là nền tảng của hệ thống subscription và tích hợp với payment, user subscription và billing service.

## 🎯 Chức năng

### 1. Quản lý plan

- Tạo một hoặc nhiều subscription plan.
- Cập nhật thông tin plan, giá, thời hạn và giới hạn sử dụng.
- V1 cho xóa cứng plan chưa từng được đăng ký. Nếu plan đã có lịch sử, API từ chối xóa bằng HTTP 409 và giữ nguyên trạng thái gói cùng lịch sử; không tự đặt `active=false`.
- Gắn quyền lợi và kiểm soát truy cập theo role.

### 2. Giá và billing

- Hỗ trợ chu kỳ thanh toán tháng/năm.
- Cấu hình thời gian dùng thử cho user mới.
- Cấu hình auto-renew cho subscription định kỳ.
- Hỗ trợ mua một lần hoặc thanh toán định kỳ.

### 3. Tìm kiếm và lọc

- Tìm theo Plan ID hoặc Title.
- Lọc theo billing cycle, khoảng giá, trạng thái active…
- Phân trang cho danh sách lớn.

### 4. Phân tích và báo cáo

- Đếm số plan đang active.
- Ước tính tổng doanh thu theo giá và số subscriber.
- Thống kê độ phổ biến và mức sử dụng plan.

## 📊 Mô hình dữ liệu

### Entity `SubscriptionPlan`

**Tên bảng:** `subscription_plans`

| Field | Type | Bắt buộc | Ràng buộc | Mô tả |
| --- | --- | --- | --- | --- |
| `id` | Long | Auto | PK | ID plan |
| `title` | String(150) | ✅ | Unique | Tên hiển thị của plan |
| `description` | String(500) | ❌ | Max 500 chars | Mô tả ngắn |
| `price` | BigDecimal(10,2) | ✅ | >= 0 | Giá subscription |
| `durationInDays` | Integer | ✅ | >= 1 | Thời hạn hiệu lực theo ngày |
| `billingCycle` | ENUM | ❌ | Default=MONTHLY | Chu kỳ MONTHLY/YEARLY/ONE_TIME |
| `trialDays` | Integer | ❌ | >=0 | Số ngày dùng miễn phí trước khi tính phí |
| `maxUsersAllowed` | Integer | ❌ | >=1 | Số user tối đa được phép |
| `features` | JSON/TEXT | ❌ | Feature list | Danh sách quyền lợi |
| `autoRenew` | Boolean | ❌ | Default:true | Bật/tắt gia hạn định kỳ |
| `active` | Boolean | Required | Default:true | Cờ trạng thái/xóa mềm |
| `createdAt` | LocalDateTime | Auto | Immutable | Thời điểm tạo |
| `updatedAt` | LocalDateTime | Auto | Updated on change | Thời điểm cập nhật |

### Quan hệ

`Subscription Plan → UserSubscription`: Một plan có thể có nhiều user đăng ký.

## 🔌 API Endpoint

Base URL: `/api/subscription-plans`

### 1. Tạo Subscription Plan

`POST /api/subscription-plans`

Thêm một plan mới vào hệ thống.

```json
{
  "title": "Premium Membership",
  "description": "Full access to features with priority support and unlimited usage.",
  "price": 999.00,
  "durationInDays": 30,
  "billingCycle": "MONTHLY",
  "trialDays": 7,
  "maxUsersAllowed": 1,
  "features": ["Unlimited Access", "Priority Support", "Advanced Analytics"],
  "autoRenew": true,
  "active": true
}
```

### 2. Tạo nhiều plan cùng lúc

`POST /api/subscription-plans/bulk`

```json
[
  {
    "title": "Basic Plan",
    "price": 199.00,
    "durationInDays": 30,
    "billingCycle": "MONTHLY",
    "features": ["Limited Access"]
  },
  {
    "title": "Gold Annual Plan",
    "price": 4999.00,
    "durationInDays": 365,
    "billingCycle": "YEARLY",
    "trialDays": 14,
    "features": ["Unlimited Access", "Advanced Support", "Free Updates"]
  }
]
```

### 3. Lấy plan theo ID

`GET /api/subscription-plans/{id}`

Ví dụ: `GET /api/subscription-plans/1`

### 4. Cập nhật plan

`PUT /api/subscription-plans/admin/{id}`

```json
{
  "title": "Premium Plus Membership",
  "price": 1299.00,
  "durationInDays": 30,
  "billingCycle": "MONTHLY",
  "features": ["Unlimited Access", "VIP Support", "Custom Reports"],
  "trialDays": 10
}
```

### 5. Xóa plan

`DELETE /api/subscription-plans/admin/{id}`

```json
{ "message": "Đã xóa vĩnh viễn gói thành công.", "status": true }
```

Nếu plan chưa từng có bản ghi trong `subscriptions`, hệ thống xóa vĩnh viễn. Nếu đã có ít nhất một đăng ký (kể cả đã hủy hoặc hết hạn), hệ thống trả HTTP 409 với mã `SUBSCRIPTION_PLAN_HAS_HISTORY`; không xóa, không đổi trạng thái và không sửa lịch sử. Khóa ngoại tiếp tục bảo vệ dữ liệu liên quan. V1 không cung cấp thao tác ngừng bán gói.

Response khi plan đã có lịch sử:

```json
{
  "message": "Không thể xóa gói vì đã có lịch sử đăng ký. Lịch sử và trạng thái gói được giữ nguyên.",
  "status": false,
  "errorCode": "SUBSCRIPTION_PLAN_HAS_HISTORY"
}
```

### 6. Điều kiện bảo toàn lịch sử

Không được xóa cứng plan đã từng được đăng ký vì `subscriptions.plan_id` là khóa ngoại và plan là mốc tham chiếu cho lịch sử đăng ký/thanh toán. Quyền ADMIN không vượt qua quy tắc toàn vẹn dữ liệu này.

### 7. Liệt kê và lọc plan

`GET /api/subscription-plans`

| Query Param | Ví dụ | Mô tả |
| --- | --- | --- |
| `active` | true/false | Lọc active/inactive |
| `billingCycle` | MONTHLY | Lọc theo loại billing |
| `minPrice` & `maxPrice` | 99 → 999 | Lọc theo khoảng giá |

## 🔐 Validation

### Bắt buộc

- Title: duy nhất, tối đa 150 ký tự.
- Price: số, `>= 0`.
- Duration in days: tối thiểu 1.
- Active status.

### Tùy chọn

- Trial days: `>= 0`.
- Features list.
- Billing type, mặc định MONTHLY.
- Auto renew flag.

### Business constraint

1. Không cho phép trùng title plan.
2. Thời gian trial không được vượt quá thời hạn plan.
3. Plan xóa mềm có thể khôi phục bằng cách đặt `active=true`.

## ⚠️ Xử lý lỗi

- **400 Bad Request:** input không hợp lệ hoặc thiếu field.
- **404 Not Found:** subscription plan không tồn tại.
- **409 Conflict:** trùng title plan.

```json
{
  "message": "Plan with title 'Premium Membership' already exists",
  "success": false
}
```

# 9. WISHLIST – DANH SÁCH YÊU THÍCH

# 📌 Tài liệu Module Wishlist

## 📚 Tổng quan

Module **Wishlist** cho phép user lưu những cuốn sách họ quan tâm để xem lại sau. Wishlist hoạt động như một hệ thống bookmark cá nhân, cho phép lưu sách, thêm ghi chú, quay lại xem sau và theo dõi những sách user dự định đọc hoặc mua.

Module hỗ trợ CRUD gồm thêm/xóa item, cập nhật ghi chú, danh sách phân trang và thống kê wishlist như đếm số lượng và kiểm tra một sách có tồn tại trong wishlist hay không.

## 🎯 Chức năng

### 1. Quản lý Wishlist

- Thêm sách vào wishlist.
- Xóa từng item.
- Cập nhật ghi chú cá nhân.
- Ngăn trùng dữ liệu bằng unique constraint.

### 2. Lưu trữ theo user và Access Control

- Mỗi item gắn với một user cụ thể.
- Hỗ trợ role USER và ADMIN.
- Admin có thể xem wishlist của bất kỳ user nào.

### 3. Lấy dữ liệu nâng cao + phân trang

- Lấy wishlist của user đang đăng nhập, có pagination.
- Lấy wishlist của bất kỳ user nào.
- Dùng index ở database để tăng tốc truy vấn.

### 4. Thống kê Wishlist

- Đếm số item trong wishlist của user hiện tại.
- Đếm số user đã wishlist một cuốn sách cụ thể.
- Kiểm tra một sách có nằm trong wishlist của user hay không.

## 📊 Mô hình dữ liệu

### Entity `Wishlist`

**Tên bảng:** `wishlists`

| Field | Type | Bắt buộc | Ràng buộc | Mô tả |
| --- | --- | --- | --- | --- |
| `id` | Long | Auto | PK | ID item wishlist |
| `user` | User | ✅ | FK, Not Null | Chủ sở hữu item |
| `book` | Book | ✅ | FK, Not Null | Sách được thêm |
| `addedAt` | LocalDateTime | Auto | Immutable | Thời điểm lưu |
| `notes` | String(500) | ❌ | Max 500 chars | Ghi chú tùy chọn |

### Index và Constraint

| Loại | Cột | Mục đích |
| --- | --- | --- |
| Unique Constraint | `user_id`, `book_id` | Ngăn wishlist trùng |
| Index | `user_id` | Tối ưu lấy wishlist theo user |
| Index | `book_id` | Tăng tốc thống kê wishlist theo sách |

### Quan hệ

- `Wishlist → User`: Many-to-One; một user có nhiều wishlist item.
- `Wishlist → Book`: Many-to-One; một sách có thể được nhiều user wishlist.

## 🔌 API Endpoint

Base URL: `/api/wishlist`

### 1. Thêm sách vào wishlist

`POST /api/wishlist/add/{bookId}` — USER / ADMIN

Query param `notes` là ghi chú tùy chọn.

Ví dụ:

`POST /api/wishlist/add/10?notes=Read after finals`

Thành công: `201 Created`, trả về `WishlistDTO`.

### 2. Xóa sách khỏi wishlist

`DELETE /api/wishlist/remove/{bookId}` — USER / ADMIN

```json
{ "message": "Book removed from wishlist successfully", "success": true }
```

### 3. Cập nhật ghi chú Wishlist

`PUT /api/wishlist/update-notes/{bookId}`

Query param `notes` chứa ghi chú mới.

Ví dụ:

`PUT /api/wishlist/update-notes/10?notes=High priority read`

Trả về `WishlistDTO` đã cập nhật.

### 4. Lấy wishlist của user đang đăng nhập

`GET /api/wishlist/my-wishlist`

| Param | Mặc định | Mô tả |
| --- | --- | --- |
| page | 0 | Số trang |
| size | 10 | Số item mỗi trang |

Ví dụ:

`GET /api/wishlist/my-wishlist?page=0&size=5`

Trả về `PageResponse<WishlistDTO>`.

### 5. Lấy wishlist của một user bất kỳ

`GET /api/wishlist/user/{userId}`

Ví dụ:

`GET /api/wishlist/user/5?page=0&size=10`

Trả về `PageResponse<WishlistDTO>` có phân trang.

### 6. Kiểm tra sách có nằm trong Wishlist

`GET /api/wishlist/check/{bookId}`

```json
{ "isInWishlist": true }
```

### 7. Đếm wishlist của user đang đăng nhập

`GET /api/wishlist/my-count`

```json
{ "count": 18 }
```

### 8. Đếm số user wishlist một sách

`GET /api/wishlist/book/{bookId}/count`

```json
{ "count": 42 }
```

## 🔐 Quy tắc validation

### Bắt buộc

- `user` phải tồn tại và đã xác thực.
- `book` phải hợp lệ và tồn tại trong catalog.
- Không cho phép wishlist trùng do unique constraint.

### Tùy chọn

- `notes`: tối đa 500 ký tự.

### Business rule

- Một user không thể thêm cùng một sách hai lần.
- `addedAt` được tạo tự động.

## ⚠️ Xử lý lỗi

- **400 Bad Request:** dữ liệu không hợp lệ hoặc sách đã có trong wishlist.
- **404 Not Found:** không tìm thấy user/book hoặc wishlist rỗng.
- **401 Unauthorized:** user chưa xác thực.

```json
{
  "message": "Book already exists in wishlist",
  "success": false
}
```

# 10. USER – NGƯỜI DÙNG

# 🧑‍💼 Tài liệu Module User

## 📚 Tổng quan

Module **User** quản lý người dùng đã đăng ký trong hệ thống, lưu thông tin xác thực local, role, timestamp và hồ sơ cá nhân.

Module cung cấp endpoint để lấy chi tiết user, liệt kê tất cả user và lấy profile của user đã xác thực thông qua JWT. Ngoài ra còn có chức năng thống kê dành riêng cho Admin để lấy tổng số user đã đăng ký.

## 🎯 Chức năng

### 1. Lưu dữ liệu xác thực

- Đăng ký tài khoản bằng email và mật khẩu do hệ thống quản lý.
- Mật khẩu được băm bằng BCrypt; Backend phát hành JWT sau khi đăng nhập thành công.
- Lưu trạng thái xác minh tài khoản để quyết định quyền truy cập.

### 2. Thông tin hồ sơ và danh tính

- Lưu họ tên, email, số điện thoại và ảnh đại diện.
- Theo dõi lịch sử đăng nhập bằng `lastLogin`.
- Email là duy nhất trong toàn hệ thống.

### 3. Phân quyền theo role

- Hỗ trợ nhiều role thông qua `UserRole`.
- Dùng để kiểm soát quyền truy cập tài nguyên được bảo vệ.

### 4. Theo dõi vòng đời tài khoản

- Tự động tạo timestamp khi tạo/cập nhật tài khoản.
- Theo dõi lần đăng nhập gần nhất để phục vụ analytics.

## 📊 Mô hình dữ liệu

### Entity `User`

**Tên bảng:** `users`

| Field | Type | Bắt buộc | Ràng buộc | Mô tả |
| --- | --- | --- | --- | --- |
| `id` | Long | Auto | PK | ID duy nhất |
| `fullName` | String | ✅ | Not Blank | Tên hiển thị đầy đủ |
| `password` | String | ✅ | `@JsonIgnore`, Not Null | Mật khẩu BCrypt dùng cho xác thực tài khoản local |
| `email` | String | ✅ | Unique, Valid Email | Định danh đăng nhập chính |
| `phone` | String | ❌ | None | Số điện thoại tùy chọn |
| `profileImage` | String | ❌ | None | URL ảnh đại diện |
| `role` | Enum(UserRole) | Required | NotNull | Quyền ADMIN/USER |
| `verified` | Boolean | Auto | Default:false | Trạng thái xác minh tài khoản/email |
| `createdAt` | LocalDateTime | Auto | Immutable | Thời điểm tạo tài khoản |
| `updatedAt` | LocalDateTime | Auto | Auto-Update | Thời điểm cập nhật gần nhất |
| `lastLogin` | LocalDateTime | ❌ | None | Cập nhật khi đăng nhập |

### Quan hệ

Entity này đứng độc lập. Các module khác tham chiếu `User` để xác định chủ sở hữu như wishlist, review, payment…

## 🔌 API Endpoint

Base URL: `/api/users`

### 1. Lấy profile từ JWT token

Chỉ dành cho user đã xác thực.

`GET /api/users/profile`

Header:

`Authorization: Bearer Token`

```json
{
  "id": 14,
  "fullName": "John Carter",
  "email": "reader@example.com",
  "role": "USER",
  "profileImage": null,
  "verified": true,
  "lastLogin": "2025-02-01T12:40:19"
}
```

### 2. Lấy danh sách tất cả user

`GET /users/list`

Quyền Public hoặc Admin tùy Security Layer. Trả về danh sách thô các entity `User`.

### 3. Lấy user theo ID

`GET /users/{userId}`

Ví dụ: `GET /users/8`

Trả về một `UserDTO`.

### 4. Thống kê tổng số user – chỉ Admin

`GET /api/users/statistics`

```json
{
  "totalUsers": 245
}
```

## 🔐 Validation

| Field | Quy tắc |
| --- | --- |
| fullName | Bắt buộc, không được rỗng |
| email | Đúng định dạng và duy nhất |
| role | Phải được gán khi signup hoặc thủ công |
| password | Được ẩn, chỉ dùng nội bộ cho auth |

## ⚠️ Xử lý lỗi

- **400 Bad Request:** email/role không hợp lệ.
- **401 Unauthorized:** thiếu hoặc JWT không hợp lệ khi gọi `/profile`.
- **403 Forbidden:** user không phải admin nhưng truy cập `/statistics`.
- **404 Not Found:** không tìm thấy user theo ID.

```json
{
  "message": "User not found with id: 8",
  "success": false
}
```

# 11. PAYMENT – THANH TOÁN

# 💳 Tài liệu Module Payment

## 📚 Tổng quan

Module **Payment** xử lý hai luồng giao dịch hiện có: thanh toán tiền phạt và đăng ký gói thành viên.

Hệ thống chỉ sử dụng **payOS/VietQR**, tiền tệ **VND**. Giao dịch được tạo ở trạng thái chờ, sau đó được xác nhận bằng webhook payOS đã kiểm tra chữ ký hoặc bằng thao tác đối soát chủ động với payOS. Redirect về Frontend không được xem là bằng chứng thanh toán.

## 🎯 Tính năng chính

### 1. Cổng thanh toán duy nhất

- Gateway hỗ trợ: `PAYOS`.
- QR VietQR, checkout URL và order code được tạo từ payOS.
- Không nhận số tiền hoặc danh tính người thanh toán từ Frontend làm nguồn sự thật; Backend tự lấy từ Fine/Subscription và user đang đăng nhập.

### 2. Vòng đời thanh toán đầy đủ

- Trạng thái lưu được: `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED`.
- `SUCCESS` chỉ được ghi sau khi webhook hợp lệ hoặc kết quả đối soát payOS xác nhận đơn đã thanh toán.
- Settlement là idempotent: webhook lặp lại không kích hoạt gói hoặc cộng tiền phạt lần thứ hai.

### 3. Thanh toán liên kết Fine + Subscription

Payment có thể liên kết với:

- Book Loan, dùng cho tiền phạt.
- Subscription, dùng cho membership/plan.
- Entity Fine độc lập.

### 4. Theo dõi và quản trị

- Admin xem danh sách payment có phân trang và sắp xếp.
- USER chỉ xem hoặc đối soát payment thuộc tài khoản của mình.
- Không lưu bí mật payOS trong database hoặc response trả về Frontend.

## 📊 Mô hình dữ liệu

### Entity `Payment`

**Tên bảng:** `payments`

| Field | Type | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `id` | Long | Auto | ID giao dịch |
| `user` | User FK | Required | User thực hiện thanh toán |
| `bookLoan` | BookLoan FK | Optional | Liên kết khi payment là tiền phạt quá hạn |
| `subscription` | Subscription FK | Optional | Liên kết nếu payment cho membership |
| `fine` | Fine FK | Optional | Tham chiếu khoản phạt |
| `paymentType` | Enum | Required | `FINE`, `MEMBERSHIP`… |
| `status` | Enum | Required | `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED` |
| `gateway` | Enum | Required | Chỉ nhận `PAYOS` |
| `amount` | Long | Required | Phải > 0 |
| `currency` | String(3) | Default=`VND` | Mã tiền tệ |
| `transactionId` | String | Optional, Unique | Mã tham chiếu giao dịch |
| `gatewayPaymentId` | String | Optional | Payment link ID từ payOS |
| `gatewayOrderId` | String | Optional, Unique | Order code payOS ở dạng chuỗi |
| `gatewaySignature` | String | Optional | Không trả về Frontend; chỉ dùng khi cần lưu bằng chứng đã xác minh |
| `paymentMethod` | String | Optional | Phương thức thanh toán do gateway cung cấp |
| `metadata` | JSON | Optional | Metadata kỹ thuật không chứa secret |
| `description` | Text | Optional | Mục đích thanh toán |
| `failureReason` | Text | Optional | Lý do thất bại |
| `retryCount` | Integer | Default 0 | Số lần thử lại |
| `initiatedAt` | LocalDateTime | Required | Thời điểm khởi tạo |
| `completedAt` | LocalDateTime | Optional | Chỉ có khi thành công |
| `notificationSent` | Boolean | Default false | Cờ đã gửi notification |
| `active` | Boolean | Default true | Cờ xóa mềm |
| `createdAt` | Timestamp | Auto | Timestamp tạo |
| `updatedAt` | Timestamp | Auto | Thời điểm cập nhật |

### Index và tối ưu

| Index | Column | Mục đích |
| --- | --- | --- |
| `uq_payments_transaction_id` | `transaction_id` | Không cho trùng mã giao dịch; vẫn cho phép nhiều `NULL` |
| `uq_payments_gateway_order_id` | `gateway_order_id` | Không cho một order code payOS ánh xạ sang nhiều payment |
| `idx_payments_fine_gateway_id` | `fine_id, gateway, id` | Tìm payment mới nhất của khoản phạt |
| `idx_payments_subscription_gateway_id` | `subscription_id, gateway, id` | Tìm payment mới nhất của subscription |

## 🔌 API Endpoint

Base URL: `/api/payments`

### 1. Tạo đơn đăng ký gói thành viên

`POST /api/subscriptions/subscribe`

Frontend gửi thông tin gói cần mua. Backend lấy USER đang đăng nhập, giá VND và quyền lợi từ gói trong database rồi tạo payment `PAYOS`. Response `PaymentInitiateResponse` chứa `paymentId`, `orderCode`, `qrCode`, `checkoutUrl`, `amount`, `currency`, `status` và `gateway`.

### 2. Tạo đơn thanh toán tiền phạt

`POST /api/fines/{fineId}/pay`

Backend kiểm tra khoản phạt thuộc USER đang đăng nhập, tự tính số dư còn phải trả và tạo đơn payOS. Client không được quyết định `amount`, `userId` hoặc biên nhận giao dịch.

### 3. Lấy toàn bộ payment – ADMIN

`GET /api/payments?page=0&size=10&sortBy=createdAt&sortDir=DESC`

Tham số thực tế là `page`, `size`, `sortBy`, `sortDir`; `size` tối đa 100. Endpoint chỉ dành cho `ROLE_ADMIN`.

### 4. Xem trạng thái payment

`GET /api/payments/{id}/status`

Trả trạng thái payment thuộc USER đang đăng nhập hoặc cho ADMIN. Endpoint này chỉ đọc dữ liệu hệ thống, không tự xác nhận thanh toán.

### 5. Đối soát chủ động với payOS

`POST /api/payments/{id}/reconcile`

Backend gọi payOS bằng thông tin order đã lưu. Nếu payOS xác nhận `PAID`, hệ thống settlement payment và cập nhật Fine/Subscription trong cùng luồng nghiệp vụ idempotent.

### 6. payOS Webhook Handler

`POST /api/payments/webhook/payos`

Webhook công khai để payOS gửi kết quả giao dịch. Backend bắt buộc:

- xác minh payload bằng Checksum Key qua SDK payOS;
- đối chiếu order code, số tiền, tiền tệ và payment đã lưu;
- xử lý lặp an toàn;
- trả non-2xx nếu commit thất bại để payOS có thể gửi lại.

Response thành công:

```json
{
  "result": "..."
}
```

### 7. Endpoint verify cũ

`POST /api/payments/verify`

Endpoint này đã ngừng sử dụng và trả `410 Gone`. Frontend không được tự gửi kết quả “đã thanh toán”; chỉ webhook đã xác minh hoặc đối soát payOS mới được settlement.

## 🔐 Validation và Business Rule

- Amount phải là số dương (`@Positive`).
- `PaymentType`, `Status`, `Gateway` là field bắt buộc.
- Gateway bắt buộc là `PAYOS`; CHECK constraint MySQL cũng chỉ chấp nhận `PAYOS`.
- Currency của giao dịch mới là `VND`.
- `transaction_id` và `gateway_order_id` không được trùng khi có giá trị.
- USER có gói active không được mua thêm; sau khi hủy gói có thể mua gói mới theo quy tắc đã chốt.
- Chỉ giữ trạng thái `PENDING`/`PROCESSING` khi đang chờ payOS xác nhận.
- Return URL/cancel URL chỉ điều hướng giao diện, không kích hoạt quyền thành viên và không đánh dấu Fine đã trả.

## ⚠️ Xử lý lỗi

- **400 Bad Request:** input hoặc bằng chứng thanh toán không hợp lệ.
- **404 Not Found:** không tìm thấy payment theo ID hoặc transaction.
- **403 Forbidden:** USER truy cập payment không thuộc tài khoản hoặc gọi API ADMIN.
- **409 Conflict:** nghiệp vụ Fine/Subscription không còn cho phép tạo payment.
- **503 Service Unavailable:** payOS tạm lỗi hoặc settlement cần được gửi lại/đối soát.

```json
{
  "error": "Payment requires retry or reconciliation",
  "success": false
}
```

# 12. AUTHENTICATION – XÁC THỰC

# 🔐 Tài liệu Module Authentication

## 📚 Tổng quan

Module **Authentication** quản lý quy trình đăng ký, đăng nhập và khôi phục mật khẩu.

Module đảm bảo tạo tài khoản an toàn, kiểm tra thông tin đăng nhập, reset password dựa trên token và quản lý phiên đăng nhập có kiểm soát. Đây là cổng bảo mật đầu vào của hệ thống, ngăn truy cập trái phép và cung cấp quy trình khôi phục tài khoản có cấu trúc.

## 🎯 Tính năng chính

### 1. Đăng ký user – Sign-Up

- Tạo tài khoản user mới.
- Kiểm tra dữ liệu đầu vào thông qua constraint trong DTO.
- Sau khi đăng ký thành công trả về response phiên xác thực.

### 2. Đăng nhập

- Xác thực bằng Email + Password.
- Khi thành công trả về token payload `AuthResponse`.

### 3. Quên mật khẩu

- Tạo password reset token duy nhất.
- Gửi token qua email để user khôi phục tài khoản an toàn.

### 4. Reset mật khẩu

- Kiểm tra reset token trước khi cập nhật password.
- Token không hợp lệ hoặc hết hạn sẽ bị từ chối an toàn.

## 🔌 API Endpoint

Base URL: `/auth`

### 1. Đăng ký / Sign-Up

`POST /auth/signup`

Tạo tài khoản mới và trả về authentication response.

Request Body (`UserDTO`):

```json
{
  "name": "John Doe",
  "email": "reader@example.com",
  "password": "<YOUR_PASSWORD>",
  "phone": "<PHONE_NUMBER>"
}
```

Response `200 OK`:

```json
{
  "token": "<TOKEN_PLACEHOLDER>",
  "message": "Account created successfully",
  "userId": 15,
  "success": true
}
```

### 2. Đăng nhập

`POST /auth/login`

Xác thực credential của user.

```json
{
  "email": "reader@example.com",
  "password": "<YOUR_PASSWORD>"
}
```

Response:

```json
{
  "token": "<TOKEN_PLACEHOLDER>",
  "message": "Login successful",
  "userId": 15,
  "success": true
}
```

### 3. Quên mật khẩu

`POST /auth/forgot-password`

Tạo reset link/token và gửi qua email.

```json
{
  "email": "reader@example.com"
}
```

Response:

```json
{
  "message": "A Reset link was sent to your email.",
  "success": true
}
```

### 4. Reset mật khẩu

`POST /auth/reset-password`

Reset password bằng token được cung cấp.

```json
{
  "token": "<TOKEN_PLACEHOLDER>",
  "password": "<YOUR_PASSWORD>"
}
```

Response:

```json
{
  "message": "Password reset successful",
  "success": true
}
```

## 🧪 Validation

| Field | Quy tắc |
| --- | --- |
| UserDTO fields | `@Valid` kiểm tra input |
| Email | Bắt buộc đúng định dạng |
| Password | Phải đáp ứng yêu cầu bảo mật |
| Reset token | Phải hợp lệ và còn hiệu lực |

## ⚠️ Error Response & Exception

| Loại lỗi | Nguyên nhân ví dụ |
| --- | --- |
| `UserException` | Sai credential, không tìm thấy email, tài khoản trùng |
| Expired Token | Reset link hết hạn hoặc bị thay đổi |
| Invalid Password | Password quá yếu hoặc trùng password trước đó |

Response lỗi chuẩn:

```json
{
  "message": "Invalid credentials",
  "success": false
}
```

## 🔐 Tóm tắt luồng Authentication

```text
Signup → Tự động trả Auth Response
Login → Trả Token cho Client
Forgot Password → Gửi Token qua Email
Reset Password → Dùng Token → Cập nhật Password
```

# CÔNG NGHỆ SỬ DỤNG

- Spring Boot
- MySQL
- JWT
- Spring Security
- React + Vite
- MUI
- Tailwind CSS
- Redux
- React Router DOM
- Axios
