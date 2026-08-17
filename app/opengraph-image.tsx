import { ImageResponse } from "next/og";

export const alt = "Food Recommendations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to right, #ea580c, #e11d48)",
        }}
      >
        <div style={{ fontSize: 160 }}>🍽️</div>
        <div style={{ fontSize: 72, fontWeight: 700, color: "white", marginTop: 20 }}>
          Food Recommendations
        </div>
        <div style={{ fontSize: 32, color: "white", opacity: 0.9, marginTop: 10 }}>
          Share and discover the best dishes
        </div>
      </div>
    ),
    { ...size },
  );
}
