"use client";

import { useState } from "react";

export default function Home() {
  const [data, setData] = useState("");
  const [error, setError] = useState("");

  const scanNFC = async () => {
    try {
      if (!("NDEFReader" in window)) {
        setError("NFC is not supported on this device");
        return;
      }

      const reader = new (window as any).NDEFReader();
      await reader.scan();

      reader.onreading = (event: any) => {
        const decoder = new TextDecoder();
        const records = event.message.records;

        for (const record of records) {
          if (record.recordType === "text") {
            const text = decoder.decode(record.data);
            setData(text);
          }
        }
      };
    } catch (err: any) {
      setError(err.message || "NFC scan failed");
    }
  };

  return (
    <div>
      <p>Scan your NFC</p>

      <button
        className="border-2 bg-red-400 text-white px-4 py-2"
        onClick={scanNFC}
      >
        Click me to scan
      </button>

      {data && <p>Data: {data}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
