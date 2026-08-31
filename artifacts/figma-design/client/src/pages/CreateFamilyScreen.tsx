import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";

export const CreateFamilyScreen = (): JSX.Element => {
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
      <section className="relative flex min-h-[972px] w-full max-w-screen-md flex-col px-5 py-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-[#935bf0] [font-family:'Inter',Helvetica] text-sm mt-4 self-start"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-col items-center mt-16">
          <img
            className="h-20 w-[71px]"
            alt="ShareNote logo"
            src="/figmaAssets/logo---icon-margin.svg"
          />
          <h1 className="mt-6 text-center text-[28px] font-bold leading-9 tracking-[-0.56px] text-[#1c1b1b] [font-family:'Montserrat',Helvetica]">
            Create Your Family
          </h1>
          <p className="mt-3 text-center text-base font-normal leading-6 text-[#4a4454] [font-family:'Inter',Helvetica]">
            Set up your family's shared space.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-10 max-w-sm w-full self-center">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1c1b1b] [font-family:'Inter',Helvetica]">
              Family Name
            </label>
            <Input
              placeholder="e.g. The Smiths"
              className="h-[52px] rounded-2xl border-[#e0d6f7] bg-white px-4 text-sm [font-family:'Inter',Helvetica] focus-visible:ring-[#935bf0]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1c1b1b] [font-family:'Inter',Helvetica]">
              Your Name
            </label>
            <Input
              placeholder="Your full name"
              className="h-[52px] rounded-2xl border-[#e0d6f7] bg-white px-4 text-sm [font-family:'Inter',Helvetica] focus-visible:ring-[#935bf0]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1c1b1b] [font-family:'Inter',Helvetica]">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              className="h-[52px] rounded-2xl border-[#e0d6f7] bg-white px-4 text-sm [font-family:'Inter',Helvetica] focus-visible:ring-[#935bf0]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1c1b1b] [font-family:'Inter',Helvetica]">
              Password
            </label>
            <Input
              type="password"
              placeholder="Create a password"
              className="h-[52px] rounded-2xl border-[#e0d6f7] bg-white px-4 text-sm [font-family:'Inter',Helvetica] focus-visible:ring-[#935bf0]"
            />
          </div>

          <Button
            type="button"
            className="mt-2 h-[52px] w-full rounded-full bg-[#935bf0] text-sm font-normal tracking-[0.14px] text-white shadow-[0px_8px_24px_#935bf040] hover:bg-[#935bf0]/90 [font-family:'Inter',Helvetica]"
          >
            Create Family
          </Button>
        </div>
      </section>
    </main>
  );
};
