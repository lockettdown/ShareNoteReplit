import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export const LoginScreen = (): JSX.Element => {
  const [, navigate] = useLocation();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[linear-gradient(0deg,rgba(244,240,255,1)_0%,rgba(244,240,255,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] pb-[97.19px] pt-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-10%] top-[-9.09%] h-[35.92%] w-[98.46%] rounded-full bg-[#d4bbff] opacity-50 blur-[32px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[11.54%] top-[64.08%] h-[35.92%] w-[98.46%] rounded-full bg-[#a4c9ff] opacity-50 blur-[32px]"
      />
      <section className="relative flex min-h-[972px] w-full max-w-screen-md flex-col justify-between px-5 py-12">
        <div aria-hidden="true" className="h-[220px] w-full shrink-0" />
        <header className="flex w-full flex-col items-center">
          <img
            className="relative z-[1] h-36 w-32"
            alt="ShareNote logo"
            src="/figmaAssets/logo---icon-margin.svg"
          />
          <div className="relative z-0 flex max-w-sm flex-col items-center pt-8">
            <h1 className="mt-[-1px] whitespace-nowrap text-center text-[32px] font-bold leading-10 tracking-[-0.64px] text-[#1c1b1b] [font-family:'Montserrat',Helvetica]">
              ShareNote
            </h1>
            <p className="mt-4 text-center text-lg font-normal leading-[26px] text-[#4a4454] [font-family:'Inter',Helvetica]">
              Welcome to your family&apos;s new home.
              <br />
              Coordinate, connect, and simplify.
            </p>
          </div>
        </header>
        <div aria-hidden="true" className="h-[220px] w-full shrink-0" />
        <nav
          aria-label="Account actions"
          className="flex w-full max-w-sm flex-col gap-4 self-center pb-8"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/create-family")}
            className="h-[52px] w-full rounded-full bg-[#935bf0] px-0 py-0 text-sm font-normal tracking-[0.14px] text-white shadow-[0px_8px_24px_#935bf040] hover:bg-[#935bf0]/90 [font-family:'Inter',Helvetica]"
          >
            Create Family
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/sign-in")}
            className="h-[52px] w-full rounded-full border border-[#935bf0] bg-white px-0 py-0 text-sm font-normal tracking-[0.14px] text-[#935bf0] shadow-[0px_4px_20px_#935bf014] hover:bg-white/90 [font-family:'Inter',Helvetica]"
          >
            Sign In
          </Button>
        </nav>
      </section>
    </main>
  );
};
