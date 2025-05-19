import "../style/answercard.css";

export default function AnswerCard({
  data,
  idx,
  handleChange,
}: any) {
  return (
    <div key={idx} className="p-2 rounded-lg empower_card stats_item">
      <div className="empower_card-background is-pearl">
        <img
          src="/assets/cards/blue.avif"
          loading="lazy"
          alt=""
          className="stats_texture is-darken-20 empower_card-texture _2"
        ></img>
      </div>
      <div className=" empower_card-content">
        <div className=" overflow-hidden  mt-2 border rounded-lg">
          <textarea
            className="text-xl w-full text-center bg-transparent outline-none p-2 flex"
            value={data.text}
            onChange={(e) => handleChange(idx, e.target.value)}
            rows={8}
            placeholder="Nhập câu trả lời ở đây"
            aria-label={`Answer option ${idx + 1}`}
          />
        </div>
      </div>
    </div>
  );
}
