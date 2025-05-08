import "../style/loading.css";

export default function Loading() {
  return (
    <div className="loader">
      <svg height="0" width="0" viewBox="0 0 64 64" className="absolute">
        <defs xmlns="http://www.w3.org/2000/svg">
          <linearGradient
            gradientUnits="userSpaceOnUse"
            y2="2"
            x2="0"
            y1="62"
            x1="0"
            id="purple-blue"
          >
            <stop stop-color="#973BED"></stop>
            <stop stop-color="#007CFF" offset="1"></stop>
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            y2="0"
            x2="0"
            y1="64"
            x1="0"
            id="yellow-pink"
          >
            <stop stop-color="#FFC800"></stop>
            <stop stop-color="#F0F" offset="1"></stop>
            <animateTransform
              repeatCount="indefinite"
              keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1"
              keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1"
              dur="8s"
              values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32"
              type="rotate"
              attributeName="gradientTransform"
            ></animateTransform>
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            y2="2"
            x2="0"
            y1="62"
            x1="0"
            id="teal-green"
          >
            <stop stop-color="#00E0ED"></stop>
            <stop stop-color="#00DA72" offset="1"></stop>
          </linearGradient>
        </defs>
      </svg>

      {/* <!-- S --> */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 64 64"
        height="64"
        width="64"
        className="inline-block"
      >
        <path
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="8"
          stroke="url(#purple-blue)"
          d="M 48,16 C 48,8 40,4 32,4 24,4 16,8 16,16 c 0,8 8,12 16,16 8,4 16,8 16,16 0,8 -8,12 -16,12 -8,0 -16,-4 -16,-12"
          className="dash"
          pathLength="360"
        ></path>
      </svg>

      {/* <!-- Q --> */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 64 64"
        height="64"
        width="64"
        className="inline-block"
      >
        <path
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="8"
          stroke="url(#yellow-pink)"
          d="M 32,12 C 19.85,12 10,21.85 10,34 c 0,12.15 9.85,22 22,22 12.15,0 22,-9.85 22,-22 C 54,21.85 44.15,12 32,12 Z M 42,42 L 54,54"
          className="spin"
          pathLength="360"
        ></path>
      </svg>

      {/* <!-- U --> */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 64 64"
        height="64"
        width="64"
        className="inline-block"
      >
        <path
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="8"
          stroke="url(#teal-green)"
          d="M 16,12 V 40 c 0,8.84 7.16,16 16,16 8.84,0 16,-7.16 16,-16 V 12"
          className="dash"
          pathLength="360"
        ></path>
      </svg>

      {/* <!-- I --> */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 64 64"
        height="64"
        width="64"
        className="inline-block"
      >
        <path
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="8"
          stroke="url(#purple-blue)"
          d="M 32,12 V 52"
          className="dash"
          pathLength="360"
        ></path>
      </svg>

      {/* <!-- Z --> */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 64 64"
        height="64"
        width="64"
        className="inline-block"
      >
        <path
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="8"
          stroke="url(#yellow-pink)"
          d="M 16,16 H 48 L 16,48 H 48"
          className="dash"
          pathLength="360"
        ></path>
      </svg>

      {/* <!-- Z --> */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 64 64"
        height="64"
        width="64"
        className="inline-block"
      >
        <path
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="8"
          stroke="url(#teal-green)"
          d="M 16,16 H 48 L 16,48 H 48"
          className="dash"
          pathLength="360"
        ></path>
      </svg>
    </div>
  );
}
