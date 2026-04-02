"use client";

interface TemplatePreviewProps {
  subject: string;
  body: string;
  open: boolean;
  onClose: () => void;
}

const SAMPLE_DATA: Record<string, string> = {
  "{firstName}": "Marc",
  "{lastName}": "Dupont",
  "{companyName}": "Tikehau Capital",
  "{role}": "Analyst Private Credit",
  "{city}": "Paris",
  "{senderName}": "Ousmane Thienta",
};

function renderWithVariables(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\{[a-zA-Z]+\})/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const variable = match[1];
    const replacement = SAMPLE_DATA[variable] || variable;
    parts.push(
      <span
        key={`${match.index}-${variable}`}
        className="bg-blue-100 text-blue-700 px-1 rounded"
      >
        {replacement}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function TemplatePreview({
  subject,
  body,
  open,
  onClose,
}: TemplatePreviewProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Aper&ccedil;u du template
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">
              Objet
            </p>
            <p className="text-sm font-medium text-gray-900">
              {renderWithVariables(subject)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">
              Corps
            </p>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {renderWithVariables(body)}
            </div>
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">
              Variables utilis&eacute;es (donn&eacute;es d&apos;exemple) :
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SAMPLE_DATA).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
                >
                  {key} = {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
