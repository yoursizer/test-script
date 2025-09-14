import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import React from "react"
interface LicenseOverlayProps {
  licenseStatus: { isValid: boolean; message?: string } | null;
  onClose: () => void;
  onRetry?: () => void;
  isVisible: boolean;
  isChecking?: boolean;
}

export function LicenseOverlay({ licenseStatus, onClose, onRetry, isVisible, isChecking = false }: LicenseOverlayProps) {
  // Don't show overlay if license is valid or if we're checking
  if (!licenseStatus || licenseStatus.isValid || isChecking) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">License Issue</h2>
                  <p className="text-sm text-gray-600">YourSizer Widget</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  License Verification Failed
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {licenseStatus.message || "Unable to verify your license. Please check your license key and try again."}
                </p>
              </div>

              {/* Error Details */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 mb-1">Common causes:</p>
                    <ul className="text-red-700 space-y-1">
                      <li>• Invalid or expired license key</li>
                      <li>• Network connectivity issues</li>
                      <li>• Server maintenance</li>
                      <li>• License usage limit exceeded</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Need help? Contact{" "}
                  <a 
                    href="mailto:support@yoursizer.com" 
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    support@yoursizer.com
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 