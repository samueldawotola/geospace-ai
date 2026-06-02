import { auth0 } from "@/lib/auth0";
import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import Profile from "@/components/Profile";

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <main className="min-h-screen bg-[#efefef] flex flex-col items-center justify-center gap-4 px-6 py-12">
      <div className="bg-white rounded-[28px] shadow-[0_4px_32px_rgba(0,0,0,0.08)] px-12 py-14 flex flex-col items-center gap-4 w-[360px]">
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-1">
          <g filter="url(#filter0_di)">
            <rect x="2" y="2" width="64" height="64" rx="16" fill="url(#paint0_linear)"/>
            <rect x="2.5" y="2.5" width="63" height="63" rx="15.5" stroke="#252525"/>
            <path d="M34.0002 18C25.1572 18 18 25.1669 18 34C18 42.8432 25.1672 50 34.0002 50C42.8333 50 50 42.8331 50 34C50 25.1669 42.8433 18 34.0002 18ZM43.9172 43.8971C43.9172 43.9071 43.9069 43.9072 43.9069 43.9172C43.9069 43.9172 43.8969 43.9272 43.8868 43.9272C43.144 44.65 41.9796 44.7303 41.0662 44.2585L40.0228 43.7265C36.2487 41.7792 31.7619 41.7792 27.9777 43.7265L26.9338 44.2585C26.0103 44.7303 24.8459 44.65 24.1132 43.9272C24.1132 43.9272 24.1031 43.9172 24.0931 43.9172C24.0931 43.9172 24.0828 43.9071 24.0828 43.8971C23.3601 43.1543 23.2797 41.9899 23.7515 41.0765L24.2837 40.0326C26.231 36.2585 26.231 31.7717 24.2837 27.9975L23.7515 26.9536C23.2797 26.0302 23.3601 24.8657 24.0828 24.133C24.0828 24.1229 24.0931 24.123 24.0931 24.123C24.0931 24.123 24.1031 24.1129 24.1132 24.1129C24.856 23.3902 26.0204 23.3099 26.9338 23.7817L27.9777 24.3137C31.7518 26.261 36.2386 26.261 40.0228 24.3137L41.0662 23.7817C41.9897 23.3099 43.1541 23.3902 43.8868 24.1129C43.8868 24.1129 43.8969 24.123 43.9069 24.123L43.9172 24.133C44.6399 24.8758 44.7203 26.0402 44.2485 26.9536L43.7163 27.9975C41.769 31.7717 41.769 36.2585 43.7163 40.0326L44.2485 41.0765C44.7203 41.9899 44.6499 43.1543 43.9172 43.8971Z" fill="white"/>
          </g>
          <defs>
            <filter id="filter0_di" x="0" y="0" width="68" height="68" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feMorphology radius="2" operator="dilate" in="SourceAlpha" result="effect1_dropShadow"/>
              <feOffset/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.117647 0 0 0 0 0.129412 0 0 0 0 0.164706 0 0 0 0.12 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dy="-1"/>
              <feGaussianBlur stdDeviation="0.5"/>
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
              <feBlend mode="normal" in2="shape" result="effect2_innerShadow"/>
            </filter>
            <linearGradient id="paint0_linear" x1="34" y1="2" x2="34" y2="66" gradientUnits="userSpaceOnUse">
              <stop/>
              <stop offset="1" stopColor="#677190"/>
            </linearGradient>
          </defs>
        </svg>

        {user ? (
          <>
            <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">Your account</h1>
            <div className="w-full h-px bg-gray-100" />
            <Profile />
            <LogoutButton />
          </>
        ) : (
          <>
            <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">Welcome to Sample0</h1>
            <p className="text-[13px] text-gray-400 text-center leading-relaxed -mt-2">
              Get started by logging in to your account
            </p>
            <div className="h-3" />
            <LoginButton />
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
        <span>Powered by</span>
        <img
          src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-onlight.svg"
          alt="Auth0"
          className="h-3 opacity-40"
        />
      </div>
    </main>
  );
}