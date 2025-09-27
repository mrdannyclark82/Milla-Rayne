import React from "react";

const BACKGROUND_IMAGE = "/background.jpg";

export default function MinimalChat() {
  return (
    <div
      className="fixed inset-0 w-full h-full"
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}