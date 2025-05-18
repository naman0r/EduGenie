import HeroSection from "@/components/HeroSection";
import GoogleLogin from "@/components/GoogleLogin";
import NavBar from "@/components/NavBar";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-black/[0.96] antialiased ">
        <div>
          <NavBar className="z-100000" />
        </div>

        <HeroSection />
        {/* <GoogleLogin /> */}
      </div>
    </>
  );
}
