import React, { useState } from "react";
import { useShop } from "../context/ShopContext";

export default function AuthPage() {
  const { signIn, signUp, setActivePage, showToast } = useShop();

  const [mode, setMode] = useState("signin"); // "signin", "signup", or "forgot"
  
  // Sign in form state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up form state
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-surface-variant" };
    if (pass.length < 6) return { score: 1, label: "Weak", color: "bg-error" };
    if (pass.length < 10) return { score: 2, label: "Fair", color: "bg-yellow-600" };
    return { score: 3, label: "Strong", color: "bg-secondary" };
  };

  const strength = getPasswordStrength(signUpPassword);

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    if (signInEmail && signInPassword) {
      signIn(signInEmail, signInPassword);
    }
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    if (fullName && signUpEmail && signUpPassword) {
      signUp(fullName, signUpEmail, phone, signUpPassword);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (forgotEmail) {
      setForgotSubmitted(true);
      showToast(`Password reset link dispatched to ${forgotEmail}`);
    }
  };

  const handleGoogleAuth = () => {
    signIn("member.google@atelier.in", "oauth_token");
  };

  return (
    <div className="w-full min-h-[calc(100vh-160px)] bg-surface py-space-lg flex items-center justify-center px-margin-mobile lg:px-margin">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-surface-container-lowest border border-surface-variant shadow-xl overflow-hidden">
        {/* Left Column: Editorial Atmospheric Brand Panel */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-space-xl bg-[#111111] text-[#faf9f6] overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBteu3t42MCxwuTk2d6CB689VNYa8ZokE_AN65IsfbO-kggMM3ZjUotvLeM6RTDzCd43Jk9Oj-_tOhQd5IDWM587eO_sDigxtdjkCsMNK-DHCSSLwdTR1YCrXoxdL1m-O_-lOrbsg7_NGvN14bbcG5N9kNYfZDdw6DSPHS9OlOqUosKAJd_utpn7uCZVXmdqzpse6USoDVUwtIx8qIcEchtTXuELf1IwZikAWXr0ggTU7oN6jggkJwqkg"
            alt="Editorial atmosphere"
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          {/* Top Stamp */}
          <div className="relative z-10">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#cccccc] block mb-1">
              CloudMember ID
            </span>
            <div className="flex items-center gap-1.5 text-xs text-secondary-fixed font-semibold">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              SS25 Curated Access
            </div>
          </div>

          {/* Middle Manifesto */}
          <div className="relative z-10 my-auto py-space-xl">
            <h2 className="font-serif text-3xl font-normal leading-tight mb-space-sm text-[#faf9f6]">
              {mode === "signin"
                ? "Curated Luxury at Your Command."
                : mode === "signup"
                ? "Join the CloudCloset Collective."
                : "Reset Your Atelier Access."}
            </h2>
            <p className="font-sans text-xs text-[#cccccc] leading-relaxed max-w-xs font-light">
              Early access to limited capsule releases, private salon previews, bespoke tailoring perks, and complimentary white-glove delivery nationwide.
            </p>
          </div>

          {/* Bottom Stamp */}
          <div className="relative z-10 pt-space-md border-t border-white/10 flex items-center justify-between text-[10px] uppercase font-bold text-[#aaaaaa]">
            <span>Ethical Indian Provenance</span>
            <span>No. 2025/CL</span>
          </div>
        </div>

        {/* Right Column: Authentication Form Panel */}
        <div className="lg:col-span-7 p-space-md sm:p-space-xl flex flex-col justify-between">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-space-lg">
            <button
              onClick={() => setActivePage("home")}
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-xs uppercase tracking-wider font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Return to Store
            </button>

            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Member Portal
            </div>
          </div>

          {/* Mode Switcher Tabs (when not in forgot-password mode) */}
          {mode !== "forgot" ? (
            <div className="flex border-b border-surface-variant mb-space-lg">
              <button
                onClick={() => setMode("signin")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${
                  mode === "signin"
                    ? "border-primary text-primary"
                    : "border-transparent text-outline hover:text-on-surface"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${
                  mode === "signup"
                    ? "border-primary text-primary"
                    : "border-transparent text-outline hover:text-on-surface"
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="mb-space-lg pb-3 border-b border-surface-variant flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Password Recovery
              </span>
              <button
                onClick={() => {
                  setMode("signin");
                  setForgotSubmitted(false);
                }}
                className="text-xs uppercase text-secondary font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Back to Sign In
              </button>
            </div>
          )}

          {/* Form Content */}
          <div className="max-w-md w-full mx-auto">
            {mode === "signin" ? (
              /* SIGN IN FORM */
              <div>
                <div className="mb-space-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">
                    Private Access
                  </span>
                  <h1 className="font-serif text-3xl text-primary font-normal">
                    Welcome Back
                  </h1>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Sign in to access your curated wardrobe, saved wishlists, and seasonal allocations.
                  </p>
                </div>

                <form onSubmit={handleSignInSubmit} className="space-y-space-md">
                  {/* Email */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1">
                      Email Address <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center bg-surface-container-low border border-surface-variant focus-within:border-primary">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                        mail
                      </span>
                      <input
                        type="email"
                        required
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="ananya.mehra@atelier.in"
                        className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        Password <span className="text-error">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[10px] uppercase text-outline hover:text-primary tracking-wider underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center bg-surface-container-low border border-surface-variant focus-within:border-primary">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                        lock
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs text-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-on-surface-variant hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface-variant">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="accent-primary w-4 h-4"
                      />
                      <span>Keep me signed in for 30 days</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary py-3.5 font-sans text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </form>
              </div>
            ) : mode === "signup" ? (
              /* SIGN UP FORM */
              <div>
                <div className="mb-space-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">
                    Membership Registration
                  </span>
                  <h1 className="font-serif text-3xl text-primary font-normal">
                    Create Your Account
                  </h1>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Begin your journey into considered fashion, architectural draping, and archival seasonal capsules.
                  </p>
                </div>

                <form onSubmit={handleSignUpSubmit} className="space-y-space-md">
                  {/* Full Name */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1">
                      Full Name
                    </label>
                    <div className="relative flex items-center bg-surface-container-low border border-surface-variant focus-within:border-primary">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                        person
                      </span>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ananya Mehra"
                        className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center bg-surface-container-low border border-surface-variant focus-within:border-primary">
                      <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                        alternate_email
                      </span>
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="ananya.mehra@atelier.in"
                        className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone with +91 Country Tag */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1">
                      Contact Number <span className="text-[10px] text-secondary font-normal lowercase tracking-normal">(instant SMS dispatch)</span>
                    </label>
                    <div className="flex items-center bg-surface-container-low border border-surface-variant focus-within:border-primary">
                      <div className="flex items-center gap-1 pl-3 pr-2 text-xs font-bold text-primary select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                        className="w-full bg-transparent px-2 py-2.5 text-xs text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password with Strength Indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        Secret Passcode
                      </label>
                      <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                        {strength.label}
                      </span>
                    </div>
                    <div className="relative flex items-center bg-surface-container-low border border-surface-variant focus-within:border-primary">
                      <input
                        type={showSignUpPassword ? "text" : "password"}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full bg-transparent px-3 py-2.5 text-xs text-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 text-on-surface-variant hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showSignUpPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>

                    {/* 3-Bar Strength Gauge */}
                    <div className="grid grid-cols-3 gap-1 mt-1.5 h-1">
                      <div className={`h-full ${strength.score >= 1 ? strength.color : "bg-surface-variant"}`}></div>
                      <div className={`h-full ${strength.score >= 2 ? strength.color : "bg-surface-variant"}`}></div>
                      <div className={`h-full ${strength.score >= 3 ? strength.color : "bg-surface-variant"}`}></div>
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2 pt-1 text-xs text-on-surface-variant">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newsletter}
                        onChange={(e) => setNewsletter(e.target.checked)}
                        className="accent-primary mt-0.5"
                      />
                      <span>Subscribe to seasonal drop previews and archival essays.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        required
                        className="accent-primary mt-0.5"
                      />
                      <span>
                        I agree to CloudCloset's Terms of Service and Privacy Policy.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary py-3.5 font-sans text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    Create CloudCloset Account
                  </button>
                </form>
              </div>
            ) : (
              /* FORGOT PASSWORD FORM */
              <div>
                <div className="mb-space-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">
                    Security Verification
                  </span>
                  <h1 className="font-serif text-3xl text-primary font-normal">
                    Reset Password
                  </h1>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Provide your registered atelier email address and we will dispatch secure instructions to reset your passcode.
                  </p>
                </div>

                {forgotSubmitted ? (
                  <div className="bg-secondary-container/40 border border-secondary p-space-md text-xs text-on-surface space-y-3">
                    <div className="flex items-center gap-2 text-secondary font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                      Reset Link Dispatched
                    </div>
                    <p className="leading-relaxed">
                      We have transmitted a secure password reset link to <strong>{forgotEmail}</strong>. Please check your inbox and junk folder.
                    </p>
                    <button
                      onClick={() => {
                        setMode("signin");
                        setForgotSubmitted(false);
                      }}
                      className="w-full bg-primary text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-space-md">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1">
                        Registered Email
                      </label>
                      <div className="relative flex items-center bg-surface-container-low border border-surface-variant focus-within:border-primary">
                        <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                          mail
                        </span>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="ananya.mehra@atelier.in"
                          className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary text-on-primary py-3.5 font-sans text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
                    >
                      Dispatch Reset Link
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Social Authentication (Only in signin or signup mode) */}
            {mode !== "forgot" && (
              <>
                <div className="relative my-space-lg flex items-center justify-center">
                  <div className="w-full h-px bg-surface-variant"></div>
                  <span className="absolute px-space-md bg-surface-container-lowest text-[10px] font-bold text-outline uppercase tracking-widest">
                    or continue with
                  </span>
                </div>

                <button
                  onClick={handleGoogleAuth}
                  type="button"
                  className="w-full bg-surface-container-low hover:bg-surface-container-high transition-colors py-2.5 px-space-md flex items-center justify-center gap-space-sm border border-surface-variant text-xs font-semibold uppercase tracking-wider text-primary"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
