import React, { useState } from "react";
import { useShop } from "../context/ShopContext";

export default function LoginPage() {
  const { authRole, navigateTo, signIn, signUp, showToast } = useShop();

  // Mode: "signin", "signup", or "forgot"
  const [mode, setMode] = useState("signin");

  // Sign In State
  const [email, setEmail] = useState(
    authRole === "admin" ? "admin@cloudcloset.com" : "ananya.mehra@atelier.in"
  );
  const [password, setPassword] = useState(
    authRole === "admin" ? "atelier-admin-2025" : "atelier-pass"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Sign Up State (for Customer registration)
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Adjust state during render when authRole changes
  const [prevRole, setPrevRole] = useState(authRole);
  if (authRole !== prevRole) {
    setPrevRole(authRole);
    setAuthError("");
    setMode("signin");
    if (authRole === "admin") {
      setEmail("admin@cloudcloset.com");
      setPassword("atelier-admin-2025");
    } else {
      setEmail("ananya.mehra@atelier.in");
      setPassword("atelier-pass");
    }
  }

  const isAdminRole = authRole === "admin";

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!email || !password) {
      setAuthError("Please provide both email and password.");
      return;
    }

    setIsVerifying(true);
    try {
      if (isAdminRole) {
        await signIn(email, password, "admin");
        showToast("Server authorization verified. Welcome, Administrator.");
        navigateTo("admin");
      } else {
        await signIn(email, password, "customer");
        showToast("Welcome back to CloudCloset! Enjoy shopping.");
        navigateTo("shop");
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed. Please check credentials.");
      showToast(err.message || "Authentication error", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !signUpEmail || !signUpPassword) {
      setAuthError("Please fill out all required fields.");
      return;
    }

    setIsVerifying(true);
    try {
      await signUp(fullName, signUpEmail, phone, signUpPassword);
      showToast("Account created successfully! Welcome to CloudCloset.");
      navigateTo("shop");
    } catch (err) {
      setAuthError(err.message || "Registration failed.");
      showToast(err.message || "Registration error", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex flex-col justify-between font-sans">
      {/* Brand Header */}
      <header className="w-full py-6 px-6 border-b border-[#E8E6E1] bg-[#FAF9F6]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigateTo("role-selection")}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#444748] hover:text-[#111111] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Role Selection</span>
          </button>

          <span
            onClick={() => navigateTo("role-selection")}
            className="font-serif text-2xl uppercase tracking-wider text-[#111111] font-medium cursor-pointer"
          >
            CloudCloset
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 ${
                isAdminRole
                  ? "bg-[#111111] text-[#FAF9F6]"
                  : "bg-[#DCE2CA] text-[#5F6552]"
              }`}
            >
              {isAdminRole ? "Admin Role" : "Customer Role"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 lg:py-14">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#FFFFFF] border border-[#E8E6E1] shadow-xl overflow-hidden">
          {/* Left Column: Atmospheric Brand Panel */}
          <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 bg-[#111111] text-[#FAF9F6] overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBteu3t42MCxwuTk2d6CB689VNYa8ZokE_AN65IsfbO-kggMM3ZjUotvLeM6RTDzCd43Jk9Oj-_tOhQd5IDWM587eO_sDigxtdjkCsMNK-DHCSSLwdTR1YCrXoxdL1m-O_-lOrbsg7_NGvN14bbcG5N9kNYfZDdw6DSPHS9OlOqUosKAJd_utpn7uCZVXmdqzpse6USoDVUwtIx8qIcEchtTXuELf1IwZikAWXr0ggTU7oN6jggkJwqkg"
              alt="Editorial atmosphere"
              className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20"></div>

            {/* Top Stamp */}
            <div className="relative z-10">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#cccccc] block mb-1">
                {isAdminRole ? "Atelier Console" : "CloudMember ID"}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#DCE2CA] font-semibold">
                <span className="material-symbols-outlined text-[16px]">
                  {isAdminRole ? "shield" : "verified"}
                </span>
                <span>{isAdminRole ? "Restricted Governance" : "SS25 Curated Access"}</span>
              </div>
            </div>

            {/* Middle Editorial Text */}
            <div className="relative z-10 my-auto py-10">
              <h2 className="font-serif text-3xl font-normal leading-tight mb-3 text-[#FAF9F6]">
                {isAdminRole
                  ? "Atelier Operations & Inventory Controls."
                  : mode === "signup"
                  ? "Join the CloudCloset Collective."
                  : "Style That Speaks to Your Lifestyle."}
              </h2>
              <p className="font-sans text-xs text-[#cccccc] leading-relaxed font-light">
                {isAdminRole
                  ? "Manage products, update stock levels, supervise customer orders, and maintain atelier catalog standards."
                  : "Discover everyday essentials and contemporary pieces designed for your lifestyle. Engineered with organic fabrics and architectonic precision."}
              </p>
            </div>

            {/* Bottom Stamp */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] uppercase font-bold text-[#aaaaaa]">
              <span>CloudCloset Atelier</span>
              <span>{isAdminRole ? "Staff Portal" : "Client Portal"}</span>
            </div>
          </div>

          {/* Right Column: Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            {/* Context Heading */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B614E]">
                  {isAdminRole ? "Administrative Access" : "Customer Access"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    navigateTo("login", {
                      role: isAdminRole ? "customer" : "admin"
                    })
                  }
                  className="text-[10px] uppercase tracking-wider font-semibold text-[#747878] hover:text-[#111111] underline"
                >
                  Switch to {isAdminRole ? "Customer" : "Admin"} Login
                </button>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl text-[#111111] font-medium">
                {isAdminRole
                  ? "Admin Atelier Sign In"
                  : mode === "signup"
                  ? "Register Customer Account"
                  : "Customer Atelier Sign In"}
              </h1>

              <p className="text-xs text-[#444748] mt-1.5 leading-relaxed">
                {isAdminRole
                  ? "Enter your administrator credentials to manage products, catalog inventory, customer orders, and store operations."
                  : mode === "signup"
                  ? "Create your private profile to explore collections, save curated garments to your wishlist, and enjoy express checkout."
                  : "Sign in as customer to discover collections, explore styles, manage your wishlist, and shop your favourites."}
              </p>
            </div>

            {/* Security Notice for Admin */}
            {isAdminRole && (
              <div className="bg-[#FAF9F6] border border-[#E8E6E1] p-3.5 mb-6 text-xs text-[#444748]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#111111] mb-1">
                  <span className="material-symbols-outlined text-[16px] text-[#5B614E]">
                    verified_user
                  </span>
                  <span>Server-Side Authorization Required</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#747878]">
                  Only accounts with verified administrative roles are permitted access. Regular customer accounts will be rejected by backend authorization checks.
                </p>
                <div className="mt-2 pt-2 border-t border-[#E8E6E1] flex items-center justify-between text-[10px] text-[#111111] font-mono">
                  <span>Demo Admin ID: admin@cloudcloset.com</span>
                  <span className="text-[#5B614E] font-bold">Authorized</span>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {authError && (
              <div className="bg-[#FFDAD6]/40 border border-[#BA1A1A] p-3.5 mb-6 text-xs text-[#BA1A1A] leading-relaxed flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  error
                </span>
                <div>
                  <p className="font-bold text-[11px] uppercase tracking-wider">Access Denied</p>
                  <p className="mt-0.5">{authError}</p>
                </div>
              </div>
            )}

            {/* Form Switcher: Sign In vs Sign Up (for customer) */}
            {mode === "signin" ? (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] block mb-1">
                    {isAdminRole ? "Administrator Email" : "Email Address"} <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center bg-[#F4F3F1] border border-[#E8E6E1] focus-within:border-[#111111]">
                    <span className="material-symbols-outlined absolute left-3 text-[#747878] text-[18px]">
                      {isAdminRole ? "badge" : "mail"}
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isAdminRole ? "admin@cloudcloset.com" : "customer@example.com"}
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-[#111111] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
                      Password <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[10px] text-[#747878] uppercase tracking-wider">
                      {isAdminRole ? "Admin Credential" : "Private Passcode"}
                    </span>
                  </div>
                  <div className="relative flex items-center bg-[#F4F3F1] border border-[#E8E6E1] focus-within:border-[#111111]">
                    <span className="material-symbols-outlined absolute left-3 text-[#747878] text-[18px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs text-[#111111] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#747878] hover:text-[#111111] p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Me & Note */}
                <div className="flex items-center justify-between pt-1 text-xs text-[#444748]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#111111] w-4 h-4"
                    />
                    <span>Remember this session</span>
                  </label>
                  {!isAdminRole && (
                    <button
                      type="button"
                      onClick={() => showToast("Password recovery dispatch sent.")}
                      className="text-[11px] text-[#747878] hover:text-[#111111] underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-[#111111] text-[#FAF9F6] py-4 font-sans text-xs font-bold uppercase tracking-widest hover:bg-[#5B614E] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {isVerifying ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Verifying Authorization...</span>
                    </>
                  ) : (
                    <>
                      <span>{isAdminRole ? "ADMIN LOGIN" : "CUSTOMER LOGIN"}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* CUSTOMER SIGN UP / REGISTRATION */
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] block mb-1">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center bg-[#F4F3F1] border border-[#E8E6E1] focus-within:border-[#111111]">
                    <span className="material-symbols-outlined absolute left-3 text-[#747878] text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ananya Mehra"
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-[#111111] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] block mb-1">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center bg-[#F4F3F1] border border-[#E8E6E1] focus-within:border-[#111111]">
                    <span className="material-symbols-outlined absolute left-3 text-[#747878] text-[18px]">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="ananya.mehra@atelier.in"
                      className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-[#111111] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] block mb-1">
                    Contact Phone
                  </label>
                  <div className="flex items-center bg-[#F4F3F1] border border-[#E8E6E1] focus-within:border-[#111111]">
                    <div className="flex items-center gap-1 pl-3 pr-2 text-xs font-bold text-[#111111] select-none">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full bg-transparent px-2 py-2.5 text-xs text-[#111111] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] block mb-1">
                    Create Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center bg-[#F4F3F1] border border-[#E8E6E1] focus-within:border-[#111111]">
                    <input
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-transparent pl-3 pr-10 py-2.5 text-xs text-[#111111] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 text-[#747878] hover:text-[#111111] p-1"
                      aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showSignUpPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="pt-1 text-xs text-[#444748]">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                      className="accent-[#111111] mt-0.5"
                    />
                    <span>I agree to CloudCloset's Terms of Service and Privacy Policy.</span>
                  </label>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  className="w-full bg-[#111111] text-[#FAF9F6] py-4 font-sans text-xs font-bold uppercase tracking-widest hover:bg-[#5B614E] transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <span>COMPLETE REGISTRATION</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </form>
            )}

            {/* Bottom Role-specific Links & Registration Link */}
            <div className="mt-8 pt-6 border-t border-[#E8E6E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {!isAdminRole ? (
                mode === "signin" ? (
                  <div className="text-[#444748]">
                    <span>New client? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError("");
                        setMode("signup");
                      }}
                      className="font-bold text-[#111111] hover:text-[#5B614E] underline uppercase tracking-wider text-[11px]"
                    >
                      Register an Account
                    </button>
                  </div>
                ) : (
                  <div className="text-[#444748]">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError("");
                        setMode("signin");
                      }}
                      className="font-bold text-[#111111] hover:text-[#5B614E] underline uppercase tracking-wider text-[11px]"
                    >
                      Sign In
                    </button>
                  </div>
                )
              ) : (
                <div className="text-[11px] text-[#747878] italic">
                  Admin roles are strictly governed and provisioned by IT atelier operations.
                </div>
              )}

              <button
                type="button"
                onClick={() => navigateTo("role-selection")}
                className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#5B614E] hover:text-[#111111] transition-colors"
              >
                <span>Return to Role Selection</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Brand Footer */}
      <footer className="w-full py-5 px-6 border-t border-[#E8E6E1] text-center text-xs text-[#747878] font-sans">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] uppercase tracking-wider">
          <span>CloudCloset Atelier · SS25</span>
          <span className="text-[#5B614E] font-medium">Secured Architecture</span>
        </div>
      </footer>
    </div>
  );
}
