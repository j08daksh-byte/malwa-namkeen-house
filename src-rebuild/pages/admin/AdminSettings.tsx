import { useState, useEffect } from 'react';
import { adminApi, type SettingRow } from '../../lib/adminApi.ts';
import { PageHeader, Card, Input, Textarea, Btn, Spinner } from '../../components/admin/ui.tsx';

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [edits,    setEdits]    = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});
  const [alerts,   setAlerts]   = useState<Record<string, { type: 'success'|'error'; msg: string }>>({});

  useEffect(() => {
    adminApi.settings()
      .then(r => { setSettings(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function getVal(key: string) {
    return key in edits ? edits[key] : (settings.find(s => s.key === key)?.value ?? '');
  }

  async function save(key: string) {
    setSaving(s => ({ ...s, [key]: true }));
    setAlerts(a => { const n = { ...a }; delete n[key]; return n; });
    try {
      await adminApi.updateSetting(key, edits[key] ?? getVal(key));
      setSettings(ss => ss.map(s => s.key === key ? { ...s, value: edits[key] ?? s.value } : s));
      setAlerts(a => ({ ...a, [key]: { type: 'success', msg: 'Saved.' } }));
    } catch (e: unknown) {
      setAlerts(a => ({ ...a, [key]: { type: 'error', msg: e instanceof Error ? e.message : 'Save failed.' } }));
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  }

  if (loading) return <><PageHeader title="Settings" /><Spinner /></>;

  return (
    <>
      <PageHeader
        title="Business Settings"
        subtitle="Manage public-facing content. Changes are reflected on the website immediately."
      />

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {settings.map(s => (
            <SettingRow
              key={s.key}
              setting={s}
              value={getVal(s.key)}
              onChange={v => setEdits(e => ({ ...e, [s.key]: v }))}
              onSave={() => save(s.key)}
              saving={saving[s.key] ?? false}
              alert={alerts[s.key]}
            />
          ))}
          {settings.length === 0 && (
            <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No settings found. Run the migration to seed default settings.</p>
          )}
        </div>
      </Card>
    </>
  );
}

function SettingRow({
  setting, value, onChange, onSave, saving, alert,
}: {
  setting: SettingRow;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  alert?: { type: 'success'|'error'; msg: string };
}) {
  const isLong = value.length > 80 || setting.key.includes('description') || setting.key.includes('address');

  return (
    <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#1A0A0F', marginBottom: '2px' }}>
            {setting.label ?? setting.key}
            {setting.is_public && (
              <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Public</span>
            )}
          </div>
          {setting.description && (
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{setting.description}</div>
          )}
        </div>
        <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLong ? (
            <Textarea rows={3} value={value} onChange={e => onChange(e.target.value)} />
          ) : (
            <Input value={value} onChange={e => onChange(e.target.value)} placeholder={setting.key.includes('url') ? 'https://…' : ''} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Btn variant="primary" size="sm" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</Btn>
            {alert && (
              <span style={{ fontSize: '12.5px', fontWeight: 500, color: alert.type === 'success' ? '#065F46' : '#991B1B' }}>{alert.msg}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
