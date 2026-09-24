import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import AboutSection from "@/components/home/AboutSection";
import EventIntro from "@/components/home/EventIntro";
import GamesSection from "@/components/home/GamesSection";
import Hero from "@/components/home/Hero";
import Highlights from "@/components/home/Highlights";
import PrizePool from "@/components/home/PrizePool";
import RegistrationCTA from "@/components/home/RegistrationCTA";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function Home(): ReactElement {
  const navigate = useNavigate();
  const openRegistration = (game?: string): void => { void navigate(game ? `/register?game=${game}` : "/register"); };

  return (
    <div data-testid="home-page" className="min-h-screen bg-[#070707] text-[#F5F5F5]">
      <SiteHeader />
      <main>
        <Hero onRegister={() => openRegistration()} />
        <EventIntro />
        <GamesSection onRegister={openRegistration} />
        <PrizePool />
        <Highlights />
        <AboutSection />
        <RegistrationCTA onRegister={() => openRegistration()} />
      </main>
      <SiteFooter />
    </div>
  );
}
