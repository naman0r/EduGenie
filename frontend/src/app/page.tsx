import HeroSection from "@/components/HeroSection";
import GoogleLogin from "@/components/GoogleLogin";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-black/[0.96] antialiased ">
        <HeroSection />
        {/* <GoogleLogin /> */}
      </div>
    </>
  );
}
