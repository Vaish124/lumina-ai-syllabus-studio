import GeminiApiKeyForm from "@/components/GeminiApiKeyForm";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-100">
          API & Keys Configuration
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage integrations and configure Gemini credentials to unlock artificial intelligence features.
        </p>
      </div>

      <div className="border-t border-slate-900 pt-6">
        <GeminiApiKeyForm />
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
