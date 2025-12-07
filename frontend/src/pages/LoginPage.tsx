import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 300,
        }
      );
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');

    try {
      const googleToken = response.credential;

      const res = await fetch(`${API_URL}/api/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          google_token: googleToken
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await res.json();

      // Store auth token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.user.username || data.user.email);

      // Redirect to host panel
      navigate('/host-panel');

    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center">Welcome to HostelCore</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the host panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="flex justify-center">
            <div id="googleSignInButton"></div>
          </div>

          {loading && (
            <p className="text-sm text-center text-gray-600">
              Signing in...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;