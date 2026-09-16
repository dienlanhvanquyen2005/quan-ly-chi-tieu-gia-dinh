# Quản lý chi tiêu gia đình

Website quản lý thu nhập và chi tiêu gia đình, chạy bằng Node.js + Express và lưu dữ liệu vào file JSON trên máy chủ.

## Chạy trên máy tính

1. Cài Node.js LTS.
2. Mở CMD tại thư mục dự án.
3. Chạy:
   npm install
   npm start
4. Mở trình duyệt: http://localhost:3000

## Lưu dữ liệu lâu dài

Dữ liệu nằm trong `data/transactions.json`. Khi triển khai Railway, nên gắn **Volume** và đặt biến môi trường:

`DATA_DIR=/data`

Như vậy dữ liệu sẽ nằm trên volume thay vì filesystem tạm của container.

## Chức năng

- Nhập lương/thu nhập.
- Thêm khoản chi.
- Tự tính tổng thu, tổng chi, số dư.
- Tìm kiếm nội dung.
- Lọc từ ngày đến ngày.
- Lọc theo loại giao dịch.
- Xóa giao dịch.
- Sao lưu/khôi phục JSON.
- Lưu dữ liệu phía máy chủ.
