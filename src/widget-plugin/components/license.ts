interface LicenseVerificationResponse {
  isValid: boolean;
  message?: string;
}

export async function verifyLicense(licenseKey: string): Promise<LicenseVerificationResponse> {
  try {
    const response = await fetch('https://data.yoursizer.com/api/v1/npm/verify-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });

    if (!response.ok) {
      throw new Error('License verification failed');
    }

    const data = await response.json();
    return {
      isValid: data.isValid,
      message: data.message
    };
  } catch (error) {
    console.error('License verification error:', error);
    return {
      isValid: false,
      message: 'Failed to verify license'
    };
  }
} 