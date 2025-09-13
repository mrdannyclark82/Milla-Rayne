import ChatInterface from "@/components/ChatInterface";

const BACKGROUND_IMAGE = "/unnamed.jpg"; // Place your image in client/public/

export default function Home() {
  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        backgroundImage: `url('${BACKGROUND_IMAGE}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <ChatInterface />
    </div>
  );
}