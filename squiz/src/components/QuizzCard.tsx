export default function QuizzCard() {
  return (
    <div className="box-shadow-hover h-56 relative rounded-lg overflow-hidden box-shadow">
      <div className="bg-white h-full w-full absolute flex items-end bottom-0 px-3 pb-8">
        <p className="text-lg font-semibold">Toán Cộng Trừ Nhân Chia</p>
      </div>
      <div className="">
        <img
          className="w-full rounded-edge object-cover"
          src="/assets/unnamed.png"
          alt=""
        />
      </div>
    </div>
  );
}
