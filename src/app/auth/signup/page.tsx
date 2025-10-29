'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import { validateForm, commonRules } from '@/lib/validation';
import type { SignupCredentials, ValidationErrors } from '@/types/auth';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupCredentials>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const validationRules = {
    email: commonRules.email,
    password: commonRules.password,
    confirmPassword: [
      { required: true, message: 'Please confirm your password' },
      {
        custom: (value: string) => value === formData.password,
        message: 'Passwords do not match'
      }
    ],
    username: commonRules.username,
    acceptTerms: [
      {
        custom: () => formData.acceptTerms,
        message: 'You must accept the terms and conditions'
      }
    ]
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    const validationErrors = validateForm(formData as Record<string, any>, validationRules);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Call real register API to create account and set JWT cookies
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
        credentials: 'include',
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        setGeneralError(payload.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      const data = payload.data;

      // Optionally store token client-side for backward compatibility
      if (data?.tokens?.accessToken) {
        localStorage.setItem('auth_token', data.tokens.accessToken);
      }

      // Navigate to dashboard; cookies are set by the server
      router.push('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Create Account</h1>
          <p className="text-mid-300">Join Etheryte and start trading NFTs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={errors.firstName}
              placeholder="First name"
              autoComplete="given-name"
            />

            <Input
              label="Last Name"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={errors.lastName}
              placeholder="Last name"
              autoComplete="family-name"
            />
          </div>

          <Input
            label="Username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            error={errors.username}
            placeholder="Choose a username"
            autoComplete="username"
          />

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

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            placeholder="Create a strong password"
            autoComplete="new-password"
            helperText="Must be at least 8 characters with uppercase, lowercase, and number"
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />

          <div className="flex items-start gap-2">
            <Checkbox
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              error={errors.acceptTerms}
              label="I agree to the Terms of Service and Privacy Policy"
            />
          </div>
          {errors.acceptTerms && (
            <p className="text-red-600 text-sm -mt-4">{errors.acceptTerms}</p>
          )}

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
            Create Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-mid-300">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="text-brand hover:text-brand/80 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}