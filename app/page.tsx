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
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("");

  // Check NFC support on component mount
  useEffect(() => {
    const checkNFCSupport = () => {
      if ("NDEFReader" in window) {
        setIsSupported(true);
        
        // Check NFC permission
        if (navigator.permissions) {
          navigator.permissions.query({ name: "nfc" as PermissionName })
            .then((permissionStatus) => {
              setPermissionStatus(permissionStatus.state);
              permissionStatus.onchange = () => {
                setPermissionStatus(permissionStatus.state);
              };
            })
            .catch(() => {
              // Permission API might not support 'nfc' query
            });
        }
      } else {
        setIsSupported(false);
        setError("Web NFC is not supported on this device/browser");
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
        setError("Web NFC is not supported on this device/browser");
        setIsScanning(false);
        return;
      }

      // Request NFC permission
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ 
            name: "nfc" as PermissionName 
          });
          if (permission.state === "denied") {
            setError("NFC permission denied. Please enable in browser settings.");
            setIsScanning(false);
            return;
          }
        } catch (err) {
          // Permission query might fail, continue anyway
        }
      }

      const reader = new (window as any).NDEFReader();

      // Add error handling for scanning
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
            foundData = `Text: ${textData}`;
          } 
          else if (record.recordType === "url") {
            const url = decoder.decode(record.data);
            foundData = `URL: ${url}`;
          }
          else if (record.recordType === "mime" && record.mediaType === "application/json") {
            try {
              const jsonData = JSON.parse(decoder.decode(record.data));
              foundData = `JSON: ${JSON.stringify(jsonData)}`;
            } catch (e) {
              foundData = `MIME Data: ${decoder.decode(record.data)}`;
            }
          }
          else {
            foundData = `Type: ${record.recordType}, Data: ${decoder.decode(record.data)}`;
          }
        }
        
        setData(foundData);
        setIsScanning(false);
        
        // Optional: Stop scanning after successful read
        reader.stop?.();
      };

      await reader.scan();
      
      // Set timeout to stop scanning after 30 seconds
      setTimeout(() => {
        if (isScanning) {
          reader.stop?.();
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

  const stopScanning = () => {
    setIsScanning(false);
    setError("Scanning stopped");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">NFC Scanner</h1>
        <p className="text-gray-600 mb-8">Tap an NFC tag to read its data</p>

        {/* Status Indicators */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Web NFC Support:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isSupported ? "Supported ✓" : "Not Supported ✗"}
            </span>
          </div>
          
          {isSupported && permissionStatus && (
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Permission:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                permissionStatus === 'granted' ? 'bg-green-100 text-green-800' :
                permissionStatus === 'prompt' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {permissionStatus.charAt(0).toUpperCase() + permissionStatus.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Scan Button */}
        <button
          onClick={scanNFC}
          disabled={!isSupported || isScanning}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center mb-4 ${
            !isSupported || isScanning
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl active:scale-95"
          }`}
        >
          {isScanning ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning... Bring NFC Tag Close
            </>
          ) : (
            <>
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Start NFC Scan
            </>
          )}
        </button>

        {/* Stop Button (when scanning) */}
        {isScanning && (
          <button
            onClick={stopScanning}
            className="w-full py-3 px-6 rounded-xl font-semibold text-lg bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 mb-6"
          >
            Stop Scanning
          </button>
        )}

        {/* Data Display */}
        {data && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="font-semibold text-green-800 mb-2">Scanned Data:</h3>
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-gray-800 font-mono break-all">{data}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">How to use:</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className=" w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 shrink-0">1</span>
              Click "Start NFC Scan" button
            </li>
            <li className="flex items-start">
              <span className=" w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 shrink-0">2</span>
              Bring your phone close to an NFC tag
            </li>
            <li className="flex items-start">
              <span className=" w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 shrink-0">3</span>
              Data will appear automatically
            </li>
          </ul>
        </div>

        {/* Browser Compatibility */}
        <div className="mt-6 text-sm text-gray-500">
          <p>Supported on Chrome for Android 89+ with NFC hardware.</p>
          <p>Make sure NFC is enabled in your phone settings.</p>
        </div>
      </div>
    </div>
  );
}