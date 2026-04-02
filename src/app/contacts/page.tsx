"use client";

import { useState, useCallback } from "react";
import ContactsTable from "@/components/contacts/contacts-table";
import ApolloImportDialog from "@/components/contacts/apollo-import-dialog";

export default function ContactsPage() {
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImported = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">
            G&eacute;rez vos contacts de prospection
          </p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Importer (Apollo)
        </button>
      </div>
      <ContactsTable key={refreshKey} />
      <ApolloImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={handleImported}
      />
    </div>
  );
}
