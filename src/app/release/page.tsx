import { LiabilityForm } from "../../components/LiabilityForm";
import combinedText from "../../data/combinedReleaseText";

export default function ReleasePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <LiabilityForm
        formId="combined"
        title="New City Church's 2025 Summer Camp Liability Release"
        description="🌟 👉 Pro tip: A parent / guardian can digitally sign this form once for all their campers."
        liabilityText={combinedText}
        
      />
    </div>
  );
}
