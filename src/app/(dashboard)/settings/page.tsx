import { SettingsView } from "@/components/settings-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - FreelancerCRM",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <SettingsView />
    </div>
  );
} 