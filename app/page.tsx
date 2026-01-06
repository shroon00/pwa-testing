"use client";

import { useState, useEffect } from "react";

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
  const [textToWrite, setTextToWrite] = useState<string>("");
  const [isWriting, setIsWriting] = useState<boolean>(false);

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

  const writeNFC = async () => {
    try {
      if (!textToWrite.trim()) {
        setError("Please enter text to write to NFC");
        return;
      }

      if (!("NDEFReader" in window)) {
        setError("NFC is not supported on this device");
        return;
      }

      setIsWriting(true);
      setError("");
      
      const writer = new (window as any).NDEFReader();
      
      await writer.write({
        records: [{ 
          recordType: "text", 
          data: textToWrite,
          lang: "en"
        }]
      });
      
      setData(`Successfully wrote: ${textToWrite}`);
      setError("");
      setIsWriting(false);
      
      setTextToWrite("");
      
    } catch (err: any) {
      console.error("NFC write error:", err);
      setError(`Write failed: ${err.message}`);
      setIsWriting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2">Write to NFC Tag:</p>
        <textarea
          value={textToWrite}
          onChange={(e) => setTextToWrite(e.target.value)}
          placeholder="Enter text to write to NFC tag..."
          className="w-full p-2 border-2 border-gray-300 rounded mb-2"
          rows={3}
          disabled={isWriting}
        />
        <button
          onClick={writeNFC}
          className="border-2 bg-blue-400 text-white px-4 py-2"
          disabled={!isSupported || isWriting || !textToWrite.trim()}
        >
          {isWriting ? "Writing..." : "Write to NFC"}
        </button>
      </div>

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