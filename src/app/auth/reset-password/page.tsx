'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { validateForm, commonRules } from '@/lib/validation';
import type { ResetPasswordCredentials, ValidationErrors } from '@/types/auth';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState<ResetPasswordCredentials>({
    email: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const validationRules = {
    email: commonRules.email
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setGeneralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError('');

    // Validate form
    const formErrors = validateForm(formData as unknown as Record<string, string>, validationRules);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Use auth service for password reset
      const authServiceModule = await import('../../../lib/auth-service');
      const response = await authServiceModule.authService.resetPassword(formData.email);

      if (response.success) {
        setIsSuccess(true);
      } else {
        setGeneralError(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      // Simulate resend API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message or update UI
    } catch (error) {
      setGeneralError('Failed to resend email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-light-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-charcoal mb-4">Check Your Email</h1>
          <p className="text-mid-300 mb-6">
            We've sent a password reset link to <strong>{formData.email}</strong>
          </p>
          <p className="text-sm text-mid-300 mb-8">
            Didn't receive the email? Check your spam folder or click below to resend.
          </p>
          
          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              variant="secondary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Resend Email
            </Button>
            
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Reset Password</h1>
          <p className="text-mid-300">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            placeholder="Enter your email"
            autoComplete="email"
          />

          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {generalError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            Send Reset Link
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            href="/auth/login" 
            className="text-brand hover:text-brand/80 font-medium transition-colors"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}