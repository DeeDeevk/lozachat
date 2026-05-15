import { useNavigate } from "react-router";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-2">
          Trang không tồn tại
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Xin lỗi, link bạn truy cập không có trong hệ thống.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
