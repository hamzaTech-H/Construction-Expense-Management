import { Button } from "@/components/base/buttons/button";
import { X } from "@untitledui/icons";
import { useTranslation } from "react-i18next";

type ConfirmDeleteModalProps = {
  setIsConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
  id: number;
  entityLabel: string; // e.g. "Projet" or "Dépense"
  onDelete: (id: number) => Promise<void> | void; // deletion function
};

export default function ConfirmDeleteModal({
  setIsConfirmOpen,
  name,
  id,
  entityLabel,
  onDelete,
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg relative">
        {/* Close button */}
        <Button
          color="tertiary"
          size="sm"
          iconLeading={<X data-icon />}
          onClick={() => setIsConfirmOpen(false)}
          aria-label={t("Close modal")}
          className="absolute top-3 right-3"
        />

        {/* Title */}
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          {t("Delete")} {entityLabel}
        </h2>

        {/* Text */}
        <p className="text-sm text-gray-600 mb-4">
          {t("Do you really want to delete")} « {name} » ? {t("This action is permanent and cannot be undone.")}
        </p>

        {/* Buttons */}
        <div className="flex flex-row gap-2 justify-end">
          <Button
            color="secondary"
            size="md"
            onClick={() => setIsConfirmOpen(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            color="primary-destructive"
            size="md"
            onClick={async () => {
              await onDelete(id);
              setIsConfirmOpen(false);
            }}
          >
            {t("Delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
