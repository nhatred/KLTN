export default function LikedQuizzes() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Bài quiz được tôi yêu thích</h2>
      <div className="col-span-full text-center text-gray-400">
        <img
          src="/assets/activity3_empty.png"
          alt="empty-quiz"
          className="w-60 mx-auto"
        />
        <p className="mt-2 text-xl font-semibold">
          Bạn chưa yêu thích quiz nào
        </p>
      </div>
    </div>
  );
}
