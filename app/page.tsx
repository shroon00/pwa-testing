"use client";

import { useState, useEffect } from "react";

// Define NDEFReader interface for TypeScript
declare global {
  interface Window {
    NDEFReader?: any;
  }
}

export default function Home() {
  const [data, setData] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Check NFC support on component mount
  useEffect(() => {
    const checkNFCSupport = () => {
      if ("NDEFReader" in window) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
      }
    };

    checkNFCSupport();
  }, []);

  const scanNFC = async () => {
    try {
      setError("");
      setData("");
      setIsScanning(true);

      if (!("NDEFReader" in window)) {
        setError("NFC is not supported on this device");
        setIsScanning(false);
        return;
      }

      const reader = new (window as any).NDEFReader();

      // Add error handling
      reader.onreadingerror = (event: any) => {
        console.error("NFC reading error:", event);
        setError(`Read error: ${event.message || "Unknown error"}`);
        setIsScanning(false);
      };

      reader.onreading = (event: any) => {
        console.log("NFC tag detected:", event);
        const decoder = new TextDecoder();
        const records = event.message.records;
        
        let foundData = "";
        
        for (const record of records) {
          console.log("Record type:", record.recordType);
          
          if (record.recordType === "text") {
            const textData = decoder.decode(record.data);
            foundData = textData;
          } 
          else if (record.recordType === "url") {
            const url = decoder.decode(record.data);
            foundData = url;
          }
          else if (record.recordType === "mime" && record.mediaType === "application/json") {
            try {
              const jsonData = JSON.parse(decoder.decode(record.data));
              foundData = JSON.stringify(jsonData);
            } catch (e) {
              foundData = decoder.decode(record.data);
            }
          }
          else {
            foundData = decoder.decode(record.data);
          }
        }
        
        setData(foundData);
        setIsScanning(false);
      };

      await reader.scan();
      
      // Set timeout to stop scanning after 30 seconds
      setTimeout(() => {
        if (isScanning) {
          setIsScanning(false);
          setError("Scan timeout. Please try again.");
        }
      }, 30000);

    } catch (err: any) {
      console.error("NFC scan error:", err);
      setError(err.message || "NFC scan failed");
      setIsScanning(false);
    }
  };

  return (
    <div>
      <p>Scan your NFC</p>

      <button
        className="border-2 bg-red-400 text-white px-4 py-2"
        onClick={scanNFC}
        disabled={!isSupported || isScanning}
      >
        {isScanning ? "Scanning..." : "Click me to scan"}
      </button>

      {!isSupported && (
        <p className="text-yellow-600 mt-2">
          Note: NFC is not supported on this device/browser
        </p>
      )}

      <p>Data: {data}</p>
      <p className="text-red-500">{error}</p>
    </div>
  );
}