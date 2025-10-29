'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface SystemSettings {
  platform: {
    name: string;
    description: string;
    logoUrl: string;
    faviconUrl: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
  };
  fees: {
    transactionFee: number;
    listingFee: number;
    auctionFee: number;
    withdrawalFee: number;
    minimumWithdrawal: number;
    maximumWithdrawal: number;
  };
  limits: {
    maxFileSize: number;
    maxNftsPerUser: number;
    maxAuctionsPerUser: number;
    maxBidsPerAuction: number;
    auctionDurationMin: number;
    auctionDurationMax: number;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorRequired: boolean;
    ipWhitelist: string[];
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    adminAlerts: boolean;
    userWelcomeEmail: boolean;
    transactionEmails: boolean;
  };
  integrations: {
    stripeEnabled: boolean;
    stripePublicKey: string;
    stripeSecretKey: string;
    ipfsEnabled: boolean;
    ipfsGateway: string;
    blockchainNetwork: string;
    contractAddress: string;
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('platform');
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [router]);

  const handleSettingChange = (category: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;

    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleArrayChange = (category: keyof SystemSettings, key: string, index: number, value: string) => {
    if (!settings) return;

    const currentArray = (settings[category] as any)[key] as string[];
    const newArray = [...currentArray];
    newArray[index] = value;

    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: newArray
      }
    }));
    setHasChanges(true);
  };

  const addArrayItem = (category: keyof SystemSettings, key: string) => {
    if (!settings) return;

    const currentArray = (settings[category] as any)[key] as string[];
    const newArray = [...currentArray, ''];

    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: newArray
      }
    }));
    setHasChanges(true);
  };

  const removeArrayItem = (category: keyof SystemSettings, key: string, index: number) => {
    if (!settings) return;

    const currentArray = (settings[category] as any)[key] as string[];
    const newArray = currentArray.filter((_, i) => i !== index);

    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: newArray
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setHasChanges(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    const confirmed = confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/settings/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset settings');
      }

      fetchSettings();
      setHasChanges(false);
      alert('Settings reset to defaults successfully!');
    } catch (error) {
      console.error('Error resetting settings:', error);
      alert('Failed to reset settings');
    }
  };

  const tabs = [
    { id: 'platform', label: 'Platform', icon: '🏢' },
    { id: 'fees', label: 'Fees & Limits', icon: '💰' },
    { id: 'limits', label: 'System Limits', icon: '⚡' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '📧' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-light-200 rounded w-64"></div>
            <div className="bg-white rounded-xl p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-charcoal mb-2">Access Error</h2>
            <p className="text-mid-300 mb-6">{error}</p>
            <Button variant="primary" onClick={() => router.push('/dashboard/admin')}>
              Back to Admin Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-light-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">System Settings</h1>
            <p className="text-mid-300">Configure platform settings and preferences</p>
          </div>
          <div className="flex gap-3">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={() => fetchSettings()}
                disabled={isSaving}
              >
                Discard Changes
              </Button>
            )}
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={resetSettings}
              disabled={isSaving}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="primary"
              onClick={saveSettings}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600 border border-primary-200'
                        : 'text-mid-300 hover:bg-light-50 hover:text-charcoal'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {activeTab === 'platform' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-charcoal mb-4">Platform Settings</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Platform Name</label>
                      <input
                        type="text"
                        value={settings.platform.name}
                        onChange={(e) => handleSettingChange('platform', 'name', e.target.value)}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Support Email</label>
                      <input
                        type="email"
                        value={settings.platform.supportEmail}
                        onChange={(e) => handleSettingChange('platform', 'supportEmail', e.target.value)}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Platform Description</label>
                    <textarea
                      value={settings.platform.description}
                      onChange={(e) => handleSettingChange('platform', 'description', e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Logo URL</label>
                      <input
                        type="url"
                        value={settings.platform.logoUrl}
                        onChange={(e) => handleSettingChange('platform', 'logoUrl', e.target.value)}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Favicon URL</label>
                      <input
                        type="url"
                        value={settings.platform.faviconUrl}
                        onChange={(e) => handleSettingChange('platform', 'faviconUrl', e.target.value)}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={settings.platform.maintenanceMode}
                        onChange={(e) => handleSettingChange('platform', 'maintenanceMode', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="maintenanceMode" className="text-sm font-medium text-charcoal">
                        Maintenance Mode
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="registrationEnabled"
                        checked={settings.platform.registrationEnabled}
                        onChange={(e) => handleSettingChange('platform', 'registrationEnabled', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="registrationEnabled" className="text-sm font-medium text-charcoal">
                        Allow New Registrations
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="emailVerificationRequired"
                        checked={settings.platform.emailVerificationRequired}
                        onChange={(e) => handleSettingChange('platform', 'emailVerificationRequired', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="emailVerificationRequired" className="text-sm font-medium text-charcoal">
                        Require Email Verification
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'fees' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-charcoal mb-4">Fees & Limits</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Transaction Fee (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={settings.fees.transactionFee}
                        onChange={(e) => handleSettingChange('fees', 'transactionFee', parseFloat(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Listing Fee ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.fees.listingFee}
                        onChange={(e) => handleSettingChange('fees', 'listingFee', parseFloat(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Auction Fee (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={settings.fees.auctionFee}
                        onChange={(e) => handleSettingChange('fees', 'auctionFee', parseFloat(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Withdrawal Fee ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.fees.withdrawalFee}
                        onChange={(e) => handleSettingChange('fees', 'withdrawalFee', parseFloat(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Minimum Withdrawal ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.fees.minimumWithdrawal}
                        onChange={(e) => handleSettingChange('fees', 'minimumWithdrawal', parseFloat(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Maximum Withdrawal ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.fees.maximumWithdrawal}
                        onChange={(e) => handleSettingChange('fees', 'maximumWithdrawal', parseFloat(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'limits' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-charcoal mb-4">System Limits</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Max File Size (MB)</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.maxFileSize}
                        onChange={(e) => handleSettingChange('limits', 'maxFileSize', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Max NFTs per User</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.maxNftsPerUser}
                        onChange={(e) => handleSettingChange('limits', 'maxNftsPerUser', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Max Auctions per User</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.maxAuctionsPerUser}
                        onChange={(e) => handleSettingChange('limits', 'maxAuctionsPerUser', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Max Bids per Auction</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.maxBidsPerAuction}
                        onChange={(e) => handleSettingChange('limits', 'maxBidsPerAuction', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Min Auction Duration (hours)</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.auctionDurationMin}
                        onChange={(e) => handleSettingChange('limits', 'auctionDurationMin', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Max Auction Duration (hours)</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.auctionDurationMax}
                        onChange={(e) => handleSettingChange('limits', 'auctionDurationMax', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-charcoal mb-4">Security Settings</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Password Min Length</label>
                      <input
                        type="number"
                        min="6"
                        max="50"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Max Login Attempts</label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Lockout Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        value={settings.security.lockoutDuration}
                        onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                        className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="twoFactorRequired"
                      checked={settings.security.twoFactorRequired}
                      onChange={(e) => handleSettingChange('security', 'twoFactorRequired', e.target.checked)}
                      className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="twoFactorRequired" className="text-sm font-medium text-charcoal">
                      Require Two-Factor Authentication
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">IP Whitelist</label>
                    <div className="space-y-2">
                      {settings.security.ipWhitelist.map((ip, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={ip}
                            onChange={(e) => handleArrayChange('security', 'ipWhitelist', index, e.target.value)}
                            placeholder="192.168.1.1"
                            className="flex-1 p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeArrayItem('security', 'ipWhitelist', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addArrayItem('security', 'ipWhitelist')}
                      >
                        Add IP Address
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-charcoal mb-4">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="emailEnabled"
                        checked={settings.notifications.emailEnabled}
                        onChange={(e) => handleSettingChange('notifications', 'emailEnabled', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="emailEnabled" className="text-sm font-medium text-charcoal">
                        Enable Email Notifications
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="smsEnabled"
                        checked={settings.notifications.smsEnabled}
                        onChange={(e) => handleSettingChange('notifications', 'smsEnabled', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="smsEnabled" className="text-sm font-medium text-charcoal">
                        Enable SMS Notifications
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="pushEnabled"
                        checked={settings.notifications.pushEnabled}
                        onChange={(e) => handleSettingChange('notifications', 'pushEnabled', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="pushEnabled" className="text-sm font-medium text-charcoal">
                        Enable Push Notifications
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="adminAlerts"
                        checked={settings.notifications.adminAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'adminAlerts', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="adminAlerts" className="text-sm font-medium text-charcoal">
                        Send Admin Alerts
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="userWelcomeEmail"
                        checked={settings.notifications.userWelcomeEmail}
                        onChange={(e) => handleSettingChange('notifications', 'userWelcomeEmail', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="userWelcomeEmail" className="text-sm font-medium text-charcoal">
                        Send Welcome Emails
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="transactionEmails"
                        checked={settings.notifications.transactionEmails}
                        onChange={(e) => handleSettingChange('notifications', 'transactionEmails', e.target.checked)}
                        className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="transactionEmails" className="text-sm font-medium text-charcoal">
                        Send Transaction Emails
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-charcoal mb-4">Integration Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal mb-4">Payment Processing</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="stripeEnabled"
                          checked={settings.integrations.stripeEnabled}
                          onChange={(e) => handleSettingChange('integrations', 'stripeEnabled', e.target.checked)}
                          className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="stripeEnabled" className="text-sm font-medium text-charcoal">
                          Enable Stripe Integration
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">Stripe Public Key</label>
                          <input
                            type="text"
                            value={settings.integrations.stripePublicKey}
                            onChange={(e) => handleSettingChange('integrations', 'stripePublicKey', e.target.value)}
                            className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">Stripe Secret Key</label>
                          <input
                            type="password"
                            value={settings.integrations.stripeSecretKey}
                            onChange={(e) => handleSettingChange('integrations', 'stripeSecretKey', e.target.value)}
                            className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-charcoal mb-4">IPFS Storage</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="ipfsEnabled"
                          checked={settings.integrations.ipfsEnabled}
                          onChange={(e) => handleSettingChange('integrations', 'ipfsEnabled', e.target.checked)}
                          className="rounded border-light-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="ipfsEnabled" className="text-sm font-medium text-charcoal">
                          Enable IPFS Storage
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">IPFS Gateway</label>
                        <input
                          type="url"
                          value={settings.integrations.ipfsGateway}
                          onChange={(e) => handleSettingChange('integrations', 'ipfsGateway', e.target.value)}
                          className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-charcoal mb-4">Blockchain</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">Blockchain Network</label>
                          <select
                            value={settings.integrations.blockchainNetwork}
                            onChange={(e) => handleSettingChange('integrations', 'blockchainNetwork', e.target.value)}
                            className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="ethereum">Ethereum</option>
                            <option value="polygon">Polygon</option>
                            <option value="binance">Binance Smart Chain</option>
                            <option value="avalanche">Avalanche</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">Contract Address</label>
                          <input
                            type="text"
                            value={settings.integrations.contractAddress}
                            onChange={(e) => handleSettingChange('integrations', 'contractAddress', e.target.value)}
                            className="w-full p-3 border border-light-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}