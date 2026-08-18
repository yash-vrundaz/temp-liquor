import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070707",
          border: "6px solid #c9a962",
          borderRadius: 36,
          color: "#c9a962",
          fontSize: 108,
          fontWeight: 700,
          fontFamily: "Georgia, 'Times New Roman', serif",
          letterSpacing: "-0.04em",
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
