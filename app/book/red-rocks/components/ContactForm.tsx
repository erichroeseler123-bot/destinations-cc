"use client";

type ContactFormProps = {
  name: string;
  email: string;
  phone: string;
  complete?: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
};

export default function ContactForm({
  name,
  email,
  phone,
  complete = false,
  onNameChange,
  onEmailChange,
  onPhoneChange,
}: ContactFormProps) {
  return (
    <div>
      <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
        {complete ? "Contact ready" : "Finish contact info to unlock payment"}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
      <label className="block text-sm font-bold text-white">
        Full name
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoComplete="name"
          placeholder="Your full name"
          className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500"
        />
      </label>
      <label className="block text-sm font-bold text-white">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500"
        />
      </label>
      <label className="block text-sm font-bold text-white">
        Phone
        <input
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          autoComplete="tel"
          inputMode="tel"
          placeholder="(555) 555-5555"
          className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500"
        />
      </label>
      </div>
    </div>
  );
}
