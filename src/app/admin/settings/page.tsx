'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Settings {
  enabled: boolean;
  schedule: string;
  hnEnabled: boolean;
  hnMinScore: number;
  redditEnabled: boolean;
  subreddits: string[];
  topics: string[];
  relevanceThreshold: number;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Settings>({
    enabled: false,
    schedule: '0 2 * * *',
    hnEnabled: true,
    hnMinScore: 100,
    redditEnabled: true,
    subreddits: ['programming', 'MachineLearning', 'LocalLLaMA', 'ExperiencedDevs'],
    topics: ['AI', 'LLM', 'distributed systems', 'Kafka', 'Flink', 'data engineering'],
    relevanceThreshold: 0.7,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setConfig(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Automation Settings</h1>
        <p className="text-muted-foreground">Configure background content monitoring</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <h3 className="font-medium">Enable Automation</h3>
            <p className="text-sm text-muted-foreground">Run background jobs to monitor sources</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-foreground peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>

        <div className="space-y-4 p-4 border border-border rounded-lg">
          <h3 className="font-medium">Schedule</h3>
          <input
            type="text"
            value={config.schedule}
            onChange={(e) => setConfig({ ...config, schedule: e.target.value })}
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm font-mono"
            placeholder="Cron expression"
          />
          <p className="text-xs text-muted-foreground">Cron expression (default: 2:00 AM daily)</p>
        </div>

        <div className="space-y-4 p-4 border border-border rounded-lg">
          <h3 className="font-medium">Topics to Monitor</h3>
          <input
            type="text"
            value={config.topics.join(', ')}
            onChange={(e) => setConfig({ ...config, topics: e.target.value.split(',').map(s => s.trim()) })}
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            placeholder="AI, LLM, distributed systems..."
          />
        </div>

        <div className="space-y-4 p-4 border border-border rounded-lg">
          <h3 className="font-medium">Subreddits</h3>
          <input
            type="text"
            value={config.subreddits.join(', ')}
            onChange={(e) => setConfig({ ...config, subreddits: e.target.value.split(',').map(s => s.trim()) })}
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            placeholder="programming, MachineLearning..."
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
